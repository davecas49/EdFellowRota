import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/layout/coming-soon'

export const Route = createFileRoute('/_authenticated/admin/quality')({
  component: AdminQualityPage,
})

function AdminQualityPage() {
  return (
    <ComingSoon
      items={[
        'AI rubric scoring of reflections and peer feedback',
        'Per-criterion scores, overall score, band and summary',
        'Reviewer notes',
      ]}
    />
  )
}
