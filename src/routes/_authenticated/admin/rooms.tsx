import { useMemo, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { PageHeader } from '#/components/layout/page-header'
import { RoomSheet } from '#/components/rooms/room-sheet'
import { listRooms } from '#/server/rooms.functions'

import type { RoomSheetTarget } from '#/components/rooms/room-sheet'

export const Route = createFileRoute('/_authenticated/admin/rooms')({
  loader: () => listRooms(),
  component: AdminRoomsPage,
})

function AdminRoomsPage() {
  const router = useRouter()
  const { rooms } = Route.useLoaderData()

  const [search, setSearch] = useState('')
  const [target, setTarget] = useState<RoomSheetTarget | null>(null)

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    const sorted = [...rooms].sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    return q ? sorted.filter((r) => r.name.toLowerCase().includes(q)) : sorted
  }, [rooms, search])

  async function handleSaved() {
    setTarget(null)
    await router.invalidate()
  }

  return (
    <>
      <PageHeader
        title="Rooms"
        description="Manage the rooms available for scheduling."
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="w-64"
        />
        <Button type="button" onClick={() => setTarget({ room: null })}>
          New room
        </Button>
      </div>

      <div className="grid gap-2">
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rooms yet.</p>
        ) : (
          visible.map((room) => (
            <Card
              key={room.id}
              className={room.isActive ? undefined : 'opacity-60'}
              onClick={() => setTarget({ room })}
            >
              <CardContent className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{room.name}</span>
                  <span className="text-muted-foreground">
                    Capacity {room.capacity}
                  </span>
                  {!room.isActive && (
                    <Badge variant="destructive">Inactive</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <RoomSheet target={target} onClose={() => setTarget(null)} onSaved={handleSaved} />
    </>
  )
}
