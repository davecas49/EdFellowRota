import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/layout/coming-soon'

export const Route = createFileRoute('/_authenticated/admin/leave/overrides')({
  component: AdminLeaveOverridesPage,
})

function AdminLeaveOverridesPage() {
  return <ComingSoon items={['Override an automated leave decision, with a note']} />
}
