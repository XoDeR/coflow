"use client"

import { AlertTriangle, Check, Cloud, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave"

interface CanvasSaveButtonProps {
  status: CanvasSaveStatus
}

const LABELS: Record<CanvasSaveStatus, string> = {
  idle: "Save",
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed",
}

/**
 * Save-status indicator shown in the editor navbar. Display-only — autosave
 * drives the actual persistence; this just surfaces its current state.
 */
export function CanvasSaveButton({ status }: CanvasSaveButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled
      aria-live="polite"
      className="disabled:opacity-100"
    >
      {status === "saving" ? <Loader2 className="animate-spin text-copy-muted" /> : null}
      {status === "saved" ? <Check className="text-success" /> : null}
      {status === "error" ? <AlertTriangle className="text-error" /> : null}
      {status === "idle" ? <Cloud className="text-copy-muted" /> : null}
      <span
        className={status === "error" ? "text-error" : "text-copy-secondary"}
      >
        {LABELS[status]}
      </span>
    </Button>
  )
}
