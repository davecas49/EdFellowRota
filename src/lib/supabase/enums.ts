import { Constants } from '#/lib/supabase/types'

import type { Database } from '#/lib/supabase/types'

export const activityTypes = Constants.public.Enums.activity_type
export type ActivityType = Database['public']['Enums']['activity_type']

export const timeSlots = Constants.public.Enums.time_slot
export type TimeSlot = Database['public']['Enums']['time_slot']

export const userRoles = Constants.public.Enums.user_role
export type UserRole = Database['public']['Enums']['user_role']

export const fellowTiers = Constants.public.Enums.fellow_tier
export type FellowTier = Database['public']['Enums']['fellow_tier']

export const leaveTypes = Constants.public.Enums.leave_type
export type LeaveType = Database['public']['Enums']['leave_type']

export const leaveRequestStatuses = Constants.public.Enums.leave_request_status
export type LeaveRequestStatus = Database['public']['Enums']['leave_request_status']

export const reflectionStatuses = Constants.public.Enums.reflection_status
export type ReflectionStatus = Database['public']['Enums']['reflection_status']

export const swapStatuses = Constants.public.Enums.swap_status
export type SwapStatus = Database['public']['Enums']['swap_status']

export const qualitySubjects = Constants.public.Enums.quality_subject
export type QualitySubject = Database['public']['Enums']['quality_subject']
