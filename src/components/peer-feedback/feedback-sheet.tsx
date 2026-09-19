import { useState } from 'react'
import { Check, Copy, Mail } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Separator } from '#/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { Textarea } from '#/components/ui/textarea'
import { formatUkDate } from '#/lib/dates'
import {
  createGuestInvite,
  submitPeerFeedback,
} from '#/server/peer-feedback.functions'

import type { GivenFeedback, InviteItem, SessionItem } from '#/components/peer-feedback/peer-feedback-types'

function RatingPicker({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: number) => void
}) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`flex size-9 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
            value === n
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-input bg-background hover:bg-muted'
          }`}
          aria-label={`Rating ${n}`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

function RatingDisplay({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-sm text-muted-foreground">No rating</span>
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`text-base ${n <= rating ? 'text-primary' : 'text-muted-foreground/30'}`}
        >
          ★
        </span>
      ))}
      <span className="ml-1 text-sm text-muted-foreground">{rating}/5</span>
    </div>
  )
}

function GivenFeedbackView({ feedback }: { feedback: GivenFeedback }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rating</span>
        <RatingDisplay rating={feedback.rating} />
      </div>
      {feedback.strengths && (
        <div className="grid gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Strengths</span>
          <p className="text-sm">{feedback.strengths}</p>
        </div>
      )}
      {feedback.developmentAreas && (
        <div className="grid gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Development areas</span>
          <p className="text-sm">{feedback.developmentAreas}</p>
        </div>
      )}
      {!feedback.strengths && !feedback.developmentAreas && (
        <p className="text-sm text-muted-foreground">No written feedback recorded.</p>
      )}
    </div>
  )
}

function FeedbackForm({
  session,
  onSaved,
}: {
  session: SessionItem
  onSaved: () => void
}) {
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
      await submitPeerFeedback({
        data: {
          rotaEntryId: session.rotaEntryId,
          toFellowId: session.fellowId,
          strengths: strengths || undefined,
          developmentAreas: developmentAreas || undefined,
          rating: rating ?? undefined,
        },
      })
      onSaved()
    } catch {
      setError('Could not submit — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label>Rating</Label>
        <RatingPicker value={rating} onChange={setRating} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="strengths">Strengths</Label>
        <Textarea
          id="strengths"
          value={strengths}
          onChange={(e) => setStrengths(e.target.value)}
          placeholder="What went particularly well?"
          rows={3}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="dev-areas">Development areas</Label>
        <Textarea
          id="dev-areas"
          value={developmentAreas}
          onChange={(e) => setDevelopmentAreas(e.target.value)}
          placeholder="What could be developed further?"
          rows={3}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        disabled={submitting || (!strengths && !developmentAreas && !rating)}
      >
        {submitting ? 'Submitting…' : 'Submit feedback'}
      </Button>
    </form>
  )
}

const inviteStatusVariant: Record<
  string,
  'default' | 'secondary' | 'outline'
> = {
  pending: 'secondary',
  submitted: 'default',
}

function InviteRow({ invite }: { invite: InviteItem }) {
  const expired =
    invite.status === 'pending' && new Date(invite.expiresAt) < new Date()
  const statusLabel = invite.status === 'submitted'
    ? 'Submitted'
    : expired
      ? 'Expired'
      : 'Pending'
  const variant = invite.status === 'submitted' ? 'default' : 'secondary'

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border p-2.5 text-sm">
      <div>
        <p className="font-medium">{invite.guestName ?? invite.guestEmail}</p>
        {invite.guestName && (
          <p className="text-xs text-muted-foreground">{invite.guestEmail}</p>
        )}
        {invite.guestRole && (
          <p className="text-xs text-muted-foreground">{invite.guestRole}</p>
        )}
      </div>
      <Badge variant={variant}>{statusLabel}</Badge>
    </div>
  )
}

function GuestInvitePanel({
  session,
  onInviteCreated,
}: {
  session: SessionItem
  onInviteCreated: () => void
}) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdUrl, setCreatedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setCreatedUrl(null)
    try {
      const result = await createGuestInvite({
        data: {
          rotaEntryId: session.rotaEntryId,
          guestEmail: email,
          guestName: name || undefined,
          guestRole: role || undefined,
        },
      })
      const url = `${window.location.origin}/guest-feedback?token=${result.token}`
      setCreatedUrl(url)
      setEmail('')
      setName('')
      setRole('')
      onInviteCreated()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not create invite — please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCopy() {
    if (!createdUrl) return
    await navigator.clipboard.writeText(createdUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const mailtoHref = createdUrl
    ? `mailto:${email}?subject=${encodeURIComponent('Feedback request — Education Fellows')}&body=${encodeURIComponent(`Hi,\n\nI'd be grateful if you could leave some feedback on a session I ran.\n\nPlease use this secure link (valid for 30 days):\n${createdUrl}\n\nThank you.`)}`
    : ''

  return (
    <div className="grid gap-4">
      {session.invites.length > 0 && (
        <div className="grid gap-2">
          {session.invites.map((invite) => (
            <InviteRow key={invite.id} invite={invite} />
          ))}
        </div>
      )}

      {createdUrl && (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
          <p className="mb-2 text-xs font-medium text-primary">Invite link ready</p>
          <p className="mb-3 break-all text-xs text-muted-foreground">{createdUrl}</p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="gap-1.5"
            >
              {copied ? (
                <Check className="size-3.5 text-green-600" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? 'Copied' : 'Copy link'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              asChild
            >
              <a href={mailtoHref} className="gap-1.5 inline-flex items-center">
                <Mail className="size-3.5" />
                Open in mail app
              </a>
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleCreate} className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="guest-email">Guest email (NHS)</Label>
          <Input
            id="guest-email"
            type="email"
            required
            placeholder="name@trust.nhs.uk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1.5">
            <Label htmlFor="guest-name">Name (optional)</Label>
            <Input
              id="guest-name"
              placeholder="Dr Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="guest-role">Role (optional)</Label>
            <Input
              id="guest-role"
              placeholder="Consultant"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="sm" disabled={submitting || !email}>
          {submitting ? 'Creating…' : 'Create invite link'}
        </Button>
      </form>
    </div>
  )
}

export function FeedbackSheet({
  session,
  onClose,
  onSaved,
}: {
  session: SessionItem | null
  onClose: () => void
  onSaved: () => void
}) {
  return (
    <Sheet open={session !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex flex-col overflow-y-auto">
        {session && (
          <>
            <SheetHeader>
              <SheetTitle>{session.activityLabel}</SheetTitle>
              <SheetDescription>
                {session.fellowName} · {formatUkDate(session.entryDate)}
              </SheetDescription>
            </SheetHeader>

            <div className="grid gap-6 px-0 py-4">
              {session.myFeedback ? (
                <div className="grid gap-2">
                  <p className="text-sm font-medium">Your feedback</p>
                  <GivenFeedbackView feedback={session.myFeedback} />
                </div>
              ) : (
                <div className="grid gap-2">
                  <p className="text-sm font-medium">Give feedback</p>
                  <FeedbackForm session={session} onSaved={onSaved} />
                </div>
              )}

              {session.isMySession && (
                <>
                  <Separator />
                  <div className="grid gap-3">
                    <p className="text-sm font-medium">Guest invites</p>
                    <GuestInvitePanel
                      session={session}
                      onInviteCreated={onSaved}
                    />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
