import { createFileRoute } from '@tanstack/react-router'

/**
 * Public token endpoint for guest feedback submissions (spec.md §5/§7).
 * Will validate the token against `guest_feedback_invites` (checking
 * expiry and status) using the service-role client, then write the
 * submission back onto that invite row. Not yet implemented.
 */
export const Route = createFileRoute('/api/public/guest-feedback')({
  server: {
    handlers: {
      ANY: () =>
        new Response(
          JSON.stringify({ error: 'not_implemented', message: 'Guest feedback submission is not yet built.' }),
          { status: 501, headers: { 'content-type': 'application/json' } },
        ),
    },
  },
})
