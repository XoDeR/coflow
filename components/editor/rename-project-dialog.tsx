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
  onOpenChange: (open: boolean) => void
  onNameChange: (name: string) => void
  onSubmit: () => void
}

export function RenameProjectDialog({
  open,
  currentName,
  name,
  isLoading,
  onOpenChange,
  onNameChange,
  onSubmit,
}: RenameProjectDialogProps) {
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
          <DialogFooter>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
