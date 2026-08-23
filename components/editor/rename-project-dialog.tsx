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

interface RenameProjectDialogProps {
  open: boolean
  currentName: string
  name: string
  isLoading: boolean
  error: string | null
  onOpenChange: (open: boolean) => void
  onNameChange: (name: string) => void
  onSubmit: () => void
}

export function RenameProjectDialog({
  open,
  currentName,
  name,
  isLoading,
  error,
  onOpenChange,
  onNameChange,
  onSubmit,
}: RenameProjectDialogProps) {
  const trimmed = name.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename project</DialogTitle>
          <DialogDescription>
            Renaming &ldquo;{currentName}&rdquo;.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <label htmlFor="rename-project-name" className="sr-only">
            Project name
          </label>
          <Input
            id="rename-project-name"
            autoFocus
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
          />
          {name && !trimmed ? (
            <p className="text-xs text-destructive">
              Name must include at least one letter or number.
            </p>
          ) : null}
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={!trimmed || isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
