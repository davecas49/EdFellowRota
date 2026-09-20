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
import {
  assignmentTypes,
  createTeachingAssignment,
  deleteTeachingAssignment,
  updateTeachingAssignment,
} from '#/server/teaching.functions'

import type {
  AssignmentType,
  TeachingAssignment,
  TeachingRosterMember,
} from '#/server/teaching.functions'

const UNASSIGNED = 'unassigned'

function assignmentTypeLabel(type: AssignmentType): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export interface TeachingSheetTarget {
  assignment: TeachingAssignment | null
}

export function TeachingSheet({
  target,
  roster,
  onClose,
  onSaved,
}: {
  target: TeachingSheetTarget | null
  roster: Array<TeachingRosterMember>
  onClose: () => void
  onSaved: () => void
}) {
  return (
    <Sheet open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex flex-col">
        {target && (
          <TeachingForm
            key={target.assignment?.id ?? 'new'}
            assignment={target.assignment}
            roster={roster}
            onClose={onClose}
            onSaved={onSaved}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function TeachingForm({
  assignment,
  roster,
  onClose,
  onSaved,
}: {
  assignment: TeachingAssignment | null
  roster: Array<TeachingRosterMember>
  onClose: () => void
  onSaved: () => void
}) {
  const [fellowId, setFellowId] = useState(assignment?.fellowId ?? UNASSIGNED)
  const [assignmentType, setAssignmentType] = useState<AssignmentType>(
    assignment?.assignmentType ?? assignmentTypes[0],
  )
  const [university, setUniversity] = useState(assignment?.university ?? '')
  const [blockCode, setBlockCode] = useState(assignment?.blockCode ?? '')
  const [blockName, setBlockName] = useState(assignment?.blockName ?? '')
  const [rotationLevel, setRotationLevel] = useState(
    assignment?.rotationLevel ?? '',
  )
  const [sessionName, setSessionName] = useState(assignment?.sessionName ?? '')
  const [durationHours, setDurationHours] = useState(
    assignment?.durationHours != null ? String(assignment.durationHours) : '',
  )
  const [notes, setNotes] = useState(assignment?.notes ?? '')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        fellowId: fellowId === UNASSIGNED ? undefined : fellowId,
        assignmentType,
        university: university || undefined,
        blockCode: blockCode || undefined,
        blockName: blockName || undefined,
        rotationLevel: rotationLevel || undefined,
        sessionName: sessionName || undefined,
        durationHours: durationHours ? Number(durationHours) : undefined,
        notes: notes || undefined,
      }
      if (assignment) {
        await updateTeachingAssignment({ data: { id: assignment.id, ...payload } })
      } else {
        await createTeachingAssignment({ data: payload })
      }
      onSaved()
    } catch {
      setError('Could not save — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConfirmDelete() {
    if (!assignment) return
    setDeleting(true)
    try {
      await deleteTeachingAssignment({ data: { id: assignment.id } })
      setConfirmDelete(false)
      onSaved()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{assignment ? 'Edit assignment' : 'New assignment'}</SheetTitle>
        <SheetDescription>
          {assignment
            ? 'Update this teaching assignment.'
            : 'Add a new teaching assignment.'}
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
                <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                {roster.map((fellow) => (
                  <SelectItem key={fellow.id} value={fellow.id}>
                    {fellow.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Assignment type</Label>
            <Select
              value={assignmentType}
              onValueChange={(v) => setAssignmentType(v as AssignmentType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assignmentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {assignmentTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="teaching-university">University</Label>
            <Input
              id="teaching-university"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="teaching-block-code">Block code</Label>
            <Input
              id="teaching-block-code"
              value={blockCode}
              onChange={(e) => setBlockCode(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="teaching-block-name">Block name</Label>
            <Input
              id="teaching-block-name"
              value={blockName}
              onChange={(e) => setBlockName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="teaching-rotation-level">Rotation level</Label>
            <Input
              id="teaching-rotation-level"
              value={rotationLevel}
              onChange={(e) => setRotationLevel(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="teaching-session-name">Session name</Label>
            <Input
              id="teaching-session-name"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="teaching-duration">Duration (hours)</Label>
            <Input
              id="teaching-duration"
              type="number"
              min={0}
              step="0.5"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="teaching-notes">Notes</Label>
            <Textarea
              id="teaching-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <SheetFooter>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {assignment && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          )}
        </SheetFooter>
      </form>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this assignment?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDelete(false)}
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
