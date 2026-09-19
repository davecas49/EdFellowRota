import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/layout/coming-soon'

export const Route = createFileRoute('/_authenticated/admin/rooms')({
  component: AdminRoomsPage,
})

function AdminRoomsPage() {
  return <ComingSoon items={['Manage rooms: name, capacity, active status']} />
}
