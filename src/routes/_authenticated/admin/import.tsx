import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/layout/coming-soon'

export const Route = createFileRoute('/_authenticated/admin/import')({
  component: AdminImportPage,
})

function AdminImportPage() {
  return (
    <ComingSoon
      items={[
        'Upload the year\'s Excel rota',
        'Heuristic parsing; merged all-day cells expanded into morning and afternoon',
        'Duplicates skipped; every import logged',
      ]}
    />
  )
}
