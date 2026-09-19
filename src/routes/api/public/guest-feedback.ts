import { createFileRoute } from '@tanstack/react-router'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'

import { createSupabaseAdminClient } from '#/lib/supabase/server'

import type { ActivityType } from '#/lib/supabase/enums'

const NHS_DOMAINS = ['nhs.net', 'nhs.uk']

function isNhsEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  return NHS_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))
}

const submitSchema = z.object({
  token: z.string().uuid(),
  guestName: z.string().min(1),
  guestEmail: z.string().email().refine(isNhsEmail, {
    message: 'Email must be an NHS address (@nhs.net or @nhs.uk).',
  }),
  guestRole: z.string().min(1),
  strengths: z.string().optional(),
  developmentAreas: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

async function handleGet(): Promise<Response> {
  const request = getRequest()
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return json({ error: 'missing_token' }, 400)
  }

  const admin = createSupabaseAdminClient()

  const { data: invite, error } = await admin
    .from('guest_feedback_invites')
    .select(
      'id, status, expires_at, guest_name, guest_email, guest_role, rota_entry_id, fellow_id',
    )
    .eq('token', token)
    .maybeSingle()
    .returns<{
      id: string
      status: string
      expires_at: string
      guest_name: string | null
      guest_email: string
      guest_role: string | null
      rota_entry_id: string
      fellow_id: string
    }>()

  if (error || !invite) {
    return json({ error: 'invalid_token' }, 404)
  }

  if (invite.status !== 'pending') {
    return json({
      error: invite.status === 'submitted' ? 'already_submitted' : 'invite_closed',
    }, 410)
  }

  if (new Date(invite.expires_at) < new Date()) {
    return json({ error: 'token_expired' }, 410)
  }

  const { data: entry } = await admin
    .from('rota_entries')
    .select(
      'activity_label, entry_date, activity_type, profiles!inner(name)',
    )
    .eq('id', invite.rota_entry_id)
    .single()
    .returns<{
      activity_label: string
      entry_date: string
      activity_type: ActivityType
      profiles: { name: string }
    }>()

  return json({
    sessionLabel: entry?.activity_label ?? '',
    sessionDate: entry?.entry_date ?? '',
    fellowName: entry?.profiles.name ?? '',
    guestName: invite.guest_name,
    guestEmail: invite.guest_email,
    guestRole: invite.guest_role,
  })
}

async function handlePost(): Promise<Response> {
  const request = getRequest()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ error: 'invalid_body' }, 400)
  }

  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) {
    return json({ error: 'validation_error', issues: parsed.error.issues }, 422)
  }

  const { token, guestName, guestEmail, guestRole, strengths, developmentAreas, rating } =
    parsed.data

  const admin = createSupabaseAdminClient()

  const { data: invite, error: inviteError } = await admin
    .from('guest_feedback_invites')
    .select('id, status, expires_at, rota_entry_id, fellow_id')
    .eq('token', token)
    .maybeSingle()
    .returns<{
      id: string
      status: string
      expires_at: string
      rota_entry_id: string
      fellow_id: string
    }>()

  if (inviteError || !invite) {
    return json({ error: 'invalid_token' }, 404)
  }

  if (invite.status !== 'pending') {
    return json({ error: 'invite_closed' }, 410)
  }

  if (new Date(invite.expires_at) < new Date()) {
    return json({ error: 'token_expired' }, 410)
  }

  // Write submission back onto invite row
  const { error: updateError } = await admin
    .from('guest_feedback_invites')
    .update({
      status: 'submitted',
      guest_name: guestName,
      guest_email: guestEmail,
      guest_role: guestRole,
      strengths: strengths || null,
      development_areas: developmentAreas || null,
      rating: rating ?? null,
      submitted_at: new Date().toISOString(),
    })
    .eq('id', invite.id)

  if (updateError) {
    return json({ error: 'save_failed' }, 500)
  }

  // Insert peer_feedback row — from_fellow_id uses the session owner's ID
  // as FK anchor; guest identity is in guest_name/email/role
  const { error: feedbackError } = await admin.from('peer_feedback').insert({
    rota_entry_id: invite.rota_entry_id,
    from_fellow_id: invite.fellow_id,
    to_fellow_id: invite.fellow_id,
    strengths: strengths || null,
    development_areas: developmentAreas || null,
    rating: rating ?? null,
    guest_name: guestName,
    guest_email: guestEmail,
    guest_role: guestRole,
  })

  if (feedbackError) {
    return json({ error: 'save_failed' }, 500)
  }

  return json({ ok: true })
}

export const Route = createFileRoute('/api/public/guest-feedback')({
  server: {
    handlers: {
      GET: handleGet,
      POST: handlePost,
    },
  },
})
