import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Textarea } from '#/components/ui/textarea'
import { PageHeader } from '#/components/layout/page-header'
import { formatUkDate } from '#/lib/dates'
import {
  acceptSwapRequest,
  cancelSwapRequest,
  createSwapRequest,
  declineSwapRequest,
  getMySwaps,
} from '#/server/swaps.functions'

import type { SwapStatus } from '#/lib/supabase/enums'

export const Route = createFileRoute('/_authenticated/swaps')({
  loader: () => getMySwaps(),
  component: SwapsPage,
})

function statusVariant(
  status: SwapStatus,
): 'default' | 'destructive' | 'secondary' | 'outline' {
  if (status === 'accepted') return 'default'
  if (status === 'declined' || status === 'expired') return 'destructive'
  if (status === 'cancelled') return 'outline'
  return 'secondary'
}

function SwapsPage() {
  const router = useRouter()
  const data = Route.useLoaderData()

  const [rotaEntryId, setRotaEntryId] = useState('')
  const [targetFellowId, setTargetFellowId] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!rotaEntryId || !targetFellowId) return
    setSubmitting(true)
    setError(null)
    try {
      await createSwapRequest({
        data: { rotaEntryId, targetFellowId, reason: reason || undefined },
      })
      setRotaEntryId('')
      setTargetFellowId('')
      setReason('')
      await router.invalidate()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not raise the swap request.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAction(id: string, action: () => Promise<unknown>) {
    setBusyId(id)
    setError(null)
    try {
      await action()
      await router.invalidate()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not complete that action.',
      )
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Swaps"
        description="Request and respond to session swaps."
      />

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="py-3 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Raise a swap request</CardTitle>
        </CardHeader>
        <CardContent>
          {data.mySessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You have no upcoming sessions to offer for a swap.
            </p>
          ) : (
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label>Your session</Label>
                <Select value={rotaEntryId} onValueChange={setRotaEntryId}>
                  <SelectTrigger className="w-full sm:w-96">
                    <SelectValue placeholder="Choose a session" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.mySessions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {formatUkDate(s.entry_date)} {s.time_slot} —{' '}
                        {s.activity_label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Swap with</Label>
                <Select
                  value={targetFellowId}
                  onValueChange={setTargetFellowId}
                >
                  <SelectTrigger className="w-full sm:w-96">
                    <SelectValue placeholder="Choose a fellow" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.roster.map((fellow) => (
                      <SelectItem key={fellow.id} value={fellow.id}>
                        {fellow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                disabled={submitting || !rotaEntryId || !targetFellowId}
                className="w-fit"
              >
                {submitting ? 'Sending…' : 'Send request'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Requests for you</CardTitle>
        </CardHeader>
        <CardContent>
          {data.targeted.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No one has asked to swap with you.
            </p>
          ) : (
            <div className="grid gap-2">
              {data.targeted.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b py-2 text-sm last:border-0"
                >
                  <div>
                    <span className="font-medium">
                      {formatUkDate(s.entryDate)}
                    </span>{' '}
                    <span className="text-muted-foreground">
                      {s.timeSlot} · {s.activityLabel} · from{' '}
                      {s.otherFellowName}
                    </span>
                    {s.reason && (
                      <p className="text-muted-foreground">{s.reason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
                    {s.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          disabled={busyId === s.id}
                          onClick={() =>
                            handleAction(s.id, () =>
                              acceptSwapRequest({ data: { id: s.id } }),
                            )
                          }
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === s.id}
                          onClick={() =>
                            handleAction(s.id, () =>
                              declineSwapRequest({ data: { id: s.id } }),
                            )
                          }
                        >
                          Decline
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your requests</CardTitle>
        </CardHeader>
        <CardContent>
          {data.raised.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven't raised any swap requests.
            </p>
          ) : (
            <div className="grid gap-2">
              {data.raised.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b py-2 text-sm last:border-0"
                >
                  <div>
                    <span className="font-medium">
                      {formatUkDate(s.entryDate)}
                    </span>{' '}
                    <span className="text-muted-foreground">
                      {s.timeSlot} · {s.activityLabel} · with{' '}
                      {s.otherFellowName}
                    </span>
                    {s.reason && (
                      <p className="text-muted-foreground">{s.reason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
                    {s.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === s.id}
                        onClick={() =>
                          handleAction(s.id, () =>
                            cancelSwapRequest({ data: { id: s.id } }),
                          )
                        }
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
