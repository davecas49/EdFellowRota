import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { formatUkDate } from '#/lib/dates'
import { activityTypes } from '#/lib/supabase/enums'
import { activityTypeLabel } from '#/components/rota/rota-types'

import type { RotaRosterMember } from '#/components/rota/rota-types'
import type { ActivityType } from '#/lib/supabase/enums'

export function RotaFilterBar({
  view,
  onViewChange,
  from,
  to,
  onPrevWeek,
  onNextWeek,
  onToday,
  activityType,
  onActivityTypeChange,
  fellowId,
  onFellowIdChange,
  roster,
  search,
  onSearchChange,
  onNewEntry,
}: {
  view: 'day' | 'fellow'
  onViewChange: (view: 'day' | 'fellow') => void
  from: string
  to: string
  onPrevWeek: () => void
  onNextWeek: () => void
  onToday: () => void
  activityType: ActivityType | 'all'
  onActivityTypeChange: (value: ActivityType | 'all') => void
  fellowId: string | 'all'
  onFellowIdChange: (value: string) => void
  roster: Array<RotaRosterMember>
  search: string
  onSearchChange: (value: string) => void
  onNewEntry: () => void
}) {
  return (
    <div className="mb-4 grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={view}
          onValueChange={(v) => onViewChange(v as 'day' | 'fellow')}
        >
          <TabsList>
            <TabsTrigger value="day">By day</TabsTrigger>
            <TabsTrigger value="fellow">By fellow</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={onPrevWeek}
            aria-label="Previous week"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onToday}>
            Today
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={onNextWeek}
            aria-label="Next week"
          >
            <ChevronRight className="size-4" />
          </Button>
          <span className="ml-2 text-sm text-muted-foreground">
            {formatUkDate(from)} – {formatUkDate(to)}
          </span>
        </div>

        <Button type="button" onClick={onNewEntry} className="gap-1.5">
          <Plus className="size-4" />
          New entry
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={activityType}
          onValueChange={(v) => onActivityTypeChange(v as ActivityType | 'all')}
        >
          <SelectTrigger size="sm" className="w-44">
            <SelectValue placeholder="All activities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All activities</SelectItem>
            {activityTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {activityTypeLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={fellowId} onValueChange={onFellowIdChange}>
          <SelectTrigger size="sm" className="w-44">
            <SelectValue placeholder="All fellows" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All fellows</SelectItem>
            {roster.map((fellow) => (
              <SelectItem key={fellow.id} value={fellow.id}>
                {fellow.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search activity, notes or fellow…"
          className="w-64"
        />
      </div>
    </div>
  )
}
