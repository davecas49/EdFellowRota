import { Resend } from 'resend'

import { env } from '#/env'

/**
 * Thin Resend wrapper. `RESEND_API_KEY` is optional (spec.md §7 "known gap:
 * no email sending domain is configured"), so this no-ops with a console
 * warning rather than failing the caller's mutation when it's unset.
 */
export async function sendEmail(message: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn(
      `[email] RESEND_API_KEY not set, skipping email to ${message.to}: ${message.subject}`,
    )
    return
  }

  const resend = new Resend(env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: message.to,
    subject: message.subject,
    html: message.html,
  })
  if (error) {
    console.error(`[email] Resend failed to send to ${message.to}:`, error)
  }
}
