import type { FellowTier, UserRole } from '#/lib/supabase/enums'

export interface PeopleScreenConfig {
  title: string
  description: string
  roles: ReadonlyArray<UserRole>
}

export interface Person {
  id: string
  name: string
  email: string
  role: UserRole
  tier: FellowTier | null
  phone: string | null
  initials: string
  roleTitle: string | null
  department: string | null
  responsibilities: string | null
  isActive: boolean
  userId: string | null
}

/** e.g. "lead_fellow" → "Lead fellow". */
export function userRoleLabel(role: UserRole): string {
  const spaced = role.replace(/_/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export function fellowTierLabel(tier: FellowTier): string {
  return tier
}

/** "Anita Price" → "AP". Same convention used when the faculty rows were migrated. */
export function computeInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter((part) => /[A-Za-z]/.test(part))
    .map((part) => part[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
}
