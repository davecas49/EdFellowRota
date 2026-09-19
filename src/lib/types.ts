import type { FellowTier, UserRole } from '#/lib/supabase/enums'

/** Mirrors the `profiles` table (see the init-schema migration). */
export interface Profile {
  id: string
  name: string
  email: string
  role: UserRole
  tier: FellowTier | null
  initials: string
  is_active: boolean
}

export const staffRoles: ReadonlyArray<UserRole> = [
  'lead_fellow',
  'coordinator',
  'administrator',
]

export function isStaff(role: UserRole): boolean {
  return staffRoles.includes(role)
}
