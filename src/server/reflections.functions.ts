import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { isStaff } from '#/lib/types'
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from '#/lib/supabase/server'

import type {
  ActivityType,
  ReflectionStatus,
  UserRole,
} from '#/lib/supabase/enums'

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

interface ReflectionItem {
  rotaEntryId: string
  entryDate: string
  activityType: ActivityType
  activityLabel: string
  reflectionId: string | null
  status: ReflectionStatus
  whatWentWell: string | null
  whatCouldBeImproved: string | null
  keyLearningPoints: string | null
  followUpActions: string | null
}

/**
 * Every past education/Sim session is a reflection prompt (spec.md §4), but
 * reflections are only materialised into a row once a fellow first touches
 * one (writes a draft, completes it, or dismisses it) — most past sessions
 * have no `reflections` row at all, which counts as "outstanding".
 */
export const getMyReflections = createServerFn({ method: 'GET' }).handler(
  async () => {
    const fellow = await requireCurrentFellow()
    const supabase = createSupabaseServerClient()
    const today = new Date().toISOString().slice(0, 10)

    const [
      { data: sessions, error: sessionsError },
      { data: reflections, error: reflectionsError },
      { data: actions, error: actionsError },
    ] = await Promise.all([
      supabase
        .from('rota_entries')
        .select('id, entry_date, activity_type, activity_label')
        .eq('fellow_id', fellow.id)
        .in('activity_type', ['education', 'sim'])
        .lt('entry_date', today)
        .order('entry_date', { ascending: false })
        .returns<
          Array<{
            id: string
            entry_date: string
            activity_type: ActivityType
            activity_label: string
          }>
        >(),
      supabase
        .from('reflections')
        .select(
          'id, rota_entry_id, status, what_went_well, what_could_be_improved, key_learning_points, follow_up_actions',
        )
        .eq('fellow_id', fellow.id)
        .returns<
          Array<{
            id: string
            rota_entry_id: string
            status: ReflectionStatus
            what_went_well: string | null
            what_could_be_improved: string | null
            key_learning_points: string | null
            follow_up_actions: string | null
          }>
        >(),
      supabase
        .from('reflection_actions')
        .select(
          'id, action_text, is_done, done_at, reflection_id, rota_entry_id, created_at',
        )
        .eq('fellow_id', fellow.id)
        .order('is_done', { ascending: true })
        .order('created_at', { ascending: false })
        .returns<
          Array<{
            id: string
            action_text: string
            is_done: boolean
            done_at: string | null
            reflection_id: string | null
            rota_entry_id: string | null
            created_at: string
          }>
        >(),
    ])

    if (sessionsError) throw sessionsError
    if (reflectionsError) throw reflectionsError
    if (actionsError) throw actionsError

    const byRotaEntry = new Map(reflections.map((r) => [r.rota_entry_id, r]))

    const outstanding: Array<ReflectionItem> = []
    const completed: Array<ReflectionItem> = []
    const dismissed: Array<ReflectionItem> = []

    for (const session of sessions) {
      const reflection = byRotaEntry.get(session.id)
      const item: ReflectionItem = {
        rotaEntryId: session.id,
        entryDate: session.entry_date,
        activityType: session.activity_type,
        activityLabel: session.activity_label,
        reflectionId: reflection?.id ?? null,
        status: reflection?.status ?? 'not_started',
        whatWentWell: reflection?.what_went_well ?? null,
        whatCouldBeImproved: reflection?.what_could_be_improved ?? null,
        keyLearningPoints: reflection?.key_learning_points ?? null,
        followUpActions: reflection?.follow_up_actions ?? null,
      }
      if (item.status === 'complete') completed.push(item)
      else if (item.status === 'dismissed') dismissed.push(item)
      else outstanding.push(item)
    }

    return {
      outstanding,
      completed,
      dismissed,
      actions: actions.map((a) => ({
        id: a.id,
        actionText: a.action_text,
        isDone: a.is_done,
        doneAt: a.done_at,
        reflectionId: a.reflection_id,
        rotaEntryId: a.rota_entry_id,
      })),
    }
  },
)

interface AdminReflectionItem extends ReflectionItem {
  fellowId: string
  fellowName: string
}

/**
 * Staff-only, read-only view across every fellow's reflections — reads via
 * the admin client since reflections are otherwise private to the owning
 * fellow (spec.md §5 access rules: "staff read reflections through
 * server-side tools only").
 */
export const getAllReflections = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireStaff()
    const admin = createSupabaseAdminClient()
    const today = new Date().toISOString().slice(0, 10)

    const [
      { data: fellows, error: fellowsError },
      { data: sessions, error: sessionsError },
      { data: reflections, error: reflectionsError },
    ] = await Promise.all([
      admin
        .from('profiles')
        .select('id, name')
        .eq('is_active', true)
        .in('role', ['fellow', 'lead_fellow'])
        .order('name')
        .returns<Array<{ id: string; name: string }>>(),
      admin
        .from('rota_entries')
        .select(
          'id, fellow_id, entry_date, activity_type, activity_label, profiles!inner(name, role)',
        )
        .in('activity_type', ['education', 'sim'])
        .lt('entry_date', today)
        .in('profiles.role', ['fellow', 'lead_fellow'])
        .order('entry_date', { ascending: false })
        .returns<
          Array<{
            id: string
            fellow_id: string
            entry_date: string
            activity_type: ActivityType
            activity_label: string
            profiles: { name: string; role: UserRole }
          }>
        >(),
      admin
        .from('reflections')
        .select(
          'id, rota_entry_id, status, what_went_well, what_could_be_improved, key_learning_points, follow_up_actions',
        )
        .returns<
          Array<{
            id: string
            rota_entry_id: string
            status: ReflectionStatus
            what_went_well: string | null
            what_could_be_improved: string | null
            key_learning_points: string | null
            follow_up_actions: string | null
          }>
        >(),
    ])

    if (fellowsError) throw fellowsError
    if (sessionsError) throw sessionsError
    if (reflectionsError) throw reflectionsError

    const byRotaEntry = new Map(reflections.map((r) => [r.rota_entry_id, r]))

    const outstanding: Array<AdminReflectionItem> = []
    const completed: Array<AdminReflectionItem> = []
    const dismissed: Array<AdminReflectionItem> = []

    for (const session of sessions) {
      const reflection = byRotaEntry.get(session.id)
      const item: AdminReflectionItem = {
        rotaEntryId: session.id,
        fellowId: session.fellow_id,
        fellowName: session.profiles.name,
        entryDate: session.entry_date,
        activityType: session.activity_type,
        activityLabel: session.activity_label,
        reflectionId: reflection?.id ?? null,
        status: reflection?.status ?? 'not_started',
        whatWentWell: reflection?.what_went_well ?? null,
        whatCouldBeImproved: reflection?.what_could_be_improved ?? null,
        keyLearningPoints: reflection?.key_learning_points ?? null,
        followUpActions: reflection?.follow_up_actions ?? null,
      }
      if (item.status === 'complete') completed.push(item)
      else if (item.status === 'dismissed') dismissed.push(item)
      else outstanding.push(item)
    }

    return { fellows, outstanding, completed, dismissed }
  },
)

async function requireOwnRotaEntry(fellowId: string, rotaEntryId: string) {
  const admin = createSupabaseAdminClient()
  const { data: entry } = await admin
    .from('rota_entries')
    .select('fellow_id')
    .eq('id', rotaEntryId)
    .maybeSingle()
    .returns<{ fellow_id: string }>()
  if (!entry || entry.fellow_id !== fellowId)
    throw new Error('Not your session.')
}

const reflectionFields = z.object({
  rotaEntryId: z.string().uuid(),
  whatWentWell: z.string().optional(),
  whatCouldBeImproved: z.string().optional(),
  keyLearningPoints: z.string().optional(),
  followUpActions: z.string().optional(),
  status: z.enum(['in_progress', 'complete']),
})

export const saveReflection = createServerFn({ method: 'POST' })
  .validator(reflectionFields)
  .handler(async ({ data }) => {
    const fellow = await requireCurrentFellow()
    await requireOwnRotaEntry(fellow.id, data.rotaEntryId)

    const admin = createSupabaseAdminClient()
    const { data: saved, error } = await admin
      .from('reflections')
      .upsert(
        {
          rota_entry_id: data.rotaEntryId,
          fellow_id: fellow.id,
          what_went_well: data.whatWentWell || null,
          what_could_be_improved: data.whatCouldBeImproved || null,
          key_learning_points: data.keyLearningPoints || null,
          follow_up_actions: data.followUpActions || null,
          status: data.status,
        },
        { onConflict: 'rota_entry_id' },
      )
      .select('id')
      .single()
    if (error) throw error

    return { id: saved.id }
  })

export const dismissReflection = createServerFn({ method: 'POST' })
  .validator(z.object({ rotaEntryId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const fellow = await requireCurrentFellow()
    await requireOwnRotaEntry(fellow.id, data.rotaEntryId)

    const admin = createSupabaseAdminClient()
    const { error } = await admin.from('reflections').upsert(
      {
        rota_entry_id: data.rotaEntryId,
        fellow_id: fellow.id,
        status: 'dismissed',
      },
      { onConflict: 'rota_entry_id' },
    )
    if (error) throw error

    return { ok: true as const }
  })

export const restoreReflection = createServerFn({ method: 'POST' })
  .validator(z.object({ reflectionId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const fellow = await requireCurrentFellow()
    const admin = createSupabaseAdminClient()

    const { error } = await admin
      .from('reflections')
      .update({ status: 'not_started' })
      .eq('id', data.reflectionId)
      .eq('fellow_id', fellow.id)
      .select('id')
      .single()
    if (error) throw error

    return { ok: true as const }
  })

export const createAction = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      actionText: z.string().min(1),
      reflectionId: z.string().uuid().optional(),
      rotaEntryId: z.string().uuid().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const fellow = await requireCurrentFellow()
    const admin = createSupabaseAdminClient()

    const { data: inserted, error } = await admin
      .from('reflection_actions')
      .insert({
        fellow_id: fellow.id,
        reflection_id: data.reflectionId,
        rota_entry_id: data.rotaEntryId,
        action_text: data.actionText,
      })
      .select('id')
      .single()
    if (error) throw error

    return { id: inserted.id }
  })

export const toggleAction = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid(), isDone: z.boolean() }))
  .handler(async ({ data }) => {
    const fellow = await requireCurrentFellow()
    const admin = createSupabaseAdminClient()

    const { error } = await admin
      .from('reflection_actions')
      .update({
        is_done: data.isDone,
        done_at: data.isDone ? new Date().toISOString() : null,
      })
      .eq('id', data.id)
      .eq('fellow_id', fellow.id)
      .select('id')
      .single()
    if (error) throw error

    return { ok: true as const }
  })

export const deleteAction = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const fellow = await requireCurrentFellow()
    const admin = createSupabaseAdminClient()

    const { error } = await admin
      .from('reflection_actions')
      .delete()
      .eq('id', data.id)
      .eq('fellow_id', fellow.id)
    if (error) throw error

    return { ok: true as const }
  })
