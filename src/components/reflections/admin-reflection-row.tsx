import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader } from '#/components/ui/card'
import { formatUkDate } from '#/lib/dates'

import type { AdminReflectionItem } from '#/components/reflections/reflections-types'

const statusBadge: Record<
  AdminReflectionItem['status'],
  { label: string; variant: 'secondary' | 'default' | 'outline' }
> = {
  not_started: { label: 'Outstanding', variant: 'secondary' },
  in_progress: { label: 'Draft', variant: 'secondary' },
  complete: { label: 'Complete', variant: 'default' },
  dismissed: { label: 'Not needed', variant: 'outline' },
}

const fields: Array<{ key: keyof AdminReflectionItem; label: string }> = [
  { key: 'whatWentWell', label: 'What went well' },
  { key: 'whatCouldBeImproved', label: 'What could be improved' },
  { key: 'keyLearningPoints', label: 'Key learning points' },
  { key: 'followUpActions', label: 'Follow-up actions' },
]

/** Read-only — staff view reflections but never edit them (spec.md §5). */
export function AdminReflectionRow({ item }: { item: AdminReflectionItem }) {
  const [expanded, setExpanded] = useState(false)
  const badge = statusBadge[item.status]

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {expanded ? (
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className="font-medium">{item.fellowName}</span>
            <span className="text-muted-foreground">{item.activityLabel}</span>
            <span className="text-muted-foreground">
              {formatUkDate(item.entryDate)}
            </span>
          </div>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="grid gap-3">
          {item.status === 'dismissed' ? (
            <p className="text-sm text-muted-foreground">
              Marked as not needed.
            </p>
          ) : fields.every((f) => !item[f.key]) ? (
            <p className="text-sm text-muted-foreground">Not written yet.</p>
          ) : (
            fields.map(
              (f) =>
                item[f.key] && (
                  <div key={f.key} className="grid gap-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {f.label}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {item[f.key] as string}
                    </p>
                  </div>
                ),
            )
          )}
        </CardContent>
      )}
    </Card>
  )
}
