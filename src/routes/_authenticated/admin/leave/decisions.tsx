import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/layout/coming-soon'

export const Route = createFileRoute('/_authenticated/admin/leave/decisions')({
  component: AdminLeaveDecisionsPage,
})

function AdminLeaveDecisionsPage() {
  return <ComingSoon items={['Every automated and manual leave decision, with reasons']} />
}
