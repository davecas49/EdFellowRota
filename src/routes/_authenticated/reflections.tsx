import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/layout/coming-soon'
import { PageHeader } from '#/components/layout/page-header'

export const Route = createFileRoute('/_authenticated/reflections')({
  component: ReflectionsPage,
})

function ReflectionsPage() {
  return (
    <>
      <PageHeader
        title="Reflections"
        description="Every past education or Sim session generates a reflection prompt."
      />
      <ComingSoon
        items={[
          'Outstanding reflections',
          'Completed reflections (expandable and editable)',
          '"Not needed" dismissals with restore',
          'Search',
          'Personal actions list fed from follow-up actions',
        ]}
      />
    </>
  )
}
