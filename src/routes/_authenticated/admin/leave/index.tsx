import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/admin/leave/')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/leave/pending' })
  },
})
