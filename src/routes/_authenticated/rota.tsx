import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/layout/coming-soon'
import { PageHeader } from '#/components/layout/page-header'

export const Route = createFileRoute('/_authenticated/rota')({ component: RotaPage })

function RotaPage() {
  return (
    <>
      <PageHeader
        title="Rota"
        description="The year's rota. Everyone signed in can add, move, reassign and delete sessions — every change is logged."
      />
      <ComingSoon
        items={[
          'Two views: By day, By fellow',
          'Filters by activity type and fellow, free-text search',
          'Availability shown as "available"',
          'All-day sessions rendered as one continuous block',
          'Click any session to edit, move, reassign, add notes, or write a reflection',
          '"New entry" to add a session',
        ]}
      />
    </>
  )
}
