import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/layout/coming-soon'

export const Route = createFileRoute('/_authenticated/admin/swaps')({
  component: AdminSwapsPage,
})

function AdminSwapsPage() {
  return <ComingSoon items={['Oversight of all swap requests across the programme']} />
}
