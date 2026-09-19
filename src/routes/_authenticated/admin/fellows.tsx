import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/layout/coming-soon'

export const Route = createFileRoute('/_authenticated/admin/fellows')({
  component: AdminFellowsPage,
})

function AdminFellowsPage() {
  return (
    <ComingSoon
      items={['Manage fellow profiles: name, email, tier, phone, active status']}
    />
  )
}
