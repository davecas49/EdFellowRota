import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/layout/coming-soon'

export const Route = createFileRoute('/_authenticated/admin/faculty')({
  component: AdminFacultyPage,
})

function AdminFacultyPage() {
  return (
    <ComingSoon
      items={['Manage the faculty directory: contacts, roles, departments, responsibilities']}
    />
  )
}
