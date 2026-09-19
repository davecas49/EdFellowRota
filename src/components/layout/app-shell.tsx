import { useState } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  CalendarDays,
  ClipboardList,
  Home,
  LogOut,
  MessageSquareText,
  Menu,
  NotebookPen,
  Plane,
  Plug,
  Repeat2,
  ShieldCheck,
} from 'lucide-react'

import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '#/components/ui/sheet'
import { isStaff } from '#/lib/types'
import { signOut } from '#/server/auth.functions'

import type { Profile } from '#/lib/types'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/rota', label: 'Rota', icon: CalendarDays },
  { to: '/reflections', label: 'Reflections', icon: NotebookPen },
  { to: '/peer-feedback', label: 'Peer feedback', icon: MessageSquareText },
  { to: '/leave', label: 'Leave', icon: Plane },
  { to: '/swaps', label: 'Swaps', icon: Repeat2 },
] as const

export function AppShell({
  profile,
  children,
}: {
  profile: Profile
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r bg-sidebar md:flex md:flex-col">
        <SidebarContent profile={profile} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b bg-card px-4 py-3 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0">
              <SidebarContent profile={profile} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="font-semibold">ED Portal</span>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="page-wrap">{children}</div>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({
  profile,
  onNavigate,
}: {
  profile: Profile
  onNavigate?: () => void
}) {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  async function handleSignOut() {
    await signOut()
    await navigate({ to: '/auth' })
  }

  const items = [
    ...navItems,
    ...(isStaff(profile.role)
      ? [{ to: '/admin' as const, label: 'Administration', icon: ShieldCheck }]
      : []),
    { to: '/help' as const, label: 'Help', icon: ClipboardList },
    { to: '/connect' as const, label: 'Connect', icon: Plug },
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <span className="text-lg font-bold tracking-tight text-primary">ED Portal</span>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {items.map((item) => {
          const active =
            pathname === item.to || pathname.startsWith(`${item.to}/`)
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center gap-3 px-1 py-2">
          <Avatar className="size-8">
            <AvatarFallback>{profile.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{profile.name}</p>
            <p className="stat-label truncate text-xs">{profile.role.replace('_', ' ')}</p>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleSignOut}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </div>
  )
}
