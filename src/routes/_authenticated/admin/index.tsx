import { createFileRoute } from '@tanstack/react-router'

import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { PageHeader } from '#/components/layout/page-header'
import { StatTile } from '#/components/layout/stat-tile'
import { formatUkDate, formatUkDateTime } from '#/lib/dates'
import { getAdminOverview } from '#/server/admin-overview.functions'

export const Route = createFileRoute('/_authenticated/admin/')({
  loader: () => getAdminOverview(),
  component: AdminOverview,
})

function AdminOverview() {
  const { stats, pending, activity, dataQuality } = Route.useLoaderData()

  const pendingCount = pending.leave.length + pending.swaps.length
  const dataQualityCount =
    dataQuality.reflectionsOverdue.length +
    dataQuality.unscoredFeedbackCount +
    dataQuality.expiredSwaps.length +
    dataQuality.inactiveInFutureRota.length

  return (
    <>
      <PageHeader
        title="Overview"
        description="Programme-wide overview: fellows, pending decisions, recent activity."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Active fellows" value={stats.activeFellows} />
        <StatTile label="Active faculty" value={stats.activeFaculty} />
        <StatTile label="Sessions this week" value={stats.sessionsThisWeek} />
        <StatTile
          label="Reflections outstanding"
          value={stats.reflectionsOutstanding}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending items</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingCount === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing pending.
              </p>
            ) : (
              <div className="grid gap-2 text-sm">
                {pending.leave.map((l, i) => (
                  <div key={`leave-${i}`} className="border-b py-1 last:border-0">
                    <span className="font-medium">{l.fellowName}</span>{' '}
                    <span className="text-muted-foreground">
                      {l.leaveType} leave on {formatUkDate(l.leaveDate)} —
                      awaiting a decision
                    </span>
                  </div>
                ))}
                {pending.swaps.map((s, i) => (
                  <div key={`swap-${i}`} className="border-b py-1 last:border-0">
                    <span className="font-medium">
                      {s.requestingFellowName} → {s.targetFellowName}
                    </span>{' '}
                    <span className="text-muted-foreground">
                      swap for {formatUkDate(s.entryDate)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Data quality{' '}
              {dataQualityCount > 0 && (
                <Badge variant="destructive">{dataQualityCount}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <DataQualityRow
              label="Reflections overdue by 30+ days"
              count={dataQuality.reflectionsOverdue.length}
              items={dataQuality.reflectionsOverdue.map(
                (r) =>
                  `${r.fellowName} — ${r.activityLabel} on ${formatUkDate(r.entryDate)} (${r.daysOverdue}d)`,
              )}
            />
            <DataQualityRow
              label="Unscored peer feedback"
              count={dataQuality.unscoredFeedbackCount}
            />
            <DataQualityRow
              label="Expired swap requests"
              count={dataQuality.expiredSwaps.length}
              items={dataQuality.expiredSwaps.map(
                (s) =>
                  `${s.requestingFellowName} → ${s.targetFellowName} (${formatUkDate(s.entryDate)})`,
              )}
            />
            <DataQualityRow
              label="Inactive people in the future rota"
              count={dataQuality.inactiveInFutureRota.length}
              items={dataQuality.inactiveInFutureRota.map(
                (p) =>
                  `${p.fellowName} — ${p.count} session${p.count > 1 ? 's' : ''}, next ${formatUkDate(p.nextDate)}`,
              )}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing recorded yet.
            </p>
          ) : (
            <div className="grid gap-2 text-sm">
              {activity.map((item) => (
                <div
                  key={`${item.source}-${item.id}`}
                  className="flex flex-wrap items-baseline gap-2 border-b py-1 last:border-0"
                >
                  <span className="text-muted-foreground">
                    {formatUkDateTime(item.at)}
                  </span>
                  <span>{item.description}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

function DataQualityRow({
  label,
  count,
  items,
}: {
  label: string
  count: number
  items?: Array<string>
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span>{label}</span>
        <Badge variant={count > 0 ? 'destructive' : 'secondary'}>
          {count}
        </Badge>
      </div>
      {count > 0 && items && items.length > 0 && (
        <ul className="mt-1 list-disc pl-5 text-muted-foreground">
          {items.slice(0, 5).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
          {items.length > 5 && <li>+{items.length - 5} more</li>}
        </ul>
      )}
    </div>
  )
}
