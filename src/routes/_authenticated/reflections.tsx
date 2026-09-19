import { useMemo, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import { Input } from '#/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { PageHeader } from '#/components/layout/page-header'
import { ActionsList } from '#/components/reflections/actions-list'
import { ReflectionCard } from '#/components/reflections/reflection-card'
import { getMyReflections } from '#/server/reflections.functions'

import type { ReflectionItem } from '#/components/reflections/reflections-types'

export const Route = createFileRoute('/_authenticated/reflections')({
  loader: () => getMyReflections(),
  component: ReflectionsPage,
})

type Tab = 'outstanding' | 'completed' | 'dismissed'

function matchesSearch(item: ReflectionItem, query: string) {
  const q = query.toLowerCase()
  return (
    item.activityLabel.toLowerCase().includes(q) ||
    (item.whatWentWell ?? '').toLowerCase().includes(q) ||
    (item.whatCouldBeImproved ?? '').toLowerCase().includes(q) ||
    (item.keyLearningPoints ?? '').toLowerCase().includes(q) ||
    (item.followUpActions ?? '').toLowerCase().includes(q)
  )
}

function ReflectionsPage() {
  const router = useRouter()
  const data = Route.useLoaderData()

  const [tab, setTab] = useState<Tab>('outstanding')
  const [search, setSearch] = useState('')

  async function refresh() {
    await router.invalidate()
  }

  const lists: Record<Tab, Array<ReflectionItem>> = {
    outstanding: data.outstanding,
    completed: data.completed,
    dismissed: data.dismissed,
  }

  const visible = useMemo(() => {
    const list = lists[tab]
    const q = search.trim()
    return q ? list.filter((item) => matchesSearch(item, q)) : list
  }, [lists, tab, search])

  return (
    <>
      <PageHeader
        title="Reflections"
        description="Every past education or Sim session generates a reflection prompt."
      />

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
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reflections…"
          className="w-64"
        />
      </div>

      <div className="mb-6 grid gap-3">
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing here.</p>
        ) : (
          visible.map((item) => (
            <ReflectionCard
              key={item.rotaEntryId}
              item={item}
              onChanged={refresh}
            />
          ))
        )}
      </div>

      <ActionsList actions={data.actions} onChanged={refresh} />
    </>
  )
}
