import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/layout/coming-soon'

export const Route = createFileRoute('/_authenticated/admin/administrators')({
  component: AdminAdministratorsPage,
})

function AdminAdministratorsPage() {
  return (
    <ComingSoon items={['Manage lead fellow, coordinator and administrator accounts']} />
  )
}
