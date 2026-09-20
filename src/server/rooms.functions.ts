import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { isStaff } from '#/lib/types'
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from '#/lib/supabase/server'

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

export interface Room {
  id: string
  name: string
  capacity: number
  isActive: boolean
}

export const listRooms = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireStaff()
    const supabase = createSupabaseServerClient()

    const { data: rows, error } = await supabase
      .from('rooms')
      .select('id, name, capacity, is_active')
      .order('name')
    if (error) throw error

    return {
      rooms: rows.map(
        (r): Room => ({
          id: r.id,
          name: r.name,
          capacity: r.capacity,
          isActive: r.is_active,
        }),
      ),
    }
  },
)

const roomInput = z.object({
  name: z.string().min(1),
  capacity: z.number().int().positive(),
  isActive: z.boolean(),
})

export const createRoom = createServerFn({ method: 'POST' })
  .validator(roomInput)
  .handler(async ({ data }) => {
    await requireStaff()
    const admin = createSupabaseAdminClient()

    const { error } = await admin.from('rooms').insert({
      name: data.name,
      capacity: data.capacity,
      is_active: data.isActive,
    })
    if (error) throw error

    return { ok: true as const }
  })

export const updateRoom = createServerFn({ method: 'POST' })
  .validator(roomInput.extend({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await requireStaff()
    const admin = createSupabaseAdminClient()

    const { error } = await admin
      .from('rooms')
      .update({
        name: data.name,
        capacity: data.capacity,
        is_active: data.isActive,
      })
      .eq('id', data.id)
    if (error) throw error

    return { ok: true as const }
  })

export const setRoomActive = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid(), isActive: z.boolean() }))
  .handler(async ({ data }) => {
    await requireStaff()
    const admin = createSupabaseAdminClient()

    const { error } = await admin
      .from('rooms')
      .update({ is_active: data.isActive })
      .eq('id', data.id)
    if (error) throw error

    return { ok: true as const }
  })
