import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { AppShell } from '#/components/layout/app-shell'
import { getCurrentProfile } from '#/server/auth.functions'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const profile = await getCurrentProfile()
    if (!profile) throw redirect({ to: '/auth' })
    return { profile }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { profile } = Route.useRouteContext()
  return (
    <AppShell profile={profile}>
      <Outlet />
    </AppShell>
  )
}
