import { useMemo, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { createSupabaseBrowserClient } from '#/lib/supabase/client'

export const Route = createFileRoute('/reset-password')({
  validateSearch: z.object({
    email: z.string().email().optional(),
    kind: z.enum(['invite', 'recovery']).optional(),
  }),
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { email, kind } = Route.useSearch()

  if (!email || !kind) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Enter your code</CardTitle>
            <CardDescription>
              We couldn't tell which account this code is for — request a
              fresh one from the sign-in page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              to="/forgot-password"
              className="text-center text-sm text-muted-foreground underline underline-offset-4"
            >
              Request a code
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <CodeEntryForm email={email} kind={kind} />
}

function CodeEntryForm({ email, kind }: { email: string; kind: 'invite' | 'recovery' }) {
  const navigate = useNavigate()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: kind,
      })
      if (verifyError) {
        setError('That code is incorrect or has expired — request a fresh one.')
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message)
        return
      }
      await navigate({ to: '/dashboard' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Enter your code</CardTitle>
          <CardDescription>
            We sent a code to {email}. Enter it below along with your new
            password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={8}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                placeholder="12345678"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={submitting || code.length < 6 || password.length < 8}
            >
              {submitting ? 'Saving…' : 'Save password'}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Link
              to="/forgot-password"
              className="text-center text-sm text-muted-foreground underline underline-offset-4"
            >
              Request a new code
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
