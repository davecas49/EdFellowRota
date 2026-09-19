import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { formatUkDate } from '#/lib/dates'
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from '#/lib/supabase/server'

import type {
  ActivityType,
  FellowTier,
  TimeSlot,
  UserRole,
} from '#/lib/supabase/enums'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

async function requireCurrentProfile() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()
    .returns<{ id: string; name: string; role: UserRole }>()

  if (!profile) throw new Error('No active profile for this account.')
  return profile
}

/** Insert a `rota_changes` row. Never trust the client for who made the change. */
async function logRotaChange(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  actingProfile: { id: string; name: string },
  entry: {
    rotaEntryId: string | null
    fellowId: string | null
    entryDate: string | null
  },
  action: 'create' | 'update' | 'move' | 'reassign' | 'delete',
  summary: string,
) {
  const { error } = await admin.from('rota_changes').insert({
    rota_entry_id: entry.rotaEntryId,
    fellow_id: entry.fellowId,
    entry_date: entry.entryDate,
    action,
    summary,
    changed_by: actingProfile.id,
    changed_by_name: actingProfile.name,
  })
  if (error) throw error
}

const rotaEntryInput = z.object({
  fellowId: z.string().uuid(),
  entryDate: isoDate,
  timeSlot: z.enum(['AM', 'PM', 'ALL_DAY']),
  activityType: z.enum([
    'education',
    'clinical',
    'annual_leave',
    'study_leave',
    'nwd',
    'toil',
    'induction',
    'prep_day',
    'other_leave',
    'other',
    'sim',
  ]),
  activityLabel: z.string().min(1),
  notes: z.string().optional(),
})

export const listRotaEntries = createServerFn({ method: 'GET' })
  .validator(z.object({ from: isoDate, to: isoDate }))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()

    const [
      { data: entries, error: entriesError },
      { data: roster, error: rosterError },
    ] = await Promise.all([
      supabase
        .from('rota_entries')
        .select(
          'id, fellow_id, entry_date, time_slot, activity_type, activity_label, notes, profiles!inner(name, initials, tier)',
        )
        .gte('entry_date', data.from)
        .lte('entry_date', data.to)
        .order('entry_date', { ascending: true })
        .returns<
          Array<{
            id: string
            fellow_id: string
            entry_date: string
            time_slot: TimeSlot
            activity_type: ActivityType
            activity_label: string
            notes: string | null
            profiles: {
              name: string
              initials: string
              tier: FellowTier | null
            }
          }>
        >(),
      supabase
        .from('profiles')
        .select('id, name, initials, tier, role')
        .eq('is_active', true)
        .in('role', ['fellow', 'lead_fellow'])
        .order('name')
        .returns<
          Array<{
            id: string
            name: string
            initials: string
            tier: FellowTier | null
            role: UserRole
          }>
        >(),
    ])

    if (entriesError) throw entriesError
    if (rosterError) throw rosterError

    return {
      roster,
      entries: entries.map((e) => ({
        id: e.id,
        fellowId: e.fellow_id,
        fellowName: e.profiles.name,
        fellowInitials: e.profiles.initials,
        fellowTier: e.profiles.tier,
        entryDate: e.entry_date,
        timeSlot: e.time_slot,
        activityType: e.activity_type,
        activityLabel: e.activity_label,
        notes: e.notes,
      })),
    }
  })

export const createRotaEntry = createServerFn({ method: 'POST' })
  .validator(rotaEntryInput)
  .handler(async ({ data }) => {
    const actor = await requireCurrentProfile()
    const admin = createSupabaseAdminClient()

    const { data: fellow } = await admin
      .from('profiles')
      .select('name')
      .eq('id', data.fellowId)
      .maybeSingle()
      .returns<{ name: string }>()

    const { data: inserted, error } = await admin
      .from('rota_entries')
      .insert({
        fellow_id: data.fellowId,
        entry_date: data.entryDate,
        time_slot: data.timeSlot,
        activity_type: data.activityType,
        activity_label: data.activityLabel,
        notes: data.notes || null,
      })
      .select('id')
      .single()
    if (error) throw error

    await logRotaChange(
      admin,
      actor,
      {
        rotaEntryId: inserted.id,
        fellowId: data.fellowId,
        entryDate: data.entryDate,
      },
      'create',
      `Added ${data.activityLabel} (${data.timeSlot}) for ${fellow?.name ?? 'unknown fellow'} on ${formatUkDate(data.entryDate)}`,
    )

    return { id: inserted.id }
  })

export const updateRotaEntry = createServerFn({ method: 'POST' })
  .validator(rotaEntryInput.extend({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const actor = await requireCurrentProfile()
    const admin = createSupabaseAdminClient()

    const { data: before, error: fetchError } = await admin
      .from('rota_entries')
      .select(
        'fellow_id, entry_date, time_slot, activity_type, activity_label, notes',
      )
      .eq('id', data.id)
      .single()
      .returns<{
        fellow_id: string
        entry_date: string
        time_slot: TimeSlot
        activity_type: ActivityType
        activity_label: string
        notes: string | null
      }>()
    if (fetchError) throw fetchError

    const [{ data: oldFellow }, { data: newFellow }] = await Promise.all([
      admin
        .from('profiles')
        .select('name')
        .eq('id', before.fellow_id)
        .maybeSingle()
        .returns<{ name: string }>(),
      before.fellow_id === data.fellowId
        ? Promise.resolve({ data: null })
        : admin
            .from('profiles')
            .select('name')
            .eq('id', data.fellowId)
            .maybeSingle()
            .returns<{ name: string }>(),
    ])

    const { error: updateError } = await admin
      .from('rota_entries')
      .update({
        fellow_id: data.fellowId,
        entry_date: data.entryDate,
        time_slot: data.timeSlot,
        activity_type: data.activityType,
        activity_label: data.activityLabel,
        notes: data.notes || null,
      })
      .eq('id', data.id)
    if (updateError) throw updateError

    const fellowChanged = before.fellow_id !== data.fellowId
    const dateOrSlotChanged =
      before.entry_date !== data.entryDate || before.time_slot !== data.timeSlot

    const diffs: Array<string> = []
    if (
      before.activity_type !== data.activityType ||
      before.activity_label !== data.activityLabel
    ) {
      diffs.push(`activity ${before.activity_label} → ${data.activityLabel}`)
    }
    if ((before.notes ?? '') !== (data.notes ?? '')) {
      diffs.push('notes updated')
    }

    const fellowName = newFellow?.name ?? oldFellow?.name ?? 'unknown fellow'

    let action: 'update' | 'move' | 'reassign'
    let summary: string
    if (fellowChanged) {
      action = 'reassign'
      summary = `Reassigned ${data.activityLabel} on ${formatUkDate(data.entryDate)} ${data.timeSlot} from ${oldFellow?.name ?? 'unknown fellow'} to ${newFellow?.name ?? 'unknown fellow'}`
    } else if (dateOrSlotChanged) {
      action = 'move'
      summary = `Moved ${fellowName}'s ${data.activityLabel} from ${formatUkDate(before.entry_date)} ${before.time_slot} to ${formatUkDate(data.entryDate)} ${data.timeSlot}`
    } else {
      action = 'update'
      summary = `Updated ${fellowName}'s ${formatUkDate(data.entryDate)} ${data.timeSlot} session${diffs.length ? `: ${diffs.join(', ')}` : ''}`
    }

    await logRotaChange(
      admin,
      actor,
      {
        rotaEntryId: data.id,
        fellowId: data.fellowId,
        entryDate: data.entryDate,
      },
      action,
      summary,
    )

    return { id: data.id }
  })

export const checkRotaEntryDependents = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const admin = createSupabaseAdminClient()

    const [
      { count: reflections },
      { count: peerFeedback },
      { count: guestInvites },
      { count: swaps },
    ] = await Promise.all([
      admin
        .from('reflections')
        .select('id', { count: 'exact', head: true })
        .eq('rota_entry_id', data.id),
      admin
        .from('peer_feedback')
        .select('id', { count: 'exact', head: true })
        .eq('rota_entry_id', data.id),
      admin
        .from('guest_feedback_invites')
        .select('id', { count: 'exact', head: true })
        .eq('rota_entry_id', data.id),
      admin
        .from('swap_requests')
        .select('id', { count: 'exact', head: true })
        .eq('rota_entry_id', data.id),
    ])

    return {
      reflections: reflections ?? 0,
      peerFeedback: peerFeedback ?? 0,
      guestInvites: guestInvites ?? 0,
      swaps: swaps ?? 0,
    }
  })

export const deleteRotaEntry = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const actor = await requireCurrentProfile()
    const admin = createSupabaseAdminClient()

    const { data: entry, error: fetchError } = await admin
      .from('rota_entries')
      .select(
        'fellow_id, entry_date, time_slot, activity_label, profiles(name)',
      )
      .eq('id', data.id)
      .single()
      .returns<{
        fellow_id: string
        entry_date: string
        time_slot: TimeSlot
        activity_label: string
        profiles: { name: string } | null
      }>()
    if (fetchError) throw fetchError

    const { error: deleteError } = await admin
      .from('rota_entries')
      .delete()
      .eq('id', data.id)
    if (deleteError) throw deleteError

    await logRotaChange(
      admin,
      actor,
      {
        rotaEntryId: null,
        fellowId: entry.fellow_id,
        entryDate: entry.entry_date,
      },
      'delete',
      `Deleted ${entry.activity_label} (${entry.time_slot}) for ${entry.profiles?.name ?? 'unknown fellow'} on ${formatUkDate(entry.entry_date)}`,
    )

    return { ok: true as const }
  })
