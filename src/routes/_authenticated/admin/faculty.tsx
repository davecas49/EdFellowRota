import { createFileRoute } from '@tanstack/react-router'

import { PeopleAdminScreen } from '#/components/people/people-admin-screen'
import { listPeople } from '#/server/people.functions'

const config = {
  title: 'Faculty',
  description:
    'Manage the faculty directory: contacts, role titles, departments and responsibilities.',
  roles: ['faculty'],
} as const

export const Route = createFileRoute('/_authenticated/admin/faculty')({
  loader: () => listPeople({ data: { roles: [...config.roles] } }),
  component: AdminFacultyPage,
})

function AdminFacultyPage() {
  const { people } = Route.useLoaderData()
  return <PeopleAdminScreen config={config} people={people} />
}
