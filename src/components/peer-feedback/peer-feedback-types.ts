export interface SessionItem {
  rotaEntryId: string
  fellowId: string
  fellowName: string
  entryDate: string
  activityLabel: string
  isMySession: boolean
  myFeedback: GivenFeedback | null
  invites: InviteItem[]
}

export interface GivenFeedback {
  id: string
  strengths: string | null
  developmentAreas: string | null
  rating: number | null
}

export interface InviteItem {
  id: string
  guestEmail: string
  guestName: string | null
  guestRole: string | null
  status: string
  expiresAt: string
  submittedAt: string | null
}

export interface ReceivedItem {
  id: string
  rotaEntryId: string
  fromName: string
  isGuest: boolean
  guestRole: string | null
  strengths: string | null
  developmentAreas: string | null
  rating: number | null
  submittedAt: string
}
