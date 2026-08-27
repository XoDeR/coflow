"use client"

import { useEffect } from "react"
import type { ReactFlowInstance } from "@xyflow/react"

const ZOOM_ANIMATION_DURATION = 200

interface UseKeyboardShortcutsOptions {
  reactFlow: Pick<ReactFlowInstance, "zoomIn" | "zoomOut">
  onUndo: () => void
  onRedo: () => void
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable
}

/**
 * Binds the canvas zoom and history actions to keyboard shortcuts on `window`.
 * Shortcuts are ignored while the user is typing in an input, textarea, or
 * editable text field.
 */
export function useKeyboardShortcuts({ reactFlow, onUndo, onRedo }: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return

      const isModifier = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()

      if (isModifier && key === "z") {
        event.preventDefault()
        if (event.shiftKey) {
          onRedo()
        } else {
          onUndo()
        }
        return
      }

      if (isModifier && key === "y") {
        event.preventDefault()
        onRedo()
        return
      }

      if (isModifier) return

      if (event.key === "+" || event.key === "=") {
        event.preventDefault()
        reactFlow.zoomIn({ duration: ZOOM_ANIMATION_DURATION })
        return
      }

      if (event.key === "-") {
        event.preventDefault()
        reactFlow.zoomOut({ duration: ZOOM_ANIMATION_DURATION })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [reactFlow, onUndo, onRedo])
}
