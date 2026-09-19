import type { ActivityType, ReflectionStatus } from '#/lib/supabase/enums'

export interface ReflectionItem {
  rotaEntryId: string
  entryDate: string
  activityType: ActivityType
  activityLabel: string
  reflectionId: string | null
  status: ReflectionStatus
  whatWentWell: string | null
  whatCouldBeImproved: string | null
  keyLearningPoints: string | null
  followUpActions: string | null
}

export interface AdminReflectionItem extends ReflectionItem {
  fellowId: string
  fellowName: string
}

export interface ReflectionAction {
  id: string
  actionText: string
  isDone: boolean
  doneAt: string | null
  reflectionId: string | null
  rotaEntryId: string | null
}
