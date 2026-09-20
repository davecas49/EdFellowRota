import { createFileRoute } from '@tanstack/react-router'

import { PeopleAdminScreen } from '#/components/people/people-admin-screen'
import { listPeople } from '#/server/people.functions'

const config = {
  title: 'Fellows',
  description: 'Manage fellow profiles: name, email, tier, phone and active status.',
  roles: ['fellow'],
} as const

export const Route = createFileRoute('/_authenticated/admin/fellows')({
  loader: () => listPeople({ data: { roles: [...config.roles] } }),
  component: AdminFellowsPage,
})

function AdminFellowsPage() {
  const { people } = Route.useLoaderData()
  return <PeopleAdminScreen config={config} people={people} />
}
