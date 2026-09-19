import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/layout/coming-soon'

export const Route = createFileRoute('/_authenticated/admin/leave/pending')({
  component: AdminLeavePendingPage,
})

function AdminLeavePendingPage() {
  return <ComingSoon items={['Leave requests awaiting an automated or manual decision']} />
}
