import type {
  ActivityType,
  FellowTier,
  TimeSlot,
  UserRole,
} from '#/lib/supabase/enums'

export interface RotaEntry {
  id: string
  fellowId: string
  fellowName: string
  fellowInitials: string
  fellowTier: FellowTier | null
  entryDate: string
  timeSlot: TimeSlot
  activityType: ActivityType
  activityLabel: string
  notes: string | null
}

export interface RotaRosterMember {
  id: string
  name: string
  initials: string
  tier: FellowTier | null
  role: UserRole
}

/** e.g. "annual_leave" → "Annual leave". */
export function activityTypeLabel(type: ActivityType): string {
  const spaced = type.replace(/_/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}
