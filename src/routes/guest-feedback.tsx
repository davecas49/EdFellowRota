import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'

export const Route = createFileRoute('/guest-feedback')({
  validateSearch: z.object({ token: z.string().optional() }),
  component: GuestFeedbackPage,
})

function GuestFeedbackPage() {
  const { token } = Route.useSearch()

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Session feedback</CardTitle>
          <CardDescription>
            {token
              ? 'Thanks for taking the time to give feedback on this session.'
              : 'This link is missing its invite token — ask the fellow who invited you for a fresh link.'}
          </CardDescription>
        </CardHeader>
        {token && (
          <CardContent className="text-sm text-muted-foreground">
            Guest feedback form coming next: validates the token and expiry
            against `guest_feedback_invites`, then records strengths,
            development areas, a 1–5 rating and the guest's name, email and
            role.
          </CardContent>
        )}
      </Card>
    </div>
  )
}
