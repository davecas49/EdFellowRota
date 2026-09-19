import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from '#/lib/supabase/server'

import type { ActivityType, UserRole } from '#/lib/supabase/enums'

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

const NHS_DOMAINS = ['nhs.net', 'nhs.uk']

function isNhsEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  return NHS_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))
}

const nhsEmailSchema = z
  .string()
  .email()
  .refine(isNhsEmail, {
    message: 'Guest invites require an NHS email address (@nhs.net or @nhs.uk).',
  })

export const getMyPeerFeedbackData = createServerFn({ method: 'GET' }).handler(
  async () => {
    const profile = await requireCurrentProfile()
    const supabase = createSupabaseServerClient()
    const today = new Date().toISOString().slice(0, 10)

    const [
      { data: sessions, error: sessionsError },
      { data: givenFeedback, error: givenError },
      { data: receivedFeedback, error: receivedError },
      { data: myInvites, error: invitesError },
      { data: roster, error: rosterError },
    ] = await Promise.all([
      supabase
        .from('rota_entries')
        .select(
          'id, fellow_id, entry_date, activity_type, activity_label, profiles!inner(name)',
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
            profiles: { name: string }
          }>
        >(),
      // Feedback genuinely given by me (guest_name IS NULL excludes guest
      // submissions where from_fellow_id = session owner as FK placeholder)
      supabase
        .from('peer_feedback')
        .select('id, rota_entry_id, strengths, development_areas, rating')
        .eq('from_fellow_id', profile.id)
        .is('guest_name', null)
        .returns<
          Array<{
            id: string
            rota_entry_id: string
            strengths: string | null
            development_areas: string | null
            rating: number | null
          }>
        >(),
      // Feedback received on my sessions
      supabase
        .from('peer_feedback')
        .select(
          'id, rota_entry_id, from_fellow_id, strengths, development_areas, rating, submitted_at, guest_name, guest_role',
        )
        .eq('to_fellow_id', profile.id)
        .order('submitted_at', { ascending: false })
        .returns<
          Array<{
            id: string
            rota_entry_id: string
            from_fellow_id: string
            strengths: string | null
            development_areas: string | null
            rating: number | null
            submitted_at: string
            guest_name: string | null
            guest_role: string | null
          }>
        >(),
      supabase
        .from('guest_feedback_invites')
        .select(
          'id, rota_entry_id, guest_email, guest_name, guest_role, status, expires_at, submitted_at',
        )
        .eq('fellow_id', profile.id)
        .order('created_at', { ascending: false })
        .returns<
          Array<{
            id: string
            rota_entry_id: string
            guest_email: string
            guest_name: string | null
            guest_role: string | null
            status: string
            expires_at: string
            submitted_at: string | null
          }>
        >(),
      supabase
        .from('profiles')
        .select('id, name')
        .eq('is_active', true)
        .in('role', ['fellow', 'lead_fellow'])
        .order('name')
        .returns<Array<{ id: string; name: string }>>(),
    ])

    if (sessionsError) throw sessionsError
    if (givenError) throw givenError
    if (receivedError) throw receivedError
    if (invitesError) throw invitesError
    if (rosterError) throw rosterError

    const givenByEntry = new Map(
      (givenFeedback ?? []).map((f) => [f.rota_entry_id, f]),
    )

    const invitesByEntry = new Map<string, typeof myInvites>()
    for (const invite of myInvites ?? []) {
      const list = invitesByEntry.get(invite.rota_entry_id)
      if (list) list.push(invite)
      else invitesByEntry.set(invite.rota_entry_id, [invite])
    }

    const rosterById = new Map((roster ?? []).map((r) => [r.id, r.name]))

    return {
      myProfileId: profile.id,
      sessions: (sessions ?? []).map((s) => ({
        rotaEntryId: s.id,
        fellowId: s.fellow_id,
        fellowName: s.profiles.name,
        entryDate: s.entry_date,
        activityLabel: s.activity_label,
        isMySession: s.fellow_id === profile.id,
        myFeedback: givenByEntry.get(s.id)
          ? {
              id: givenByEntry.get(s.id)!.id,
              strengths: givenByEntry.get(s.id)!.strengths,
              developmentAreas: givenByEntry.get(s.id)!.development_areas,
              rating: givenByEntry.get(s.id)!.rating,
            }
          : null,
        invites: (invitesByEntry.get(s.id) ?? []).map((i) => ({
          id: i.id,
          guestEmail: i.guest_email,
          guestName: i.guest_name,
          guestRole: i.guest_role,
          status: i.status,
          expiresAt: i.expires_at,
          submittedAt: i.submitted_at,
        })),
      })),
      received: (receivedFeedback ?? []).map((f) => ({
        id: f.id,
        rotaEntryId: f.rota_entry_id,
        fromName: f.guest_name ?? rosterById.get(f.from_fellow_id) ?? 'Unknown',
        isGuest: f.guest_name !== null,
        guestRole: f.guest_role,
        strengths: f.strengths,
        developmentAreas: f.development_areas,
        rating: f.rating,
        submittedAt: f.submitted_at,
      })),
    }
  },
)

export const submitPeerFeedback = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      rotaEntryId: z.string().uuid(),
      toFellowId: z.string().uuid(),
      strengths: z.string().optional(),
      developmentAreas: z.string().optional(),
      rating: z.number().int().min(1).max(5).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const profile = await requireCurrentProfile()
    const admin = createSupabaseAdminClient()

    const { data: inserted, error } = await admin
      .from('peer_feedback')
      .insert({
        rota_entry_id: data.rotaEntryId,
        from_fellow_id: profile.id,
        to_fellow_id: data.toFellowId,
        strengths: data.strengths || null,
        development_areas: data.developmentAreas || null,
        rating: data.rating ?? null,
      })
      .select('id')
      .single()
    if (error) throw error

    return { id: inserted.id }
  })

export const createGuestInvite = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      rotaEntryId: z.string().uuid(),
      guestEmail: nhsEmailSchema,
      guestName: z.string().optional(),
      guestRole: z.string().optional(),
      message: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const profile = await requireCurrentProfile()
    const admin = createSupabaseAdminClient()

    const { data: entry } = await admin
      .from('rota_entries')
      .select('fellow_id')
      .eq('id', data.rotaEntryId)
      .maybeSingle()
      .returns<{ fellow_id: string }>()

    if (!entry || entry.fellow_id !== profile.id)
      throw new Error('You can only invite guests for your own sessions.')

    const token = crypto.randomUUID()
    const expiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString()

    const { data: invite, error } = await admin
      .from('guest_feedback_invites')
      .insert({
        rota_entry_id: data.rotaEntryId,
        fellow_id: profile.id,
        invited_by: profile.id,
        guest_email: data.guestEmail,
        guest_name: data.guestName || null,
        guest_role: data.guestRole || null,
        message: data.message || null,
        token,
        expires_at: expiresAt,
        status: 'pending',
      })
      .select('id, token')
      .single()
    if (error) throw error

    return { id: invite.id, token: invite.token }
  })
