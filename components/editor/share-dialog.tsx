"use client"

import { Check, Copy, User, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useShareDialog } from "@/hooks/use-share-dialog"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}

export function ShareDialog({ open, onOpenChange, projectId }: ShareDialogProps) {
  const {
    collaborators,
    isOwner,
    isLoading,
    loadError,
    inviteEmail,
    setInviteEmail,
    isInviting,
    inviteError,
    submitInvite,
    removingId,
    removeCollaborator,
    copied,
    copyLink,
    handleOpenChange,
  } = useShareDialog({ projectId, open, onOpenChange })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share project</DialogTitle>
          <DialogDescription>
            {isOwner
              ? "Invite collaborators by email and manage who has access."
              : "People with access to this project."}
          </DialogDescription>
        </DialogHeader>

        {isOwner ? (
          <form
            className="flex items-start gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              submitInvite()
            }}
          >
            <div className="flex-1">
              <label htmlFor="share-invite-email" className="sr-only">
                Collaborator email
              </label>
              <Input
                id="share-invite-email"
                type="email"
                placeholder="name@example.com"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
              />
              {inviteError ? (
                <p className="mt-1 text-xs text-destructive">{inviteError}</p>
              ) : null}
            </div>
            <Button type="submit" disabled={!inviteEmail.trim() || isInviting}>
              {isInviting ? "Inviting..." : "Invite"}
            </Button>
          </form>
        ) : null}

        <div className="flex flex-col gap-1">
          {isLoading ? (
            <p className="py-2 text-sm text-copy-muted">Loading collaborators...</p>
          ) : loadError ? (
            <p className="py-2 text-xs text-destructive">{loadError}</p>
          ) : collaborators.length === 0 ? (
            <p className="py-2 text-sm text-copy-muted">No collaborators yet.</p>
          ) : (
            <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto">
              {collaborators.map((collaborator) => (
                <li key={collaborator.id} className="flex items-center gap-2 py-1">
                  {collaborator.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={collaborator.imageUrl}
                      alt=""
                      className="size-7 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-subtle">
                      <User className="h-4 w-4 text-copy-muted" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    {collaborator.name ? (
                      <p className="truncate text-sm text-copy-primary">
                        {collaborator.name}
                      </p>
                    ) : null}
                    <p className="truncate text-xs text-copy-muted">
                      {collaborator.email}
                    </p>
                  </div>
                  {isOwner ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeCollaborator(collaborator.id)}
                      disabled={removingId === collaborator.id}
                      aria-label={`Remove ${collaborator.email}`}
                    >
                      <X />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={copyLink}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied!" : "Copy link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
