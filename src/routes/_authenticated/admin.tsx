import { Link, Outlet, createFileRoute, redirect, useRouterState } from '@tanstack/react-router'

import { isStaff } from '#/lib/types'

export const Route = createFileRoute('/_authenticated/admin')({
  beforeLoad: ({ context }) => {
    if (!isStaff(context.profile.role)) throw redirect({ to: '/dashboard' })
  },
  component: AdminLayout,
})

const tabs = [
  { to: '/admin', label: 'Overview' },
  { to: '/admin/fellows', label: 'Fellows' },
  { to: '/admin/administrators', label: 'Administrators' },
  { to: '/admin/faculty', label: 'Faculty' },
  { to: '/admin/teaching', label: 'Teaching' },
  { to: '/admin/rooms', label: 'Rooms' },
  { to: '/admin/leave', label: 'Leave' },
  { to: '/admin/swaps', label: 'Swaps' },
  { to: '/admin/quality', label: 'Quality' },
  { to: '/admin/import', label: 'Import' },
] as const

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Administration</h1>
      <nav className="mb-6 flex flex-wrap gap-1 border-b">
        {tabs.map((tab) => {
          const active =
            tab.to === '/admin' ? pathname === '/admin' : pathname.startsWith(tab.to)
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`rounded-t-md border-b-2 px-3 py-2 text-sm font-medium ${
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
      <Outlet />
    </div>
  )
}
