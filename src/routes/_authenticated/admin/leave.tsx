import { Link, Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/admin/leave')({ component: AdminLeaveLayout })

const tabs = [
  { to: '/admin/leave/pending', label: 'Pending' },
  { to: '/admin/leave/decisions', label: 'Decisions' },
  { to: '/admin/leave/overrides', label: 'Overrides' },
] as const

function AdminLeaveLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <div>
      <div className="mb-4 flex gap-1">
        {tabs.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              pathname.startsWith(tab.to)
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <Outlet />
    </div>
  )
}
