import { useMemo, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { PageHeader } from '#/components/layout/page-header'
import { TeachingSheet } from '#/components/teaching/teaching-sheet'
import { listTeachingAssignments } from '#/server/teaching.functions'

import type { TeachingSheetTarget } from '#/components/teaching/teaching-sheet'

export const Route = createFileRoute('/_authenticated/admin/teaching')({
  loader: () => listTeachingAssignments(),
  component: AdminTeachingPage,
})

function AdminTeachingPage() {
  const router = useRouter()
  const { assignments, roster } = Route.useLoaderData()

  const [search, setSearch] = useState('')
  const [target, setTarget] = useState<TeachingSheetTarget | null>(null)

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return assignments
    return assignments.filter((a) =>
      [
        a.fellowName,
        a.assignmentType,
        a.university,
        a.blockCode,
        a.blockName,
        a.rotationLevel,
        a.sessionName,
        a.notes,
      ]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q)),
    )
  }, [assignments, search])

  async function handleSaved() {
    setTarget(null)
    await router.invalidate()
  }

  return (
    <>
      <PageHeader
        title="Teaching"
        description="Manage teaching assignments across university, block and prescribing duties."
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="w-64"
        />
        <Button
          type="button"
          onClick={() => setTarget({ assignment: null })}
        >
          New assignment
        </Button>
      </div>

      <div className="grid gap-2">
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No teaching assignments yet.
          </p>
        ) : (
          visible.map((a) => (
            <Card
              key={a.id}
              className="cursor-pointer"
              onClick={() => setTarget({ assignment: a })}
            >
              <CardContent className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {a.fellowName ?? 'Unassigned'}
                    </span>
                    <Badge variant="outline">{a.assignmentType}</Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {[
                      a.university,
                      a.blockCode,
                      a.blockName,
                      a.rotationLevel,
                      a.sessionName,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    {a.durationHours ? ` · ${a.durationHours}h` : ''}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <TeachingSheet
        target={target}
        roster={roster}
        onClose={() => setTarget(null)}
        onSaved={handleSaved}
      />
    </>
  )
}
