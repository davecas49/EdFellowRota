import { useMemo, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { addDays, format, startOfWeek } from 'date-fns'
import { z } from 'zod'

import { PageHeader } from '#/components/layout/page-header'
import { RotaByDay } from '#/components/rota/rota-by-day'
import { RotaByFellow } from '#/components/rota/rota-by-fellow'
import { RotaEntrySheet } from '#/components/rota/rota-entry-sheet'
import { RotaFilterBar } from '#/components/rota/rota-filter-bar'
import { listRotaEntries } from '#/server/rota.functions'

import type { RotaSlotSelection } from '#/components/rota/rota-session-block'
import type { ActivityType } from '#/lib/supabase/enums'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

function weekStartOf(date: Date) {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

export const Route = createFileRoute('/_authenticated/rota')({
  validateSearch: z.object({
    view: z.enum(['day', 'fellow']).default('day'),
    week: isoDate.optional(),
  }),
  loaderDeps: ({ search }) => ({ week: search.week }),
  loader: async ({ deps }) => {
    const weekStart = startOfWeek(
      new Date(deps.week ?? weekStartOf(new Date())),
      { weekStartsOn: 1 },
    )
    // Weekdays only (Mon–Fri) — no Saturday/Sunday on the rota page.
    const weekEnd = addDays(weekStart, 4)
    const from = format(weekStart, 'yyyy-MM-dd')
    const to = format(weekEnd, 'yyyy-MM-dd')
    const data = await listRotaEntries({ data: { from, to } })
    return { ...data, from, to }
  },
  component: RotaPage,
})

function RotaPage() {
  const router = useRouter()
  const { view } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { roster, entries, from, to } = Route.useLoaderData()

  const [activityType, setActivityType] = useState<ActivityType | 'all'>('all')
  const [fellowId, setFellowId] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selection, setSelection] = useState<RotaSlotSelection | null>(null)

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries.filter((entry) => {
      if (activityType !== 'all' && entry.activityType !== activityType)
        return false
      if (fellowId !== 'all' && entry.fellowId !== fellowId) return false
      if (
        q &&
        !entry.activityLabel.toLowerCase().includes(q) &&
        !(entry.notes ?? '').toLowerCase().includes(q) &&
        !entry.fellowName.toLowerCase().includes(q)
      )
        return false
      return true
    })
  }, [entries, activityType, fellowId, search])

  const visibleRoster = useMemo(
    () =>
      fellowId === 'all' ? roster : roster.filter((f) => f.id === fellowId),
    [roster, fellowId],
  )

  function goToWeek(weekStart: string) {
    void navigate({ search: (prev) => ({ ...prev, week: weekStart }) })
  }

  function handlePrevWeek() {
    goToWeek(format(addDays(new Date(from), -7), 'yyyy-MM-dd'))
  }

  function handleNextWeek() {
    goToWeek(format(addDays(new Date(from), 7), 'yyyy-MM-dd'))
  }

  function handleToday() {
    goToWeek(weekStartOf(new Date()))
  }

  async function handleSaved() {
    setSelection(null)
    await router.invalidate()
  }

  return (
    <>
      <PageHeader
        title="Rota"
        description="The year's rota. Everyone signed in can add, move, reassign and delete sessions — every change is logged."
      />

      <RotaFilterBar
        view={view}
        onViewChange={(v) =>
          void navigate({ search: (prev) => ({ ...prev, view: v }) })
        }
        from={from}
        to={to}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onToday={handleToday}
        activityType={activityType}
        onActivityTypeChange={setActivityType}
        fellowId={fellowId}
        onFellowIdChange={setFellowId}
        roster={roster}
        search={search}
        onSearchChange={setSearch}
        onNewEntry={() =>
          setSelection({
            fellowId: roster[0]?.id ?? '',
            date: from,
            timeSlot: 'AM',
          })
        }
      />

      {view === 'day' ? (
        <RotaByDay
          roster={visibleRoster}
          entries={filteredEntries}
          from={from}
          to={to}
          onOpen={setSelection}
        />
      ) : (
        <RotaByFellow
          roster={visibleRoster}
          entries={filteredEntries}
          from={from}
          onOpen={setSelection}
        />
      )}

      <RotaEntrySheet
        selection={selection}
        roster={roster}
        onClose={() => setSelection(null)}
        onSaved={handleSaved}
      />
    </>
  )
}
