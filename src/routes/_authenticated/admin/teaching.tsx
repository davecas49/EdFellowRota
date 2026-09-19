import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/layout/coming-soon'

export const Route = createFileRoute('/_authenticated/admin/teaching')({
  component: AdminTeachingPage,
})

function AdminTeachingPage() {
  return (
    <ComingSoon items={['Manage teaching assignments and block leads']} />
  )
}
