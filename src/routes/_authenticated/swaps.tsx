import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/layout/coming-soon'
import { PageHeader } from '#/components/layout/page-header'

export const Route = createFileRoute('/_authenticated/swaps')({ component: SwapsPage })

function SwapsPage() {
  return (
    <>
      <PageHeader title="Swaps" description="Request and respond to session swaps." />
      <ComingSoon items={['Request a swap for a session', 'Accept or decline swaps you were asked for']} />
    </>
  )
}
