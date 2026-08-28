"use client"

import { AlertTriangle, Check, Loader2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave"

interface CanvasSaveButtonProps {
  status: CanvasSaveStatus
  onSave: () => void
}

const LABELS: Record<CanvasSaveStatus, string> = {
  idle: "Save",
  saving: "Saving...",
  saved: "Saved",
  error: "Error",
}

/**
 * Save control for the workspace navbar. Clicking triggers a manual save through
 * the same path autosave uses; the label reflects the autosave status and
 * settles back to "Save" shortly after a save resolves.
 */
export function CanvasSaveButton({ status, onSave }: CanvasSaveButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onSave}
      disabled={status === "saving"}
      aria-live="polite"
    >
      {status === "saving" ? <Loader2 className="animate-spin text-copy-muted" /> : null}
      {status === "saved" ? <Check className="text-success" /> : null}
      {status === "error" ? <AlertTriangle className="text-error" /> : null}
      {status === "idle" ? <Save className="text-copy-muted" /> : null}
      <span className={status === "error" ? "text-error" : "text-copy-secondary"}>
        {LABELS[status]}
      </span>
    </Button>
  )
}
