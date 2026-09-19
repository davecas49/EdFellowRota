import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/layout/coming-soon'
import { PageHeader } from '#/components/layout/page-header'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { profile } = Route.useRouteContext()
  return (
    <>
      <PageHeader title={`Welcome, ${profile.name.split(' ')[0]}`} />
      <ComingSoon
        items={[
          'Sessions this week',
          'Reflections due',
          'Swap requests',
          'Peer-feedback count and average rating',
          'Upcoming sessions',
          'Declined-leave notices',
          'Recent rota changes',
        ]}
      />
    </>
  )
}
