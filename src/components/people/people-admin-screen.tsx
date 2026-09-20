import { useMemo, useState } from 'react'
import { useRouter } from '@tanstack/react-router'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { PageHeader } from '#/components/layout/page-header'
import { PersonRow } from '#/components/people/person-row'
import { PersonSheet } from '#/components/people/person-sheet'

import type { PersonSheetTarget } from '#/components/people/person-sheet'
import type { PeopleScreenConfig, Person } from '#/components/people/people-types'

export function PeopleAdminScreen({
  config,
  people,
}: {
  config: PeopleScreenConfig
  people: Array<Person>
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [target, setTarget] = useState<PersonSheetTarget | null>(null)

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    const sorted = [...people].sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    if (!q) return sorted
    return sorted.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.department ?? '').toLowerCase().includes(q) ||
        (p.roleTitle ?? '').toLowerCase().includes(q),
    )
  }, [people, search])

  async function handleSaved() {
    setTarget(null)
    await router.invalidate()
  }

  return (
    <>
      <PageHeader title={config.title} description={config.description} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="w-64"
        />
        <Button type="button" onClick={() => setTarget({ person: null })}>
          New person
        </Button>
      </div>

      <div className="grid gap-2">
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nobody here yet.</p>
        ) : (
          visible.map((person) => (
            <PersonRow
              key={person.id}
              person={person}
              onOpen={() => setTarget({ person })}
            />
          ))
        )}
      </div>

      <PersonSheet
        target={target}
        config={config}
        onClose={() => setTarget(null)}
        onSaved={handleSaved}
      />
    </>
  )
}
