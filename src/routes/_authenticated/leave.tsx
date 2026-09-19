import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { X } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { PageHeader } from '#/components/layout/page-header'
import { formatUkDate } from '#/lib/dates'
import { getMyLeave, requestLeave } from '#/server/leave.functions'

export const Route = createFileRoute('/_authenticated/leave')({
  loader: () => getMyLeave(),
  component: LeavePage,
})

function LeavePage() {
  const router = useRouter()
  const data = Route.useLoaderData()

  const [leaveType, setLeaveType] = useState<'annual' | 'study'>('annual')
  const [pendingDate, setPendingDate] = useState('')
  const [dates, setDates] = useState<Array<string>>([])
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<
    Array<{ date: string; status: 'approved' | 'declined'; reason: string }> | null
  >(null)

  function addDate() {
    if (pendingDate && !dates.includes(pendingDate)) {
      setDates([...dates, pendingDate].sort())
    }
    setPendingDate('')
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (dates.length === 0) return
    setSubmitting(true)
    try {
      const outcome = await requestLeave({ data: { leaveType, dates, note: note || undefined } })
      setResults(outcome)
      setDates([])
      setNote('')
      await router.invalidate()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Leave"
        description={`Entitlement and requests for the ${data.academicYear} academic year.`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {data.entitlements.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No entitlement has been set for you yet this academic year — ask your coordinator.
          </p>
        )}
        {data.entitlements.map((e) => (
          <Card key={e.leave_type}>
            <CardHeader>
              <CardTitle className="stat-label text-xs">{e.leave_type} leave</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {e.days_taken}
                <span className="text-base font-normal text-muted-foreground">
                  {' '}
                  / {e.total_entitlement} days
                </span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Request leave</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label>Type</Label>
              <div className="flex gap-2">
                {(['annual', 'study'] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={leaveType === type ? 'default' : 'outline'}
                    onClick={() => setLeaveType(type)}
                  >
                    {type === 'annual' ? 'Annual' : 'Study'}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">Dates</Label>
              <div className="flex gap-2">
                <Input
                  id="date"
                  type="date"
                  value={pendingDate}
                  onChange={(e) => setPendingDate(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={addDate}>
                  Add date
                </Button>
              </div>
              {dates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {dates.map((date) => (
                    <Badge key={date} variant="secondary" className="gap-1">
                      {formatUkDate(date)}
                      <button
                        type="button"
                        aria-label={`Remove ${date}`}
                        onClick={() => setDates(dates.filter((d) => d !== date))}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <Button type="submit" disabled={submitting || dates.length === 0} className="w-fit">
              {submitting ? 'Submitting…' : 'Submit request'}
            </Button>
          </form>

          {results && (
            <div className="mt-4 grid gap-2">
              {results.map((r) => (
                <p key={r.date} className="text-sm">
                  <span className="font-medium">{formatUkDate(r.date)}:</span>{' '}
                  <Badge variant={r.status === 'approved' ? 'default' : 'destructive'}>
                    {r.status}
                  </Badge>{' '}
                  <span className="text-muted-foreground">{r.reason}</span>
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your requests this year</CardTitle>
        </CardHeader>
        <CardContent>
          {data.leaveDates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests yet.</p>
          ) : (
            <div className="grid gap-2">
              {data.leaveDates.map((d) => (
                <div key={d.id} className="flex items-center justify-between border-b py-2 text-sm last:border-0">
                  <div>
                    <span className="font-medium">{formatUkDate(d.leave_date)}</span>{' '}
                    <span className="text-muted-foreground">({d.leave_type})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={d.status === 'approved' ? 'default' : d.status === 'declined' ? 'destructive' : 'secondary'}>
                      {d.status}
                    </Badge>
                    {d.decision_reason && (
                      <span className="text-muted-foreground">{d.decision_reason}</span>
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
