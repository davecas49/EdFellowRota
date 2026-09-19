import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader } from '#/components/ui/card'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { formatUkDate } from '#/lib/dates'
import {
  createAction,
  dismissReflection,
  restoreReflection,
  saveReflection,
} from '#/server/reflections.functions'

import type { ReflectionItem } from '#/components/reflections/reflections-types'

const statusBadge: Record<
  ReflectionItem['status'],
  { label: string; variant: 'secondary' | 'default' | 'outline' }
> = {
  not_started: { label: 'Outstanding', variant: 'secondary' },
  in_progress: { label: 'Draft', variant: 'secondary' },
  complete: { label: 'Complete', variant: 'default' },
  dismissed: { label: 'Not needed', variant: 'outline' },
}

export function ReflectionCard({
  item,
  onChanged,
}: {
  item: ReflectionItem
  onChanged: () => Promise<void> | void
}) {
  const [expanded, setExpanded] = useState(false)
  const [whatWentWell, setWhatWentWell] = useState(item.whatWentWell ?? '')
  const [whatCouldBeImproved, setWhatCouldBeImproved] = useState(
    item.whatCouldBeImproved ?? '',
  )
  const [keyLearningPoints, setKeyLearningPoints] = useState(
    item.keyLearningPoints ?? '',
  )
  const [followUpActions, setFollowUpActions] = useState(
    item.followUpActions ?? '',
  )
  const [submitting, setSubmitting] = useState<
    'draft' | 'complete' | 'dismiss' | 'restore' | 'action' | null
  >(null)
  const [error, setError] = useState<string | null>(null)
  const [actionAdded, setActionAdded] = useState(false)

  const badge = statusBadge[item.status]

  async function save(status: 'in_progress' | 'complete') {
    setSubmitting(status === 'complete' ? 'complete' : 'draft')
    setError(null)
    try {
      await saveReflection({
        data: {
          rotaEntryId: item.rotaEntryId,
          whatWentWell,
          whatCouldBeImproved,
          keyLearningPoints,
          followUpActions,
          status,
        },
      })
      await onChanged()
    } catch {
      setError('Could not save — please try again.')
    } finally {
      setSubmitting(null)
    }
  }

  async function handleDismiss() {
    setSubmitting('dismiss')
    setError(null)
    try {
      await dismissReflection({ data: { rotaEntryId: item.rotaEntryId } })
      await onChanged()
    } finally {
      setSubmitting(null)
    }
  }

  async function handleRestore() {
    if (!item.reflectionId) return
    setSubmitting('restore')
    setError(null)
    try {
      await restoreReflection({ data: { reflectionId: item.reflectionId } })
      await onChanged()
    } finally {
      setSubmitting(null)
    }
  }

  async function handleAddToActions() {
    if (!followUpActions.trim()) return
    setSubmitting('action')
    try {
      await createAction({
        data: {
          actionText: followUpActions.trim(),
          reflectionId: item.reflectionId ?? undefined,
          rotaEntryId: item.rotaEntryId,
        },
      })
      setActionAdded(true)
      await onChanged()
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            {expanded ? (
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className="font-medium">{item.activityLabel}</span>
            <span className="text-muted-foreground">
              {formatUkDate(item.entryDate)}
            </span>
          </div>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="grid gap-4">
          {item.status === 'dismissed' ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Marked as not needed.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleRestore}
                disabled={submitting !== null}
              >
                {submitting === 'restore' ? 'Restoring…' : 'Restore'}
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-2">
                <Label>What went well</Label>
                <Textarea
                  value={whatWentWell}
                  onChange={(e) => setWhatWentWell(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>What could be improved</Label>
                <Textarea
                  value={whatCouldBeImproved}
                  onChange={(e) => setWhatCouldBeImproved(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Key learning points</Label>
                <Textarea
                  value={keyLearningPoints}
                  onChange={(e) => setKeyLearningPoints(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Follow-up actions</Label>
                <Textarea
                  value={followUpActions}
                  onChange={(e) => setFollowUpActions(e.target.value)}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-fit"
                  disabled={!followUpActions.trim() || submitting !== null}
                  onClick={handleAddToActions}
                >
                  {submitting === 'action'
                    ? 'Adding…'
                    : actionAdded
                      ? 'Added to actions list'
                      : '+ Add to actions list'}
                </Button>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => save('complete')}
                  disabled={submitting !== null}
                >
                  {submitting === 'complete' ? 'Saving…' : 'Mark complete'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => save('in_progress')}
                  disabled={submitting !== null}
                >
                  {submitting === 'draft' ? 'Saving…' : 'Save as draft'}
                </Button>
                {item.status !== 'complete' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleDismiss}
                    disabled={submitting !== null}
                  >
                    {submitting === 'dismiss' ? 'Dismissing…' : 'Not needed'}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}
