import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { formatUkDate } from '#/lib/dates'

export const Route = createFileRoute('/guest-feedback')({
  validateSearch: z.object({ token: z.string().optional() }),
  component: GuestFeedbackPage,
})

interface SessionInfo {
  sessionLabel: string
  sessionDate: string
  fellowName: string
  guestName: string | null
  guestEmail: string
  guestRole: string | null
}

type PageState =
  | { kind: 'loading' }
  | { kind: 'no_token' }
  | { kind: 'invalid' }
  | { kind: 'already_submitted' }
  | { kind: 'expired' }
  | { kind: 'ready'; info: SessionInfo }
  | { kind: 'submitted' }

function RatingPicker({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: number) => void
}) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`flex size-10 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
            value === n
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-input bg-background hover:bg-muted'
          }`}
          aria-label={`Rating ${n} out of 5`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

function GuestFeedbackForm({
  token,
  info,
  onSubmitted,
}: {
  token: string
  info: SessionInfo
  onSubmitted: () => void
}) {
  const [guestName, setGuestName] = useState(info.guestName ?? '')
  const [guestEmail, setGuestEmail] = useState(info.guestEmail ?? '')
  const [guestRole, setGuestRole] = useState(info.guestRole ?? '')
  const [strengths, setStrengths] = useState('')
  const [developmentAreas, setDevelopmentAreas] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/public/guest-feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
          guestRole: guestRole.trim(),
          strengths: strengths.trim() || undefined,
          developmentAreas: developmentAreas.trim() || undefined,
          rating: rating ?? undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        if (data.error === 'validation_error') {
          setError('Please check your email address — it must be an NHS address (@nhs.net or @nhs.uk).')
        } else if (data.error === 'token_expired') {
          setError('This invite link has expired. Please ask the fellow for a new one.')
        } else {
          setError('Could not submit — please try again.')
        }
        return
      }

      onSubmitted()
    } catch {
      setError('Could not submit — please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="rounded-md border bg-muted/40 p-3 text-sm">
        <p className="font-medium">{info.sessionLabel}</p>
        <p className="text-muted-foreground">
          {info.fellowName} · {formatUkDate(info.sessionDate)}
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="guest-name">Your name</Label>
          <Input
            id="guest-name"
            required
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Dr Smith"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="guest-email">Your NHS email</Label>
          <Input
            id="guest-email"
            type="email"
            required
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            placeholder="name@trust.nhs.uk"
          />
          <p className="text-xs text-muted-foreground">Must be an @nhs.net or @nhs.uk address.</p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="guest-role">Your role</Label>
          <Input
            id="guest-role"
            required
            value={guestRole}
            onChange={(e) => setGuestRole(e.target.value)}
            placeholder="Consultant Physician"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Overall rating</Label>
        <RatingPicker value={rating} onChange={setRating} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="strengths">Strengths</Label>
        <Textarea
          id="strengths"
          value={strengths}
          onChange={(e) => setStrengths(e.target.value)}
          placeholder="What did they do particularly well?"
          rows={4}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="dev-areas">Development areas</Label>
        <Textarea
          id="dev-areas"
          value={developmentAreas}
          onChange={(e) => setDevelopmentAreas(e.target.value)}
          placeholder="What could be developed further?"
          rows={4}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        disabled={submitting || !guestName || !guestEmail || !guestRole}
      >
        {submitting ? 'Submitting…' : 'Submit feedback'}
      </Button>
    </form>
  )
}

function GuestFeedbackPage() {
  const { token } = Route.useSearch()
  const [state, setState] = useState<PageState>(
    token ? { kind: 'loading' } : { kind: 'no_token' },
  )

  useEffect(() => {
    if (!token) return
    void (async () => {
      try {
        const res = await fetch(
          `/api/public/guest-feedback?token=${encodeURIComponent(token)}`,
        )
        if (res.status === 410) {
          const data = await res.json().catch(() => ({})) as { error?: string }
          setState({
            kind:
              data.error === 'already_submitted' ? 'already_submitted' : 'expired',
          })
          return
        }
        if (!res.ok) {
          setState({ kind: 'invalid' })
          return
        }
        const info = await res.json() as SessionInfo
        setState({ kind: 'ready', info })
      } catch {
        setState({ kind: 'invalid' })
      }
    })()
  }, [token])

  const content = (): React.ReactNode => {
    switch (state.kind) {
      case 'loading':
        return (
          <CardContent>
            <p className="text-sm text-muted-foreground">Loading…</p>
          </CardContent>
        )
      case 'no_token':
        return (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This link is missing its invite token — ask the fellow who invited
              you for a fresh link.
            </p>
          </CardContent>
        )
      case 'invalid':
        return (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This link is not valid. It may have been entered incorrectly —
              please use the full link from the invitation.
            </p>
          </CardContent>
        )
      case 'expired':
        return (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This invite link has expired (links are valid for 30 days). Please
              ask the fellow who invited you for a new one.
            </p>
          </CardContent>
        )
      case 'already_submitted':
        return (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Feedback for this session has already been submitted via this link.
              Thank you.
            </p>
          </CardContent>
        )
      case 'ready':
        return (
          <CardContent>
            <GuestFeedbackForm
              token={token!}
              info={state.info}
              onSubmitted={() => setState({ kind: 'submitted' })}
            />
          </CardContent>
        )
      case 'submitted':
        return (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your feedback has been submitted. Thank you for taking the time —
              it will go directly to the fellow.
            </p>
          </CardContent>
        )
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Session feedback</CardTitle>
          <CardDescription>
            {state.kind === 'ready'
              ? 'Please complete the form below. All fields marked as required must be filled in.'
              : 'BHT Education Fellows — peer feedback'}
          </CardDescription>
        </CardHeader>
        {content()}
      </Card>
    </div>
  )
}
