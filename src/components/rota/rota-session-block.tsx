import { cn } from 'cn'
import { format } from 'date-fns'

import { activityColor, activityNeedsDarkText } from '#/lib/colors'
import { formatUkDate } from '#/lib/dates'

import type { RotaEntry } from '#/components/rota/rota-types'
import type { TimeSlot } from '#/lib/supabase/enums'

export interface RotaSlotSelection {
  entry?: RotaEntry
  fellowId: string
  date: string
  timeSlot: TimeSlot
}

/**
 * One clickable session, or an "Available" placeholder when there's no
 * entry for this fellow/date/slot (spec.md §3: availability must read as
 * "available", never blank). Shared by the By day grid and By fellow list.
 */
export function RotaSessionBlock({
  entry,
  fellowId,
  date,
  timeSlot,
  variant = 'grid',
  onOpen,
}: RotaSlotSelection & {
  variant?: 'grid' | 'list'
  onOpen: (selection: RotaSlotSelection) => void
}) {
  if (!entry) {
    return (
      <button
        type="button"
        onClick={() => onOpen({ fellowId, date, timeSlot })}
        className={cn(
          'w-full rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 text-xs text-muted-foreground transition-colors hover:bg-muted/60',
          variant === 'grid'
            ? 'flex h-full min-h-8 items-center justify-center px-2 py-1'
            : 'px-3 py-2 text-left',
        )}
      >
        Available
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onOpen({ entry, fellowId, date, timeSlot })}
      className={cn(
        'flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-1 text-left text-xs transition-opacity hover:opacity-90',
        activityNeedsDarkText[entry.activityType]
          ? 'text-foreground/90'
          : 'text-white',
        variant === 'grid' ? 'h-full min-h-8 justify-center' : 'py-2',
      )}
      style={{ backgroundColor: activityColor[entry.activityType] }}
    >
      <span className="font-medium leading-tight">{entry.activityLabel}</span>
      {variant === 'list' && (
        <span className="text-[11px] opacity-90">
          {format(new Date(entry.entryDate), 'EEE')} {formatUkDate(entry.entryDate)} · {entry.timeSlot}
        </span>
      )}
      {entry.notes && (
        <span className="line-clamp-1 text-[11px] opacity-90">
          {entry.notes}
        </span>
      )}
    </button>
  )
}
