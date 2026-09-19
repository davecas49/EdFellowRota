import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader } from '#/components/ui/card'
import { formatUkDate } from '#/lib/dates'

import type { ReceivedItem } from '#/components/peer-feedback/peer-feedback-types'

function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) return null
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`text-sm ${n <= rating ? 'text-primary' : 'text-muted-foreground/25'}`}
        >
          ★
        </span>
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{rating}/5</span>
    </div>
  )
}

export function ReceivedCard({ item }: { item: ReceivedItem }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium">{item.fromName}</p>
            {item.guestRole && (
              <p className="text-xs text-muted-foreground">{item.guestRole}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formatUkDate(item.submittedAt)}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {item.isGuest && (
              <Badge variant="outline" className="text-xs">
                Guest
              </Badge>
            )}
            <RatingStars rating={item.rating} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3">
        {item.strengths && (
          <div className="grid gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Strengths
            </span>
            <p className="text-sm">{item.strengths}</p>
          </div>
        )}
        {item.developmentAreas && (
          <div className="grid gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Development areas
            </span>
            <p className="text-sm">{item.developmentAreas}</p>
          </div>
        )}
        {!item.strengths && !item.developmentAreas && (
          <p className="text-sm text-muted-foreground">Rating only — no written feedback.</p>
        )}
      </CardContent>
    </Card>
  )
}
