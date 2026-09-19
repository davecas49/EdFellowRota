import type { ActivityType, FellowTier } from '#/lib/supabase/enums'

/** Activity colours mirroring the rota spreadsheet key (spec.md §6). */
export const activityColor: Record<ActivityType, string> = {
  education: 'var(--activity-education)',
  clinical: 'var(--activity-clinical)',
  annual_leave: 'var(--activity-annual-leave)',
  study_leave: 'var(--activity-study-leave)',
  nwd: 'var(--activity-nwd)',
  toil: 'var(--activity-toil)',
  induction: 'var(--activity-induction)',
  prep_day: 'var(--activity-prep-day)',
  other_leave: 'var(--activity-other-leave)',
  other: 'var(--activity-other)',
  sim: 'var(--activity-sim)',
}

/** Tier badge colours (spec.md §6). */
export const tierColor: Record<FellowTier, string> = {
  Lead: 'var(--tier-lead)',
  Senior: 'var(--tier-senior)',
  Core: 'var(--tier-core)',
  Haematology: 'var(--tier-haematology)',
}
