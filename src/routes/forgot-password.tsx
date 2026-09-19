import { useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'

import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { requestAccountAccess } from '#/server/auth.functions'

export const Route = createFileRoute('/forgot-password')({ component: ForgotPasswordPage })

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage(null)
    try {
      const result = await requestAccountAccess({ data: { email } })
      if (!result.sent) {
        setErrorMessage(result.message)
        return
      }
      await navigate({
        to: '/reset-password',
        search: { email, kind: result.kind },
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Activate or reset</CardTitle>
          <CardDescription>
            Enter your registered email. We'll send a code to set your
            password, whether this is your first sign-in or you've forgotten
            it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@nhs.net"
              />
            </div>
            <Button type="submit" disabled={submitting || !email}>
              {submitting ? 'Sending…' : 'Send code'}
            </Button>
            {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
            <Link
              to="/auth"
              className="text-center text-sm text-muted-foreground underline underline-offset-4"
            >
              Back to sign in
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
