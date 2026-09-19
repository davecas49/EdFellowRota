import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from '#/lib/supabase/server'
import type { Profile } from '#/lib/types'

/**
 * No open sign-ups: an account can only be activated if the email is
 * already on file as a fellow, lead fellow, coordinator, administrator, or
 * faculty contact (spec.md §2). A faculty-only match provisions a `profiles`
 * row on the spot so the rest of the app has a single identity table to
 * check against; `link_profile_to_auth_user` (see the auth-linking
 * migration) then attaches `user_id` once Supabase confirms the sign-in.
 */
async function resolveEligibleProfile(email: string) {
  const supabase = createSupabaseAdminClient()
  const normalized = email.trim().toLowerCase()

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .ilike('email', normalized)
    .eq('is_active', true)
    .maybeSingle()

  if (existingProfile) return true

  const { data: contact } = await supabase
    .from('faculty_contacts')
    .select('name, email')
    .ilike('email', normalized)
    .eq('is_active', true)
    .maybeSingle()

  if (!contact?.email) return false

  const initials = contact.name
    .split(/\s+/)
    .map((part: string) => part[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()

  const { error } = await supabase.from('profiles').insert({
    name: contact.name,
    email: contact.email,
    role: 'faculty',
    initials,
    is_active: true,
  })

  // A profiles row may already exist for this email (race, or re-invite);
  // that's fine, it just means eligibility already holds.
  if (error && error.code !== '23505') throw error

  return true
}

/**
 * First-time activation and "forgot password" are the same operation: send
 * a code that lets the person set a password. `inviteUserByEmail`
 * covers a brand-new auth user; if one already exists we fall back to the
 * standard recovery email. The caller needs to know which of the two was
 * sent, since that determines the `type` passed to `verifyOtp()` on the
 * /reset-password step.
 */
export const requestAccountAccess = createServerFn({ method: 'POST' })
  .validator(z.object({ email: z.string().email() }))
  .handler(async ({ data }) => {
    const eligible = await resolveEligibleProfile(data.email)
    if (!eligible) {
      return {
        sent: false as const,
        message:
          'That email is not registered for the ED Portal. Ask your coordinator to add you first.',
      }
    }

    const supabase = createSupabaseAdminClient()

    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(data.email)

    if (!inviteError) {
      return {
        sent: true as const,
        kind: 'invite' as const,
        message: 'Check your email for a code to activate your account.',
      }
    }

    if (!/already.*registered/i.test(inviteError.message)) {
      throw inviteError
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email)
    if (resetError) throw resetError

    return {
      sent: true as const,
      kind: 'recovery' as const,
      message: 'Check your email for a code to reset your password.',
    }
  })

export const signInWithPassword = createServerFn({ method: 'POST' })
  .validator(z.object({ email: z.string().email(), password: z.string().min(1) }))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) return { ok: false as const, message: 'Incorrect email or password.' }
    return { ok: true as const }
  })

/** The signed-in user's profile, or null. Used to gate `_authenticated`. */
export const getCurrentProfile = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Profile | null> => {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, email, role, tier, initials, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()
      .returns<Profile>()

    return profile ?? null
  },
)

export const signOut = createServerFn({ method: 'POST' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  await supabase.auth.signOut()
})
