import { useMemo, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { PageHeader } from '#/components/layout/page-header'
import { FeedbackSheet } from '#/components/peer-feedback/feedback-sheet'
import { ReceivedCard } from '#/components/peer-feedback/received-card'
import { formatUkDate } from '#/lib/dates'
import { getMyPeerFeedbackData } from '#/server/peer-feedback.functions'

import type { SessionItem } from '#/components/peer-feedback/peer-feedback-types'

export const Route = createFileRoute('/_authenticated/peer-feedback')({
  loader: () => getMyPeerFeedbackData(),
  component: PeerFeedbackPage,
})

type Tab = 'sessions' | 'received'

function SessionRow({
  session,
  onOpen,
}: {
  session: SessionItem
  onOpen: (s: SessionItem) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-card p-3 text-sm">
      <div className="min-w-0">
        <p className="truncate font-medium">{session.activityLabel}</p>
        <p className="text-xs text-muted-foreground">
          {session.fellowName} · {formatUkDate(session.entryDate)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {session.isMySession && (
          <Badge variant="outline" className="text-xs">
            Your session
          </Badge>
        )}
        {session.myFeedback ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onOpen(session)}
          >
            View
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={() => onOpen(session)}
          >
            Give feedback
          </Button>
        )}
      </div>
    </div>
  )
}

function PeerFeedbackPage() {
  const router = useRouter()
  const data = Route.useLoaderData()

  const [tab, setTab] = useState<Tab>('sessions')
  const [search, setSearch] = useState('')
  const [openSession, setOpenSession] = useState<SessionItem | null>(null)

  async function refresh() {
    await router.invalidate()
  }

  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return data.sessions
    return data.sessions.filter(
      (s) =>
        s.activityLabel.toLowerCase().includes(q) ||
        s.fellowName.toLowerCase().includes(q),
    )
  }, [data.sessions, search])

  const givenCount = data.sessions.filter((s) => s.myFeedback).length

  return (
    <>
      <PageHeader
        title="Peer feedback"
        description="Give and view feedback for past education and Sim sessions only."
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList>
            <TabsTrigger value="sessions">
              Sessions ({data.sessions.length})
            </TabsTrigger>
            <TabsTrigger value="received">
              Received ({data.received.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === 'sessions' && (
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sessions or fellows…"
            className="w-64"
          />
        )}
      </div>

      {tab === 'sessions' && (
        <>
          {givenCount > 0 && (
            <p className="mb-3 text-sm text-muted-foreground">
              You have given feedback on {givenCount} of {data.sessions.length} sessions.
            </p>
          )}
          <div className="grid gap-2">
            {filteredSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {search ? 'No sessions match your search.' : 'No past education or Sim sessions found.'}
              </p>
            ) : (
              filteredSessions.map((session) => (
                <SessionRow
                  key={session.rotaEntryId}
                  session={session}
                  onOpen={setOpenSession}
                />
              ))
            )}
          </div>
        </>
      )}

      {tab === 'received' && (
        <div className="grid gap-3">
          {data.received.length === 0 ? (
            <p className="text-sm text-muted-foreground">No feedback received yet.</p>
          ) : (
            data.received.map((item) => (
              <ReceivedCard key={item.id} item={item} />
            ))
          )}
        </div>
      )}

      <FeedbackSheet
        session={openSession}
        onClose={() => setOpenSession(null)}
        onSaved={async () => {
          setOpenSession(null)
          await refresh()
        }}
      />
    </>
  )
}
