import { useMemo } from 'react'
import { eachDayOfInterval, format } from 'date-fns'

import { formatUkDate } from '#/lib/dates'
import { RotaSessionBlock } from '#/components/rota/rota-session-block'

import type { RotaSlotSelection } from '#/components/rota/rota-session-block'
import type { RotaEntry, RotaRosterMember } from '#/components/rota/rota-types'

const FELLOW_COL_WIDTH = '10rem'

/** Fellow rows × day columns; all-day entries span the whole cell (spec.md §3). */
export function RotaByDay({
  roster,
  entries,
  from,
  to,
  onOpen,
}: {
  roster: Array<RotaRosterMember>
  entries: Array<RotaEntry>
  from: string
  to: string
  onOpen: (selection: RotaSlotSelection) => void
}) {
  const days = useMemo(
    () =>
      eachDayOfInterval({ start: new Date(from), end: new Date(to) }).map((d) =>
        format(d, 'yyyy-MM-dd'),
      ),
    [from, to],
  )

  const byFellowDate = useMemo(() => {
    const map = new Map<string, Array<RotaEntry>>()
    for (const entry of entries) {
      const key = `${entry.fellowId}|${entry.entryDate}`
      const list = map.get(key)
      if (list) list.push(entry)
      else map.set(key, [entry])
    }
    return map
  }, [entries])

  if (roster.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No fellows match the current filters.
      </p>
    )
  }

  const dayColWidth = `calc((100% - ${FELLOW_COL_WIDTH}) / ${days.length})`

  return (
    <div className="overflow-auto rounded-md border">
      <table className="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr>
            <th
              style={{ width: FELLOW_COL_WIDTH }}
              className="sticky left-0 top-0 z-20 border-b border-r bg-background p-2 text-left font-medium"
            >
              Fellow
            </th>
            {days.map((day) => (
              <th
                key={day}
                style={{ width: dayColWidth }}
                className="sticky top-0 z-10 border-b bg-background p-2 text-left font-medium"
              >
                <div>{format(new Date(day), 'EEEE')}</div>
                <div className="font-normal text-muted-foreground">{formatUkDate(day)}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roster.map((fellow) => (
            <tr key={fellow.id}>
              <th
                scope="row"
                className="sticky left-0 z-10 border-r bg-background p-2 text-left align-top font-medium"
              >
                {fellow.name}
              </th>
              {days.map((day) => {
                const dayEntries = byFellowDate.get(`${fellow.id}|${day}`) ?? []
                const allDay = dayEntries.find((e) => e.timeSlot === 'ALL_DAY')
                const am = dayEntries.find((e) => e.timeSlot === 'AM')
                const pm = dayEntries.find((e) => e.timeSlot === 'PM')

                return (
                  <td key={day} className="overflow-hidden border-b p-1 align-top">
                    {allDay ? (
                      <div className="min-h-16">
                        <RotaSessionBlock
                          entry={allDay}
                          fellowId={fellow.id}
                          date={day}
                          timeSlot="ALL_DAY"
                          onOpen={onOpen}
                        />
                      </div>
                    ) : (
                      <div className="flex min-h-16 flex-col gap-1">
                        <RotaSessionBlock
                          entry={am}
                          fellowId={fellow.id}
                          date={day}
                          timeSlot="AM"
                          onOpen={onOpen}
                        />
                        <RotaSessionBlock
                          entry={pm}
                          fellowId={fellow.id}
                          date={day}
                          timeSlot="PM"
                          onOpen={onOpen}
                        />
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
