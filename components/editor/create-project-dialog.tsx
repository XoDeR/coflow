"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface CreateProjectDialogProps {
  open: boolean
  name: string
  roomId: string
  isLoading: boolean
  error: string | null
  onOpenChange: (open: boolean) => void
  onNameChange: (name: string) => void
  onSubmit: () => void
}

export function CreateProjectDialog({
  open,
  name,
  roomId,
  isLoading,
  error,
  onOpenChange,
  onNameChange,
  onSubmit,
}: CreateProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>
            Start a new architecture workspace.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="create-project-name"
              className="text-sm font-medium text-copy-primary"
            >
              Project name
            </label>
            <Input
              id="create-project-name"
              autoFocus
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="My project"
            />
            {name.trim() && !roomId ? (
              <p className="text-xs text-destructive">
                Name must include at least one letter or number.
              </p>
            ) : (
              <p className="text-xs text-copy-muted">
                {roomId ? `/${roomId}` : "Enter a name to preview the room ID"}
              </p>
            )}
          </div>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={!roomId || isLoading}>
              {isLoading ? "Creating..." : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
