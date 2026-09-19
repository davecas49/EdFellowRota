import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/layout/coming-soon'

export const Route = createFileRoute('/_authenticated/admin/')({ component: AdminOverview })

function AdminOverview() {
  return (
    <ComingSoon
      items={[
        'Programme-wide overview: fellows, pending decisions, recent activity',
      ]}
    />
  )
}
