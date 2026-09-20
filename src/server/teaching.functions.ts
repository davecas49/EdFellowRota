import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { isStaff } from '#/lib/types'
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from '#/lib/supabase/server'

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

export const assignmentTypes = ['university', 'block', 'prescribing'] as const
export type AssignmentType = (typeof assignmentTypes)[number]

export interface TeachingAssignment {
  id: string
  fellowId: string | null
  fellowName: string | null
  assignmentType: AssignmentType
  university: string | null
  blockCode: string | null
  blockName: string | null
  rotationLevel: string | null
  sessionName: string | null
  durationHours: number | null
  notes: string | null
}

export interface TeachingRosterMember {
  id: string
  name: string
  tier: FellowTier | null
}

interface AssignmentRow {
  id: string
  fellow_id: string | null
  assignment_type: AssignmentType
  university: string | null
  block_code: string | null
  block_name: string | null
  rotation_level: string | null
  session_name: string | null
  duration_hours: number | null
  notes: string | null
  profiles: { name: string } | null
}

function toAssignment(row: AssignmentRow): TeachingAssignment {
  return {
    id: row.id,
    fellowId: row.fellow_id,
    fellowName: row.profiles?.name ?? null,
    assignmentType: row.assignment_type,
    university: row.university,
    blockCode: row.block_code,
    blockName: row.block_name,
    rotationLevel: row.rotation_level,
    sessionName: row.session_name,
    durationHours: row.duration_hours,
    notes: row.notes,
  }
}

export const listTeachingAssignments = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireStaff()
    const supabase = createSupabaseServerClient()

    const [
      { data: rows, error: assignmentsError },
      { data: roster, error: rosterError },
    ] = await Promise.all([
      supabase
        .from('teaching_assignments')
        .select(
          'id, fellow_id, assignment_type, university, block_code, block_name, rotation_level, session_name, duration_hours, notes, profiles(name)',
        )
        .returns<Array<AssignmentRow>>(),
      supabase
        .from('profiles')
        .select('id, name, tier')
        .eq('is_active', true)
        .in('role', ['fellow', 'lead_fellow'])
        .order('name')
        .returns<Array<TeachingRosterMember>>(),
    ])

    if (assignmentsError) throw assignmentsError
    if (rosterError) throw rosterError

    return { assignments: rows.map(toAssignment), roster }
  },
)

const teachingInput = z.object({
  fellowId: z.string().uuid().optional(),
  assignmentType: z.enum(assignmentTypes),
  university: z.string().optional(),
  blockCode: z.string().optional(),
  blockName: z.string().optional(),
  rotationLevel: z.string().optional(),
  sessionName: z.string().optional(),
  durationHours: z.number().positive().optional(),
  notes: z.string().optional(),
})

function toInsertPayload(data: z.infer<typeof teachingInput>) {
  return {
    fellow_id: data.fellowId ?? null,
    assignment_type: data.assignmentType,
    university: data.university || null,
    block_code: data.blockCode || null,
    block_name: data.blockName || null,
    rotation_level: data.rotationLevel || null,
    session_name: data.sessionName || null,
    duration_hours: data.durationHours ?? null,
    notes: data.notes || null,
  }
}

export const createTeachingAssignment = createServerFn({ method: 'POST' })
  .validator(teachingInput)
  .handler(async ({ data }) => {
    await requireStaff()
    const admin = createSupabaseAdminClient()

    const { error } = await admin
      .from('teaching_assignments')
      .insert(toInsertPayload(data))
    if (error) throw error

    return { ok: true as const }
  })

export const updateTeachingAssignment = createServerFn({ method: 'POST' })
  .validator(teachingInput.extend({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await requireStaff()
    const admin = createSupabaseAdminClient()

    const { error } = await admin
      .from('teaching_assignments')
      .update(toInsertPayload(data))
      .eq('id', data.id)
    if (error) throw error

    return { ok: true as const }
  })

export const deleteTeachingAssignment = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await requireStaff()
    const admin = createSupabaseAdminClient()

    const { error } = await admin
      .from('teaching_assignments')
      .delete()
      .eq('id', data.id)
    if (error) throw error

    return { ok: true as const }
  })
