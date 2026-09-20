import { useState } from 'react'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { Textarea } from '#/components/ui/textarea'
import {
  computeInitials,
  userRoleLabel,
} from '#/components/people/people-types'
import { fellowTiers, userRoles } from '#/lib/supabase/enums'
import {
  createPerson,
  resendInvite,
  setPersonActive,
  updatePerson,
} from '#/server/people.functions'

import type { PeopleScreenConfig, Person } from '#/components/people/people-types'
import type { FellowTier, UserRole } from '#/lib/supabase/enums'

export interface PersonSheetTarget {
  person: Person | null
}

export function PersonSheet({
  target,
  config,
  onClose,
  onSaved,
}: {
  target: PersonSheetTarget | null
  config: PeopleScreenConfig
  onClose: () => void
  onSaved: () => void
}) {
  return (
    <Sheet open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex flex-col">
        {target && (
          <PersonForm
            key={target.person?.id ?? 'new'}
            person={target.person}
            config={config}
            onClose={onClose}
            onSaved={onSaved}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function PersonForm({
  person,
  config,
  onClose,
  onSaved,
}: {
  person: Person | null
  config: PeopleScreenConfig
  onClose: () => void
  onSaved: () => void
}) {
  const roleOptions: ReadonlyArray<UserRole> = person
    ? userRoles
    : config.roles

  const [name, setName] = useState(person?.name ?? '')
  const [email, setEmail] = useState(person?.email ?? '')
  const [role, setRole] = useState<UserRole>(person?.role ?? config.roles[0])
  const [tier, setTier] = useState<FellowTier | ''>(person?.tier ?? '')
  const [phone, setPhone] = useState(person?.phone ?? '')
  const [initials, setInitials] = useState(
    person?.initials ?? computeInitials(name),
  )
  const [roleTitle, setRoleTitle] = useState(person?.roleTitle ?? '')
  const [department, setDepartment] = useState(person?.department ?? '')
  const [responsibilities, setResponsibilities] = useState(
    person?.responsibilities ?? '',
  )

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteMessage, setInviteMessage] = useState<string | null>(null)
  const [confirmToggle, setConfirmToggle] = useState(false)
  const [togglingActive, setTogglingActive] = useState(false)
  const [resending, setResending] = useState(false)

  const showTier = role === 'fellow'
  const showFacultyFields = role === 'faculty'

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        name,
        email,
        role,
        tier: showTier && tier ? tier : undefined,
        phone: phone || undefined,
        initials,
        roleTitle: showFacultyFields ? roleTitle || undefined : undefined,
        department: showFacultyFields ? department || undefined : undefined,
        responsibilities: showFacultyFields
          ? responsibilities || undefined
          : undefined,
      }

      const result = person
        ? await updatePerson({ data: { id: person.id, ...payload } })
        : await createPerson({ data: payload })

      if (!result.ok) {
        setError(result.message)
        return
      }

      onSaved()
    } catch {
      setError('Could not save — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleActive() {
    if (!person) return
    setTogglingActive(true)
    try {
      await setPersonActive({
        data: { id: person.id, isActive: !person.isActive },
      })
      setConfirmToggle(false)
      onSaved()
    } finally {
      setTogglingActive(false)
    }
  }

  async function handleResendInvite() {
    if (!person) return
    setResending(true)
    setInviteMessage(null)
    try {
      const result = await resendInvite({ data: { email: person.email } })
      setInviteMessage(result.message)
    } finally {
      setResending(false)
    }
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{person ? 'Edit person' : 'New person'}</SheetTitle>
        <SheetDescription>
          {person
            ? 'Update their details, change their role, or deactivate them.'
            : `Add a new ${config.title.toLowerCase().replace(/s$/, '')}. An invite email is sent once saved.`}
        </SheetDescription>
      </SheetHeader>

      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="grid flex-1 gap-4 overflow-y-auto px-4">
          <div className="grid gap-2">
            <Label htmlFor="person-name">Name</Label>
            <Input
              id="person-name"
              required
              value={name}
              onChange={(e) => {
                const next = e.target.value
                setName(next)
                setInitials((current) =>
                  current === '' || current === computeInitials(name)
                    ? computeInitials(next)
                    : current,
                )
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="person-email">Email</Label>
            <Input
              id="person-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="person-initials">Initials</Label>
            <Input
              id="person-initials"
              required
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase())}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="person-phone">Phone</Label>
            <Input
              id="person-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {roleOptions.length > 1 ? (
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {userRoleLabel(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid gap-1">
              <Label>Role</Label>
              <p className="text-sm text-muted-foreground">
                {userRoleLabel(role)}
              </p>
            </div>
          )}

          {showTier && (
            <div className="grid gap-2">
              <Label>Tier</Label>
              <Select
                value={tier || undefined}
                onValueChange={(v) => setTier(v as FellowTier)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a tier" />
                </SelectTrigger>
                <SelectContent>
                  {fellowTiers.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showFacultyFields && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="person-role-title">Role title</Label>
                <Input
                  id="person-role-title"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="person-department">Department</Label>
                <Input
                  id="person-department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="person-responsibilities">
                  Responsibilities
                </Label>
                <Textarea
                  id="person-responsibilities"
                  value={responsibilities}
                  onChange={(e) => setResponsibilities(e.target.value)}
                />
              </div>
            </>
          )}

          {person && person.userId === null && (
            <div className="grid gap-2 rounded-md border border-dashed p-3">
              <p className="text-sm text-muted-foreground">
                This person hasn&apos;t signed in yet.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={resending}
                onClick={handleResendInvite}
              >
                {resending ? 'Sending…' : 'Resend invite'}
              </Button>
              {inviteMessage && (
                <p className="text-sm text-muted-foreground">
                  {inviteMessage}
                </p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <SheetFooter>
          <Button type="submit" disabled={submitting || !name || !email}>
            {submitting ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {person && (
            <Button
              type="button"
              variant={person.isActive ? 'destructive' : 'secondary'}
              onClick={() => setConfirmToggle(true)}
            >
              {person.isActive ? 'Deactivate' : 'Reactivate'}
            </Button>
          )}
        </SheetFooter>
      </form>

      <Dialog open={confirmToggle} onOpenChange={setConfirmToggle}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {person?.isActive ? 'Deactivate this person?' : 'Reactivate this person?'}
            </DialogTitle>
            <DialogDescription>
              {person?.isActive
                ? 'They will no longer be able to sign in, and will drop out of rosters and dropdowns. Their history is kept — this is not a delete.'
                : 'They will be able to sign in again and reappear in rosters and dropdowns.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmToggle(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={person?.isActive ? 'destructive' : 'default'}
              disabled={togglingActive}
              onClick={handleToggleActive}
            >
              {togglingActive
                ? 'Saving…'
                : person?.isActive
                  ? 'Deactivate'
                  : 'Reactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
