import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { academicYearFor } from '#/lib/academic-year'
import { createSupabaseAdminClient, createSupabaseServerClient } from '#/lib/supabase/server'

/**
 * Activity types that take a fellow away from clinical cover for a slot.
 * Anything else (clinical, other, or no rota entry at all) counts as spare.
 * See spec.md §4 "Automated leave decisions".
 */
const unavailableTypes = [
  'annual_leave',
  'study_leave',
  'education',
  'sim',
  'nwd',
  'toil',
  'induction',
  'prep_day',
  'other_leave',
] as const

const MIN_SPARE = 2

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
    .returns<{ id: string; role: string }>()

  if (!profile) throw new Error('No active profile for this account.')
  return profile
}

/**
 * Decide one requested day per spec.md §4:
 * 1. Timetabled to teach (education or Sim) that day → declined, session named.
 * 2. Otherwise approved only if at least two other fellows are spare in both
 *    the morning and the afternoon (one held back for sickness cover).
 */
async function decideDay(fellowId: string, date: string) {
  const admin = createSupabaseAdminClient()

  const { data: ownSessions } = await admin
    .from('rota_entries')
    .select('activity_label')
    .eq('fellow_id', fellowId)
    .eq('entry_date', date)
    .in('activity_type', ['education', 'sim'])
    .returns<Array<{ activity_label: string }>>()

  if (ownSessions && ownSessions.length > 0) {
    return {
      status: 'declined' as const,
      reason: `Timetabled to teach: ${ownSessions[0].activity_label}`,
    }
  }

  const { data: workforce } = await admin
    .from('profiles')
    .select('id')
    .in('role', ['fellow', 'lead_fellow'])
    .eq('is_active', true)
    .neq('id', fellowId)
    .returns<Array<{ id: string }>>()

  const otherFellowIds = (workforce ?? []).map((f) => f.id)

  const { data: busy } = await admin
    .from('rota_entries')
    .select('fellow_id, time_slot')
    .eq('entry_date', date)
    .in('fellow_id', otherFellowIds)
    .in('activity_type', unavailableTypes)
    .returns<Array<{ fellow_id: string; time_slot: 'AM' | 'PM' | 'ALL_DAY' }>>()

  const busyAm = new Set<string>()
  const busyPm = new Set<string>()
  for (const entry of busy ?? []) {
    if (entry.time_slot === 'AM' || entry.time_slot === 'ALL_DAY') busyAm.add(entry.fellow_id)
    if (entry.time_slot === 'PM' || entry.time_slot === 'ALL_DAY') busyPm.add(entry.fellow_id)
  }

  const spareAm = otherFellowIds.length - busyAm.size
  const sparePm = otherFellowIds.length - busyPm.size

  if (spareAm >= MIN_SPARE && sparePm >= MIN_SPARE) {
    return { status: 'approved' as const, reason: 'Sufficient cover available.' }
  }

  return {
    status: 'declined' as const,
    reason: `Insufficient cover (need ${MIN_SPARE} fellows spare AM and PM; ${spareAm} AM / ${sparePm} PM available).`,
  }
}

export const requestLeave = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      leaveType: z.enum(['annual', 'study']),
      dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1),
      note: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const fellow = await requireCurrentFellow()
    const admin = createSupabaseAdminClient()

    const results = []
    for (const date of [...new Set(data.dates)].sort()) {
      const decision = await decideDay(fellow.id, date)
      const academicYear = academicYearFor(new Date(date))

      const { error } = await admin.from('leave_dates').insert({
        fellow_id: fellow.id,
        leave_type: data.leaveType,
        leave_date: date,
        note: data.note,
        academic_year: academicYear,
        status: decision.status,
        decision_reason: decision.reason,
        decided_automatically: true,
        reviewed_at: new Date().toISOString(),
      })
      if (error) throw error

      if (decision.status === 'approved') {
        const { data: entitlement } = await admin
          .from('leave_entitlements')
          .select('id, days_taken')
          .eq('fellow_id', fellow.id)
          .eq('leave_type', data.leaveType)
          .eq('academic_year', academicYear)
          .maybeSingle()
          .returns<{ id: string; days_taken: number }>()

        if (entitlement) {
          await admin
            .from('leave_entitlements')
            .update({ days_taken: entitlement.days_taken + 1 })
            .eq('id', entitlement.id)
        }
      }

      results.push({ date, ...decision })
    }

    return results
  })

export const getMyLeave = createServerFn({ method: 'GET' }).handler(async () => {
  const fellow = await requireCurrentFellow()
  const supabase = createSupabaseServerClient()
  const academicYear = academicYearFor(new Date())

  const [{ data: entitlements }, { data: leaveDates }] = await Promise.all([
    supabase
      .from('leave_entitlements')
      .select('leave_type, total_entitlement, days_taken')
      .eq('fellow_id', fellow.id)
      .eq('academic_year', academicYear),
    supabase
      .from('leave_dates')
      .select('id, leave_type, leave_date, status, decision_reason, requested_at')
      .eq('fellow_id', fellow.id)
      .eq('academic_year', academicYear)
      .order('leave_date', { ascending: false }),
  ])

  return { academicYear, entitlements: entitlements ?? [], leaveDates: leaveDates ?? [] }
})
