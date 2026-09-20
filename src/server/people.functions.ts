import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { isStaff } from '#/lib/types'
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from '#/lib/supabase/server'
import { sendAccountInvite } from '#/server/auth.functions'

import type { Person } from '#/components/people/people-types'
import type { FellowTier, UserRole } from '#/lib/supabase/enums'

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

const userRoleEnum = z.enum([
  'fellow',
  'lead_fellow',
  'coordinator',
  'administrator',
  'faculty',
])

const fellowTierEnum = z.enum(['Lead', 'Senior', 'Core', 'Haematology'])

interface PersonRow {
  id: string
  name: string
  email: string
  role: UserRole
  tier: FellowTier | null
  phone: string | null
  initials: string
  role_title: string | null
  department: string | null
  responsibilities: string | null
  is_active: boolean
  user_id: string | null
}

function toPerson(row: PersonRow): Person {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    tier: row.tier,
    phone: row.phone,
    initials: row.initials,
    roleTitle: row.role_title,
    department: row.department,
    responsibilities: row.responsibilities,
    isActive: row.is_active,
    userId: row.user_id,
  }
}

export const listPeople = createServerFn({ method: 'GET' })
  .validator(z.object({ roles: z.array(userRoleEnum).min(1) }))
  .handler(async ({ data }) => {
    await requireStaff()
    const supabase = createSupabaseServerClient()

    const { data: rows, error } = await supabase
      .from('profiles')
      .select(
        'id, name, email, role, tier, phone, initials, role_title, department, responsibilities, is_active, user_id',
      )
      .in('role', data.roles)
      .order('name')
      .returns<Array<PersonRow>>()
    if (error) throw error

    return { people: rows.map(toPerson) }
  })

const personInput = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: userRoleEnum,
  tier: fellowTierEnum.optional(),
  phone: z.string().optional(),
  initials: z.string().min(1),
  roleTitle: z.string().optional(),
  department: z.string().optional(),
  responsibilities: z.string().optional(),
})

export const createPerson = createServerFn({ method: 'POST' })
  .validator(personInput)
  .handler(async ({ data }) => {
    await requireStaff()
    const admin = createSupabaseAdminClient()

    const { data: inserted, error } = await admin
      .from('profiles')
      .insert({
        name: data.name,
        email: data.email,
        role: data.role,
        tier: data.tier ?? null,
        phone: data.phone || null,
        initials: data.initials,
        role_title: data.roleTitle || null,
        department: data.department || null,
        responsibilities: data.responsibilities || null,
        is_active: true,
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') {
        return {
          ok: false as const,
          message: 'Someone with that email is already on file.',
        }
      }
      throw error
    }

    const invite = await sendAccountInvite(data.email)
    return { ok: true as const, id: inserted.id, invite }
  })

export const updatePerson = createServerFn({ method: 'POST' })
  .validator(personInput.extend({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await requireStaff()
    const admin = createSupabaseAdminClient()

    const { error } = await admin
      .from('profiles')
      .update({
        name: data.name,
        email: data.email,
        role: data.role,
        tier: data.tier ?? null,
        phone: data.phone || null,
        initials: data.initials,
        role_title: data.roleTitle || null,
        department: data.department || null,
        responsibilities: data.responsibilities || null,
      })
      .eq('id', data.id)

    if (error) {
      if (error.code === '23505') {
        return {
          ok: false as const,
          message: 'Someone with that email is already on file.',
        }
      }
      throw error
    }

    return { ok: true as const }
  })

export const setPersonActive = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid(), isActive: z.boolean() }))
  .handler(async ({ data }) => {
    await requireStaff()
    const admin = createSupabaseAdminClient()

    const { error } = await admin
      .from('profiles')
      .update({ is_active: data.isActive })
      .eq('id', data.id)
    if (error) throw error

    return { ok: true as const }
  })

export const resendInvite = createServerFn({ method: 'POST' })
  .validator(z.object({ email: z.string().email() }))
  .handler(async ({ data }) => {
    await requireStaff()
    return sendAccountInvite(data.email)
  })
