import { useState } from 'react'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { Textarea } from '#/components/ui/textarea'
import { activityTypeLabel } from '#/components/rota/rota-types'
import { activityTypes, timeSlots } from '#/lib/supabase/enums'
import {
  checkRotaEntryDependents,
  createRotaEntry,
  deleteRotaEntry,
  updateRotaEntry,
} from '#/server/rota.functions'

import type { RotaSlotSelection } from '#/components/rota/rota-session-block'
import type { RotaRosterMember } from '#/components/rota/rota-types'
import type { ActivityType, TimeSlot } from '#/lib/supabase/enums'

interface DependentCounts {
  reflections: number
  peerFeedback: number
  guestInvites: number
  swaps: number
}

function describeLinked(counts: DependentCounts): string {
  const parts: Array<string> = []
  if (counts.reflections > 0)
    parts.push(
      `${counts.reflections} reflection${counts.reflections > 1 ? 's' : ''}`,
    )
  if (counts.peerFeedback > 0)
    parts.push(
      `${counts.peerFeedback} peer feedback ${counts.peerFeedback > 1 ? 'entries' : 'entry'}`,
    )
  if (counts.guestInvites > 0)
    parts.push(
      `${counts.guestInvites} guest feedback invite${counts.guestInvites > 1 ? 's' : ''}`,
    )
  if (counts.swaps > 0)
    parts.push(`${counts.swaps} swap request${counts.swaps > 1 ? 's' : ''}`)
  return parts.join(', ')
}

export function RotaEntrySheet({
  selection,
  roster,
  onClose,
  onSaved,
}: {
  selection: RotaSlotSelection | null
  roster: Array<RotaRosterMember>
  onClose: () => void
  onSaved: () => void
}) {
  return (
    <Sheet
      open={selection !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <SheetContent className="flex flex-col">
        {selection && (
          <RotaEntryForm
            key={
              selection.entry?.id ??
              `${selection.fellowId}-${selection.date}-${selection.timeSlot}`
            }
            selection={selection}
            roster={roster}
            onClose={onClose}
            onSaved={onSaved}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function RotaEntryForm({
  selection,
  roster,
  onClose,
  onSaved,
}: {
  selection: RotaSlotSelection
  roster: Array<RotaRosterMember>
  onClose: () => void
  onSaved: () => void
}) {
  const { entry } = selection

  const [fellowId, setFellowId] = useState(
    entry?.fellowId ?? selection.fellowId,
  )
  const [entryDate, setEntryDate] = useState(entry?.entryDate ?? selection.date)
  const [timeSlot, setTimeSlot] = useState<TimeSlot>(
    entry?.timeSlot ?? selection.timeSlot,
  )
  const [activityType, setActivityType] = useState<ActivityType>(
    entry?.activityType ?? 'clinical',
  )
  const [activityLabel, setActivityLabel] = useState(
    entry?.activityLabel ?? activityTypeLabel('clinical'),
  )
  const [notes, setNotes] = useState(entry?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [confirmDelete, setConfirmDelete] = useState<DependentCounts | null>(
    null,
  )
  const [checkingDelete, setCheckingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        fellowId,
        entryDate,
        timeSlot,
        activityType,
        activityLabel,
        notes,
      }
      if (entry) {
        await updateRotaEntry({ data: { id: entry.id, ...payload } })
      } else {
        await createRotaEntry({ data: payload })
      }
      onSaved()
    } catch {
      setError('Could not save — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteClick() {
    if (!entry) return
    setCheckingDelete(true)
    try {
      const counts = await checkRotaEntryDependents({ data: { id: entry.id } })
      setConfirmDelete(counts)
    } finally {
      setCheckingDelete(false)
    }
  }

  async function handleConfirmDelete() {
    if (!entry) return
    setDeleting(true)
    try {
      await deleteRotaEntry({ data: { id: entry.id } })
      setConfirmDelete(null)
      onSaved()
    } finally {
      setDeleting(false)
    }
  }

  const linkedDescription = confirmDelete ? describeLinked(confirmDelete) : ''

  return (
    <>
      <SheetHeader>
        <SheetTitle>{entry ? 'Edit session' : 'New entry'}</SheetTitle>
        <SheetDescription>
          {entry
            ? 'Edit, move, reassign or add notes to this session.'
            : 'Add a new rota session.'}
        </SheetDescription>
      </SheetHeader>

      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="grid flex-1 gap-4 overflow-y-auto px-4">
          <div className="grid gap-2">
            <Label>Fellow</Label>
            <Select value={fellowId} onValueChange={setFellowId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roster.map((fellow) => (
                  <SelectItem key={fellow.id} value={fellow.id}>
                    {fellow.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="entry-date">Date</Label>
            <Input
              id="entry-date"
              type="date"
              required
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Time slot</Label>
            <Select
              value={timeSlot}
              onValueChange={(v) => setTimeSlot(v as TimeSlot)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot === 'ALL_DAY' ? 'All day' : slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Activity type</Label>
            <Select
              value={activityType}
              onValueChange={(v) => {
                const next = v as ActivityType
                setActivityType(next)
                setActivityLabel((current) =>
                  current === '' || current === activityTypeLabel(activityType)
                    ? activityTypeLabel(next)
                    : current,
                )
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {activityTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="activity-label">Label</Label>
            <Input
              id="activity-label"
              required
              value={activityLabel}
              onChange={(e) => setActivityLabel(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <SheetFooter>
          <Button type="submit" disabled={submitting || !activityLabel}>
            {submitting ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {entry && (
            <Button
              type="button"
              variant="destructive"
              disabled={checkingDelete}
              onClick={handleDeleteClick}
            >
              {checkingDelete ? 'Checking…' : 'Delete'}
            </Button>
          )}
        </SheetFooter>
      </form>

      <Dialog
        open={confirmDelete !== null}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this session?</DialogTitle>
            <DialogDescription>
              {linkedDescription
                ? `This also removes ${linkedDescription}, which cannot be undone.`
                : 'This session has no linked reflections, feedback or swaps.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={handleConfirmDelete}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
