import { useMemo } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { RotaSessionBlock } from '#/components/rota/rota-session-block'

import type { RotaSlotSelection } from '#/components/rota/rota-session-block'
import type { RotaEntry, RotaRosterMember } from '#/components/rota/rota-types'

/** One section per fellow; zero-entry fellows still show, as "available" (spec.md §3). */
export function RotaByFellow({
  roster,
  entries,
  from,
  onOpen,
}: {
  roster: Array<RotaRosterMember>
  entries: Array<RotaEntry>
  from: string
  onOpen: (selection: RotaSlotSelection) => void
}) {
  const byFellow = useMemo(() => {
    const map = new Map<string, Array<RotaEntry>>()
    for (const entry of entries) {
      const list = map.get(entry.fellowId)
      if (list) list.push(entry)
      else map.set(entry.fellowId, [entry])
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          a.entryDate.localeCompare(b.entryDate) ||
          a.timeSlot.localeCompare(b.timeSlot),
      )
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

  return (
    <div className="grid gap-4">
      {roster.map((fellow) => {
        const fellowEntries = byFellow.get(fellow.id) ?? []
        return (
          <Card key={fellow.id}>
            <CardHeader>
              <CardTitle className="text-base">{fellow.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {fellowEntries.length === 0 ? (
                <RotaSessionBlock
                  fellowId={fellow.id}
                  date={from}
                  timeSlot="AM"
                  variant="list"
                  onOpen={onOpen}
                />
              ) : (
                <div className="grid gap-1.5">
                  {fellowEntries.map((entry) => (
                    <RotaSessionBlock
                      key={entry.id}
                      entry={entry}
                      fellowId={fellow.id}
                      date={entry.entryDate}
                      timeSlot={entry.timeSlot}
                      variant="list"
                      onOpen={onOpen}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
