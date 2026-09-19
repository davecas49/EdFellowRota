import { useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'

import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { signInWithPassword } from '#/server/auth.functions'

export const Route = createFileRoute('/auth')({ component: AuthPage })

function AuthPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const result = await signInWithPassword({ data: { email, password } })
      if (!result.ok) {
        setError(result.message)
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
          <CardTitle className="text-2xl">ED Portal</CardTitle>
          <CardDescription>BHT Education Fellows programme</CardDescription>
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
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={submitting || !email || !password}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Link
              to="/forgot-password"
              className="text-center text-sm text-muted-foreground underline underline-offset-4"
            >
              First time here, or forgotten your password?
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
