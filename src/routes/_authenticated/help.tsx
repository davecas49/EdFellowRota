import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/layout/coming-soon'
import { PageHeader } from '#/components/layout/page-header'

export const Route = createFileRoute('/_authenticated/help')({ component: HelpPage })

function HelpPage() {
  return (
    <>
      <PageHeader title="Help" description="A role-filtered how-to guide." />
      <ComingSoon items={['Guide filtered to your role', '"Copy as Markdown"']} />
    </>
  )
}
