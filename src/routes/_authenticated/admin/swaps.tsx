import { createFileRoute } from '@tanstack/react-router'

import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { PageHeader } from '#/components/layout/page-header'
import { formatUkDate } from '#/lib/dates'
import { getAllSwaps } from '#/server/swaps.functions'

import type { SwapStatus } from '#/lib/supabase/enums'

export const Route = createFileRoute('/_authenticated/admin/swaps')({
  loader: () => getAllSwaps(),
  component: AdminSwapsPage,
})

function statusVariant(
  status: SwapStatus,
): 'default' | 'destructive' | 'secondary' | 'outline' {
  if (status === 'accepted') return 'default'
  if (status === 'declined' || status === 'expired') return 'destructive'
  if (status === 'cancelled') return 'outline'
  return 'secondary'
}

function AdminSwapsPage() {
  const data = Route.useLoaderData()

  return (
    <>
      <PageHeader
        title="Swaps"
        description="Oversight of all swap requests across the programme. Read-only — swaps are resolved by the fellows involved."
      />

      <Card>
        <CardHeader>
          <CardTitle>All swap requests</CardTitle>
        </CardHeader>
        <CardContent>
          {data.swaps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No swap requests yet.
            </p>
          ) : (
            <div className="grid gap-2">
              {data.swaps.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b py-2 text-sm last:border-0"
                >
                  <div>
                    <span className="font-medium">
                      {formatUkDate(s.entryDate)}
                    </span>{' '}
                    <span className="text-muted-foreground">
                      {s.timeSlot} · {s.activityLabel} ·{' '}
                      {s.requestingFellowName} → {s.targetFellowName}
                    </span>
                    {s.reason && (
                      <p className="text-muted-foreground">{s.reason}</p>
                    )}
                  </div>
                  <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
