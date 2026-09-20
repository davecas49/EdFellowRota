import { createFileRoute } from '@tanstack/react-router'

import { PeopleAdminScreen } from '#/components/people/people-admin-screen'
import { listPeople } from '#/server/people.functions'

const config = {
  title: 'Administrators',
  description: 'Manage lead fellow, coordinator and administrator accounts.',
  roles: ['lead_fellow', 'coordinator', 'administrator'],
} as const

export const Route = createFileRoute('/_authenticated/admin/administrators')({
  loader: () => listPeople({ data: { roles: [...config.roles] } }),
  component: AdminAdministratorsPage,
})

function AdminAdministratorsPage() {
  const { people } = Route.useLoaderData()
  return <PeopleAdminScreen config={config} people={people} />
}
