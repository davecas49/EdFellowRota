import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { AdminReflectionRow } from '#/components/reflections/admin-reflection-row'
import { getAllReflections } from '#/server/reflections.functions'

import type { AdminReflectionItem } from '#/components/reflections/reflections-types'

export const Route = createFileRoute('/_authenticated/admin/reflections')({
  loader: () => getAllReflections(),
  component: AdminReflectionsPage,
})

type Tab = 'outstanding' | 'completed' | 'dismissed'

function matchesSearch(item: AdminReflectionItem, query: string) {
  const q = query.toLowerCase()
  return (
    item.fellowName.toLowerCase().includes(q) ||
    item.activityLabel.toLowerCase().includes(q) ||
    (item.whatWentWell ?? '').toLowerCase().includes(q) ||
    (item.whatCouldBeImproved ?? '').toLowerCase().includes(q) ||
    (item.keyLearningPoints ?? '').toLowerCase().includes(q) ||
    (item.followUpActions ?? '').toLowerCase().includes(q)
  )
}

function AdminReflectionsPage() {
  const data = Route.useLoaderData()

  const [tab, setTab] = useState<Tab>('outstanding')
  const [fellowId, setFellowId] = useState<string>('all')
  const [search, setSearch] = useState('')

  const lists: Record<Tab, Array<AdminReflectionItem>> = {
    outstanding: data.outstanding,
    completed: data.completed,
    dismissed: data.dismissed,
  }

  const visible = useMemo(() => {
    let list = lists[tab]
    if (fellowId !== 'all')
      list = list.filter((item) => item.fellowId === fellowId)
    const q = search.trim()
    return q ? list.filter((item) => matchesSearch(item, q)) : list
  }, [lists, tab, fellowId, search])

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        Read-only — reflections are private to each fellow to write; staff can
        view but not edit them.
      </p>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList>
            <TabsTrigger value="outstanding">
              Outstanding ({data.outstanding.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({data.completed.length})
            </TabsTrigger>
            <TabsTrigger value="dismissed">
              Not needed ({data.dismissed.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={fellowId} onValueChange={setFellowId}>
            <SelectTrigger size="sm" className="w-44">
              <SelectValue placeholder="All fellows" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All fellows</SelectItem>
              {data.fellows.map((fellow) => (
                <SelectItem key={fellow.id} value={fellow.id}>
                  {fellow.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reflections…"
            className="w-64"
          />
        </div>
      </div>

      <div className="grid gap-3">
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing here.</p>
        ) : (
          visible.map((item) => (
            <AdminReflectionRow key={item.rotaEntryId} item={item} />
          ))
        )}
      </div>
    </div>
  )
}
