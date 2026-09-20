import { useState } from 'react'

import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { createRoom, setRoomActive, updateRoom } from '#/server/rooms.functions'

import type { Room } from '#/server/rooms.functions'

export interface RoomSheetTarget {
  room: Room | null
}

export function RoomSheet({
  target,
  onClose,
  onSaved,
}: {
  target: RoomSheetTarget | null
  onClose: () => void
  onSaved: () => void
}) {
  return (
    <Sheet open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex flex-col">
        {target && (
          <RoomForm
            key={target.room?.id ?? 'new'}
            room={target.room}
            onClose={onClose}
            onSaved={onSaved}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function RoomForm({
  room,
  onClose,
  onSaved,
}: {
  room: Room | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(room?.name ?? '')
  const [capacity, setCapacity] = useState(String(room?.capacity ?? ''))
  const [isActive, setIsActive] = useState(room?.isActive ?? true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [toggling, setToggling] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        name,
        capacity: Number(capacity),
        isActive,
      }
      if (room) {
        await updateRoom({ data: { id: room.id, ...payload } })
      } else {
        await createRoom({ data: payload })
      }
      onSaved()
    } catch {
      setError('Could not save — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConfirmToggle() {
    if (!room) return
    setToggling(true)
    try {
      await setRoomActive({ data: { id: room.id, isActive: !room.isActive } })
      setConfirmDeactivate(false)
      onSaved()
    } finally {
      setToggling(false)
    }
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{room ? 'Edit room' : 'New room'}</SheetTitle>
        <SheetDescription>
          {room ? 'Update this room.' : 'Add a new room.'}
        </SheetDescription>
      </SheetHeader>

      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="grid flex-1 gap-4 overflow-y-auto px-4">
          <div className="grid gap-2">
            <Label htmlFor="room-name">Name</Label>
            <Input
              id="room-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="room-capacity">Capacity</Label>
            <Input
              id="room-capacity"
              type="number"
              min={1}
              required
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="room-active"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked === true)}
            />
            <Label htmlFor="room-active">Active</Label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <SheetFooter>
          <Button
            type="submit"
            disabled={submitting || !name || !capacity}
          >
            {submitting ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {room && (
            <Button
              type="button"
              variant={room.isActive ? 'destructive' : 'secondary'}
              onClick={() => setConfirmDeactivate(true)}
            >
              {room.isActive ? 'Deactivate' : 'Reactivate'}
            </Button>
          )}
        </SheetFooter>
      </form>

      <Dialog open={confirmDeactivate} onOpenChange={setConfirmDeactivate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {room?.isActive ? 'Deactivate this room?' : 'Reactivate this room?'}
            </DialogTitle>
            <DialogDescription>
              {room?.isActive
                ? 'It will no longer appear as an option when scheduling. This is not a delete.'
                : 'It will be available again when scheduling.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDeactivate(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={room?.isActive ? 'destructive' : 'default'}
              disabled={toggling}
              onClick={handleConfirmToggle}
            >
              {toggling ? 'Saving…' : room?.isActive ? 'Deactivate' : 'Reactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
