import { useState } from 'react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { userRoleLabel } from '#/components/people/people-types'
import { resendInvite } from '#/server/people.functions'

import type { Person } from '#/components/people/people-types'

export function PersonRow({
  person,
  onOpen,
}: {
  person: Person
  onOpen: () => void
}) {
  const [resending, setResending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleResend(event: React.MouseEvent) {
    event.stopPropagation()
    setResending(true)
    try {
      await resendInvite({ data: { email: person.email } })
      setSent(true)
    } finally {
      setResending(false)
    }
  }

  return (
    <Card
      className={person.isActive ? undefined : 'opacity-60'}
      onClick={onOpen}
    >
      <CardContent className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{person.name}</span>
            <Badge variant="outline">
              {person.roleTitle || userRoleLabel(person.role)}
            </Badge>
            {person.tier && <Badge variant="secondary">{person.tier}</Badge>}
            {!person.isActive && (
              <Badge variant="destructive">Inactive</Badge>
            )}
          </div>
          <p className="mt-1 text-muted-foreground">
            {person.email}
            {person.phone ? ` · ${person.phone}` : ''}
            {person.department ? ` · ${person.department}` : ''}
          </p>
        </div>

        {person.userId === null && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Invite pending</Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={resending || sent}
              onClick={handleResend}
            >
              {sent ? 'Sent' : resending ? 'Sending…' : 'Resend invite'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
