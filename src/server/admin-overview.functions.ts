import { createServerFn } from '@tanstack/react-start'
import { addDays, format, startOfWeek } from 'date-fns'

import { isStaff } from '#/lib/types'
import { createSupabaseAdminClient, createSupabaseServerClient } from '#/lib/supabase/server'
import { getAllReflections } from '#/server/reflections.functions'
import { getAllSwaps } from '#/server/swaps.functions'

import type { UserRole } from '#/lib/supabase/enums'

async function requireCurrentFellow() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()
    .returns<{ id: string; role: UserRole }>()

  if (!profile) throw new Error('No active profile for this account.')
  return profile
}

async function requireStaff() {
  const fellow = await requireCurrentFellow()
  if (!isStaff(fellow.role)) throw new Error('Staff only.')
  return fellow
}

const OVERDUE_DAYS = 30
const ACTIVITY_LIMIT = 20

interface ActivityItem {
  id: string
  at: string
  source: 'rota' | 'import' | 'quality'
  description: string
}

export const getAdminOverview = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireStaff()
    const admin = createSupabaseAdminClient()
    const today = new Date()
    const todayIso = today.toISOString().slice(0, 10)
    const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const weekEnd = format(addDays(startOfWeek(today, { weekStartsOn: 1 }), 4), 'yyyy-MM-dd')

    const [
      { count: activeFellows },
      { count: activeFaculty },
      { count: sessionsThisWeek },
      { outstanding: outstandingReflections },
      { swaps },
      { data: pendingLeave, error: pendingLeaveError },
      { data: rotaChanges, error: rotaChangesError },
      { data: importLog, error: importLogError },
      { data: qualityScores, error: qualityScoresError },
      { data: peerFeedback, error: peerFeedbackError },
      { data: scoredFeedback, error: scoredFeedbackError },
      { data: inactiveRota, error: inactiveRotaError },
    ] = await Promise.all([
      admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'fellow')
        .eq('is_active', true),
      admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'faculty')
        .eq('is_active', true),
      admin
        .from('rota_entries')
        .select('id', { count: 'exact', head: true })
        .gte('entry_date', weekStart)
        .lte('entry_date', weekEnd),
      getAllReflections(),
      getAllSwaps(),
      admin
        .from('leave_dates')
        .select(
          'id, leave_type, leave_date, fellow:profiles!leave_dates_fellow_id_fkey(name)',
        )
        .eq('status', 'pending')
        .order('leave_date')
        .returns<
          Array<{
            id: string
            leave_type: string
            leave_date: string
            fellow: { name: string } | null
          }>
        >(),
      admin
        .from('rota_changes')
        .select('id, created_at, summary')
        .order('created_at', { ascending: false })
        .limit(ACTIVITY_LIMIT)
        .returns<Array<{ id: string; created_at: string; summary: string }>>(),
      admin
        .from('excel_import_log')
        .select('id, imported_at, filename, status, rows_imported, profiles(name)')
        .order('imported_at', { ascending: false })
        .limit(ACTIVITY_LIMIT)
        .returns<
          Array<{
            id: string
            imported_at: string
            filename: string | null
            status: string | null
            rows_imported: number | null
            profiles: { name: string } | null
          }>
        >(),
      admin
        .from('quality_scores')
        .select(
          'id, scored_at, subject_type, overall_score, band, fellow:profiles!quality_scores_fellow_id_fkey(name)',
        )
        .order('scored_at', { ascending: false })
        .limit(ACTIVITY_LIMIT)
        .returns<
          Array<{
            id: string
            scored_at: string
            subject_type: string
            overall_score: number
            band: string
            fellow: { name: string } | null
          }>
        >(),
      admin.from('peer_feedback').select('id'),
      admin
        .from('quality_scores')
        .select('subject_id')
        .eq('subject_type', 'peer_feedback')
        .returns<Array<{ subject_id: string }>>(),
      admin
        .from('rota_entries')
        .select('fellow_id, entry_date, profiles!inner(name, is_active)')
        .gte('entry_date', todayIso)
        .eq('profiles.is_active', false)
        .order('entry_date')
        .returns<
          Array<{
            fellow_id: string
            entry_date: string
            profiles: { name: string; is_active: boolean }
          }>
        >(),
    ])

    if (pendingLeaveError) throw pendingLeaveError
    if (rotaChangesError) throw rotaChangesError
    if (importLogError) throw importLogError
    if (qualityScoresError) throw qualityScoresError
    if (peerFeedbackError) throw peerFeedbackError
    if (scoredFeedbackError) throw scoredFeedbackError
    if (inactiveRotaError) throw inactiveRotaError

    const activity: Array<ActivityItem> = [
      ...rotaChanges.map((r) => ({
        id: r.id,
        at: r.created_at,
        source: 'rota' as const,
        description: r.summary,
      })),
      ...importLog.map((r) => ({
        id: r.id,
        at: r.imported_at,
        source: 'import' as const,
        description: `Imported ${r.filename ?? 'a file'} — ${r.rows_imported ?? 0} rows (${r.status ?? 'unknown'})${r.profiles ? ` by ${r.profiles.name}` : ''}`,
      })),
      ...qualityScores.map((r) => ({
        id: r.id,
        at: r.scored_at,
        source: 'quality' as const,
        description: `Scored ${r.subject_type.replace('_', ' ')} for ${r.fellow?.name ?? 'someone'} — ${r.overall_score} (${r.band})`,
      })),
    ]
      .sort((a, b) => (a.at < b.at ? 1 : -1))
      .slice(0, ACTIVITY_LIMIT)

    const overdueCutoff = format(addDays(today, -OVERDUE_DAYS), 'yyyy-MM-dd')
    const reflectionsOverdue = outstandingReflections
      .filter((r) => r.entryDate < overdueCutoff)
      .map((r) => ({
        fellowName: r.fellowName,
        activityLabel: r.activityLabel,
        entryDate: r.entryDate,
        daysOverdue: Math.floor(
          (today.getTime() - new Date(r.entryDate).getTime()) / 86_400_000,
        ),
      }))

    const scoredFeedbackIds = new Set(scoredFeedback.map((s) => s.subject_id))
    const unscoredFeedbackCount = peerFeedback.filter(
      (f) => !scoredFeedbackIds.has(f.id),
    ).length

    const expiredSwaps = swaps
      .filter((s) => s.status === 'expired')
      .map((s) => ({
        requestingFellowName: s.requestingFellowName,
        targetFellowName: s.targetFellowName,
        entryDate: s.entryDate,
      }))

    const inactiveByFellow = new Map<
      string,
      { fellowName: string; count: number; nextDate: string }
    >()
    for (const row of inactiveRota) {
      const existing = inactiveByFellow.get(row.fellow_id)
      if (existing) {
        existing.count += 1
      } else {
        inactiveByFellow.set(row.fellow_id, {
          fellowName: row.profiles.name,
          count: 1,
          nextDate: row.entry_date,
        })
      }
    }

    return {
      stats: {
        activeFellows: activeFellows ?? 0,
        activeFaculty: activeFaculty ?? 0,
        sessionsThisWeek: sessionsThisWeek ?? 0,
        reflectionsOutstanding: outstandingReflections.length,
      },
      pending: {
        leave: pendingLeave.map((l) => ({
          fellowName: l.fellow?.name ?? 'Unknown',
          leaveType: l.leave_type,
          leaveDate: l.leave_date,
        })),
        swaps: swaps
          .filter((s) => s.status === 'pending')
          .map((s) => ({
            requestingFellowName: s.requestingFellowName,
            targetFellowName: s.targetFellowName,
            entryDate: s.entryDate,
          })),
      },
      activity,
      dataQuality: {
        reflectionsOverdue,
        unscoredFeedbackCount,
        expiredSwaps,
        inactiveInFutureRota: [...inactiveByFellow.values()],
      },
    }
  },
)
