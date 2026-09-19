import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { formatUkDate } from '#/lib/dates'
import { sendEmail } from '#/lib/email'
import { isStaff } from '#/lib/types'
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from '#/lib/supabase/server'

import type {
  ActivityType,
  SwapStatus,
  TimeSlot,
  UserRole,
} from '#/lib/supabase/enums'

interface EntrySnapshot {
  id: string
  fellow_id: string
  entry_date: string
  time_slot: TimeSlot
  activity_type: ActivityType
  activity_label: string
}

interface FellowSnapshot {
  id: string
  name: string
  email: string
}

async function requireCurrentFellow() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, email, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()
    .returns<{ id: string; name: string; email: string; role: UserRole }>()

  if (!profile) throw new Error('No active profile for this account.')
  return profile
}

async function requireStaff() {
  const fellow = await requireCurrentFellow()
  if (!isStaff(fellow.role)) throw new Error('Staff only.')
  return fellow
}

function sessionLine(entry: {
  entry_date: string
  time_slot: TimeSlot
  activity_label: string
}): string {
  return `${entry.activity_label} on ${formatUkDate(entry.entry_date)} (${entry.time_slot})`
}

async function fetchEntry(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  id: string,
): Promise<EntrySnapshot> {
  const { data, error } = await admin
    .from('rota_entries')
    .select(
      'id, fellow_id, entry_date, time_slot, activity_type, activity_label',
    )
    .eq('id', id)
    .maybeSingle()
    .returns<EntrySnapshot>()
  if (error) throw error
  if (!data) throw new Error('Session not found.')
  return data
}

async function fetchFellow(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  id: string,
): Promise<FellowSnapshot> {
  const { data, error } = await admin
    .from('profiles')
    .select('id, name, email')
    .eq('id', id)
    .maybeSingle()
    .returns<FellowSnapshot>()
  if (error) throw error
  if (!data) throw new Error('Fellow not found.')
  return data
}

/**
 * Flips any pending swap whose session date has passed to 'expired' and
 * emails both parties. There is no background job (spec.md §4-style lazy
 * derivation, as used by /reflections): this runs inline whenever a swap is
 * read or acted on. The conditional `.eq('status', 'pending')` on the update
 * makes the flip — and so the email — happen exactly once per row even if
 * two requests race.
 */
async function expirePastPendingSwaps(
  admin: ReturnType<typeof createSupabaseAdminClient>,
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)

  const { data: candidates, error: candidatesError } = await admin
    .from('swap_requests')
    .select(
      'id, requesting_fellow_id, target_fellow_id, rota_entries!inner(entry_date, time_slot, activity_label)',
    )
    .eq('status', 'pending')
    .lt('rota_entries.entry_date', today)
    .returns<
      Array<{
        id: string
        requesting_fellow_id: string
        target_fellow_id: string
        rota_entries: {
          entry_date: string
          time_slot: TimeSlot
          activity_label: string
        }
      }>
    >()
  if (candidatesError) throw candidatesError
  if (candidates.length === 0) return

  const { data: expired, error: updateError } = await admin
    .from('swap_requests')
    .update({ status: 'expired', resolved_at: new Date().toISOString() })
    .in(
      'id',
      candidates.map((c) => c.id),
    )
    .eq('status', 'pending')
    .select('id')
  if (updateError) throw updateError

  const expiredIds = new Set(expired.map((e) => e.id))
  const toNotify = candidates.filter((c) => expiredIds.has(c.id))
  if (toNotify.length === 0) return

  const fellowIds = [
    ...new Set(
      toNotify.flatMap((c) => [c.requesting_fellow_id, c.target_fellow_id]),
    ),
  ]
  const { data: fellows } = await admin
    .from('profiles')
    .select('id, name, email')
    .in('id', fellowIds)
    .returns<Array<FellowSnapshot>>()
  const byId = new Map((fellows ?? []).map((f) => [f.id, f]))

  await Promise.all(
    toNotify.flatMap((c) => {
      const requester = byId.get(c.requesting_fellow_id)
      const target = byId.get(c.target_fellow_id)
      const line = sessionLine(c.rota_entries)
      const emails: Array<Promise<void>> = []
      if (requester) {
        emails.push(
          sendEmail({
            to: requester.email,
            subject: 'Swap request expired',
            html: `<p>Your swap request with ${target?.name ?? 'the other fellow'} for ${line} has expired because the session date has passed.</p>`,
          }),
        )
      }
      if (target) {
        emails.push(
          sendEmail({
            to: target.email,
            subject: 'Swap request expired',
            html: `<p>The swap request from ${requester?.name ?? 'the other fellow'} for ${line} has expired because the session date has passed.</p>`,
          }),
        )
      }
      return emails
    }),
  )
}

interface SwapItem {
  id: string
  rotaEntryId: string
  entryDate: string
  timeSlot: TimeSlot
  activityType: ActivityType
  activityLabel: string
  reason: string | null
  status: SwapStatus
  createdAt: string
  resolvedAt: string | null
  otherFellowId: string
  otherFellowName: string
  direction: 'raised' | 'targeted'
}

export const getMySwaps = createServerFn({ method: 'GET' }).handler(
  async () => {
    const fellow = await requireCurrentFellow()
    const admin = createSupabaseAdminClient()
    await expirePastPendingSwaps(admin)

    const supabase = createSupabaseServerClient()
    const today = new Date().toISOString().slice(0, 10)

    const [
      { data: mySessions, error: sessionsError },
      { data: roster, error: rosterError },
      { data: raised, error: raisedError },
      { data: targeted, error: targetedError },
    ] = await Promise.all([
      supabase
        .from('rota_entries')
        .select('id, entry_date, time_slot, activity_type, activity_label')
        .eq('fellow_id', fellow.id)
        .gte('entry_date', today)
        .order('entry_date', { ascending: true })
        .returns<
          Array<{
            id: string
            entry_date: string
            time_slot: TimeSlot
            activity_type: ActivityType
            activity_label: string
          }>
        >(),
      supabase
        .from('profiles')
        .select('id, name')
        .eq('is_active', true)
        .in('role', ['fellow', 'lead_fellow'])
        .neq('id', fellow.id)
        .order('name')
        .returns<Array<{ id: string; name: string }>>(),
      supabase
        .from('swap_requests')
        .select(
          'id, rota_entry_id, reason, status, created_at, resolved_at, target_fellow_id, rota_entries!inner(entry_date, time_slot, activity_type, activity_label), target:profiles!swap_requests_target_fellow_id_fkey(name)',
        )
        .eq('requesting_fellow_id', fellow.id)
        .order('created_at', { ascending: false })
        .returns<
          Array<{
            id: string
            rota_entry_id: string
            reason: string | null
            status: SwapStatus
            created_at: string
            resolved_at: string | null
            target_fellow_id: string
            rota_entries: {
              entry_date: string
              time_slot: TimeSlot
              activity_type: ActivityType
              activity_label: string
            }
            target: { name: string }
          }>
        >(),
      supabase
        .from('swap_requests')
        .select(
          'id, rota_entry_id, reason, status, created_at, resolved_at, requesting_fellow_id, rota_entries!inner(entry_date, time_slot, activity_type, activity_label), requester:profiles!swap_requests_requesting_fellow_id_fkey(name)',
        )
        .eq('target_fellow_id', fellow.id)
        .order('created_at', { ascending: false })
        .returns<
          Array<{
            id: string
            rota_entry_id: string
            reason: string | null
            status: SwapStatus
            created_at: string
            resolved_at: string | null
            requesting_fellow_id: string
            rota_entries: {
              entry_date: string
              time_slot: TimeSlot
              activity_type: ActivityType
              activity_label: string
            }
            requester: { name: string }
          }>
        >(),
    ])

    if (sessionsError) throw sessionsError
    if (rosterError) throw rosterError
    if (raisedError) throw raisedError
    if (targetedError) throw targetedError

    const raisedItems: Array<SwapItem> = raised.map((r) => ({
      id: r.id,
      rotaEntryId: r.rota_entry_id,
      entryDate: r.rota_entries.entry_date,
      timeSlot: r.rota_entries.time_slot,
      activityType: r.rota_entries.activity_type,
      activityLabel: r.rota_entries.activity_label,
      reason: r.reason,
      status: r.status,
      createdAt: r.created_at,
      resolvedAt: r.resolved_at,
      otherFellowId: r.target_fellow_id,
      otherFellowName: r.target.name,
      direction: 'raised',
    }))

    const targetedItems: Array<SwapItem> = targeted.map((r) => ({
      id: r.id,
      rotaEntryId: r.rota_entry_id,
      entryDate: r.rota_entries.entry_date,
      timeSlot: r.rota_entries.time_slot,
      activityType: r.rota_entries.activity_type,
      activityLabel: r.rota_entries.activity_label,
      reason: r.reason,
      status: r.status,
      createdAt: r.created_at,
      resolvedAt: r.resolved_at,
      otherFellowId: r.requesting_fellow_id,
      otherFellowName: r.requester.name,
      direction: 'targeted',
    }))

    return {
      myFellowId: fellow.id,
      mySessions,
      roster,
      raised: raisedItems,
      targeted: targetedItems,
    }
  },
)

export const createSwapRequest = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      rotaEntryId: z.string().uuid(),
      targetFellowId: z.string().uuid(),
      reason: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const fellow = await requireCurrentFellow()
    if (data.targetFellowId === fellow.id) {
      throw new Error('You cannot raise a swap request against yourself.')
    }

    const admin = createSupabaseAdminClient()
    const entry = await fetchEntry(admin, data.rotaEntryId)

    if (entry.fellow_id !== fellow.id) {
      throw new Error('You can only raise a swap request for your own session.')
    }

    const today = new Date().toISOString().slice(0, 10)
    if (entry.entry_date < today) {
      throw new Error('You can only raise a swap request for a future session.')
    }

    const target = await fetchFellow(admin, data.targetFellowId)

    const { data: existing } = await admin
      .from('swap_requests')
      .select('id')
      .eq('rota_entry_id', entry.id)
      .eq('status', 'pending')
      .maybeSingle()
    if (existing) {
      throw new Error('A swap request is already pending for this session.')
    }

    const { data: inserted, error } = await admin
      .from('swap_requests')
      .insert({
        rota_entry_id: entry.id,
        requesting_fellow_id: fellow.id,
        target_fellow_id: target.id,
        reason: data.reason || null,
      })
      .select('id')
      .single()
    if (error) throw error

    await sendEmail({
      to: target.email,
      subject: 'New swap request',
      html: `<p>${fellow.name} would like to swap their ${sessionLine(entry)} session with you.</p>${
        data.reason ? `<p>Reason: ${data.reason}</p>` : ''
      }<p>Review it on the /swaps page.</p>`,
    })

    return { id: inserted.id }
  })

function statusError(status: SwapStatus): Error {
  if (status === 'expired') return new Error('This swap request has expired.')
  return new Error('This swap request has already been resolved.')
}

async function loadPendingSwap(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  id: string,
) {
  const { data, error } = await admin
    .from('swap_requests')
    .select(
      'id, status, requesting_fellow_id, target_fellow_id, rota_entry_id, reason',
    )
    .eq('id', id)
    .maybeSingle()
    .returns<{
      id: string
      status: SwapStatus
      requesting_fellow_id: string
      target_fellow_id: string
      rota_entry_id: string
      reason: string | null
    }>()
  if (error) throw error
  if (!data) throw new Error('Swap request not found.')
  return data
}

export const acceptSwapRequest = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const fellow = await requireCurrentFellow()
    const admin = createSupabaseAdminClient()
    await expirePastPendingSwaps(admin)

    const swap = await loadPendingSwap(admin, data.id)
    if (swap.target_fellow_id !== fellow.id) {
      throw new Error('Only the target fellow can accept this request.')
    }
    if (swap.status !== 'pending') throw statusError(swap.status)

    const entry = await fetchEntry(admin, swap.rota_entry_id)
    if (entry.fellow_id !== swap.requesting_fellow_id) {
      throw new Error(
        'This session has changed hands since the request was made.',
      )
    }

    const { data: targetDayEntries, error: dayError } = await admin
      .from('rota_entries')
      .select('id, time_slot')
      .eq('fellow_id', fellow.id)
      .eq('entry_date', entry.entry_date)
      .returns<Array<{ id: string; time_slot: TimeSlot }>>()
    if (dayError) throw dayError

    const conflict = targetDayEntries.some(
      (e) =>
        e.time_slot === entry.time_slot ||
        e.time_slot === 'ALL_DAY' ||
        entry.time_slot === 'ALL_DAY',
    )
    if (conflict) {
      throw new Error(
        `You already have a session on ${formatUkDate(entry.entry_date)} that overlaps with this slot.`,
      )
    }

    const requester = await fetchFellow(admin, swap.requesting_fellow_id)

    const { error: reassignError } = await admin
      .from('rota_entries')
      .update({ fellow_id: fellow.id })
      .eq('id', entry.id)
    if (reassignError) throw reassignError

    const summary = `Swap accepted: ${sessionLine(entry)} moved from ${requester.name} to ${fellow.name}`
    const { error: changesError } = await admin.from('rota_changes').insert([
      {
        rota_entry_id: entry.id,
        fellow_id: requester.id,
        entry_date: entry.entry_date,
        action: 'reassign',
        summary,
        changed_by: fellow.id,
        changed_by_name: fellow.name,
      },
      {
        rota_entry_id: entry.id,
        fellow_id: fellow.id,
        entry_date: entry.entry_date,
        action: 'reassign',
        summary,
        changed_by: fellow.id,
        changed_by_name: fellow.name,
      },
    ])
    if (changesError) throw changesError

    const { error: resolveError } = await admin
      .from('swap_requests')
      .update({ status: 'accepted', resolved_at: new Date().toISOString() })
      .eq('id', swap.id)
    if (resolveError) throw resolveError

    await sendEmail({
      to: requester.email,
      subject: 'Swap request accepted',
      html: `<p>${fellow.name} accepted your swap request for ${sessionLine(entry)}.</p>`,
    })

    return { ok: true as const }
  })

export const declineSwapRequest = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const fellow = await requireCurrentFellow()
    const admin = createSupabaseAdminClient()
    await expirePastPendingSwaps(admin)

    const swap = await loadPendingSwap(admin, data.id)
    if (swap.target_fellow_id !== fellow.id) {
      throw new Error('Only the target fellow can decline this request.')
    }
    if (swap.status !== 'pending') throw statusError(swap.status)

    const entry = await fetchEntry(admin, swap.rota_entry_id)
    const requester = await fetchFellow(admin, swap.requesting_fellow_id)

    const { error } = await admin
      .from('swap_requests')
      .update({ status: 'declined', resolved_at: new Date().toISOString() })
      .eq('id', swap.id)
    if (error) throw error

    await sendEmail({
      to: requester.email,
      subject: 'Swap request declined',
      html: `<p>${fellow.name} declined your swap request for ${sessionLine(entry)}.</p>`,
    })

    return { ok: true as const }
  })

/**
 * Requester-only, pending-only. Stays silent — the target hasn't acted on
 * the request, so there is nothing to notify them of.
 */
export const cancelSwapRequest = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const fellow = await requireCurrentFellow()
    const admin = createSupabaseAdminClient()
    await expirePastPendingSwaps(admin)

    const swap = await loadPendingSwap(admin, data.id)
    if (swap.requesting_fellow_id !== fellow.id) {
      throw new Error('Only the requesting fellow can cancel this request.')
    }
    if (swap.status !== 'pending') throw statusError(swap.status)

    const { error } = await admin
      .from('swap_requests')
      .update({ status: 'cancelled', resolved_at: new Date().toISOString() })
      .eq('id', swap.id)
    if (error) throw error

    return { ok: true as const }
  })

interface AdminSwapItem {
  id: string
  entryDate: string
  timeSlot: TimeSlot
  activityLabel: string
  requestingFellowName: string
  targetFellowName: string
  reason: string | null
  status: SwapStatus
  createdAt: string
  resolvedAt: string | null
}

export const getAllSwaps = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireStaff()
    const admin = createSupabaseAdminClient()
    await expirePastPendingSwaps(admin)

    const { data, error } = await admin
      .from('swap_requests')
      .select(
        'id, reason, status, created_at, resolved_at, rota_entries!inner(entry_date, time_slot, activity_label), requester:profiles!swap_requests_requesting_fellow_id_fkey(name), target:profiles!swap_requests_target_fellow_id_fkey(name)',
      )
      .order('created_at', { ascending: false })
      .returns<
        Array<{
          id: string
          reason: string | null
          status: SwapStatus
          created_at: string
          resolved_at: string | null
          rota_entries: {
            entry_date: string
            time_slot: TimeSlot
            activity_label: string
          }
          requester: { name: string }
          target: { name: string }
        }>
      >()
    if (error) throw error

    const items: Array<AdminSwapItem> = data.map((r) => ({
      id: r.id,
      entryDate: r.rota_entries.entry_date,
      timeSlot: r.rota_entries.time_slot,
      activityLabel: r.rota_entries.activity_label,
      requestingFellowName: r.requester.name,
      targetFellowName: r.target.name,
      reason: r.reason,
      status: r.status,
      createdAt: r.created_at,
      resolvedAt: r.resolved_at,
    }))

    return { swaps: items }
  },
)
