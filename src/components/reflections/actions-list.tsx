import { useState } from 'react'
import { X } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Checkbox } from '#/components/ui/checkbox'
import { Input } from '#/components/ui/input'
import {
  createAction,
  deleteAction,
  toggleAction,
} from '#/server/reflections.functions'

import type { ReflectionAction } from '#/components/reflections/reflections-types'

export function ActionsList({
  actions,
  onChanged,
}: {
  actions: Array<ReflectionAction>
  onChanged: () => Promise<void> | void
}) {
  const [newAction, setNewAction] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault()
    if (!newAction.trim()) return
    setSubmitting(true)
    try {
      await createAction({ data: { actionText: newAction.trim() } })
      setNewAction('')
      await onChanged()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggle(action: ReflectionAction) {
    await toggleAction({ data: { id: action.id, isDone: !action.isDone } })
    await onChanged()
  }

  async function handleDelete(id: string) {
    await deleteAction({ data: { id } })
    await onChanged()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {actions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No actions yet.</p>
        ) : (
          <div className="grid gap-2">
            {actions.map((action) => (
              <div key={action.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={action.isDone}
                  onCheckedChange={() => handleToggle(action)}
                />
                <span
                  className={
                    action.isDone
                      ? 'flex-1 text-muted-foreground line-through'
                      : 'flex-1'
                  }
                >
                  {action.actionText}
                </span>
                <button
                  type="button"
                  aria-label="Remove action"
                  onClick={() => handleDelete(action.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form className="flex gap-2" onSubmit={handleAdd}>
          <Input
            value={newAction}
            onChange={(e) => setNewAction(e.target.value)}
            placeholder="Add a personal action…"
          />
          <Button
            type="submit"
            size="sm"
            disabled={submitting || !newAction.trim()}
          >
            Add
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
