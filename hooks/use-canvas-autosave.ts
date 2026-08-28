"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import type { CanvasEdge, CanvasNode } from "@/types/canvas"

export type CanvasSaveStatus = "idle" | "saving" | "saved" | "error"

/** How long the canvas must be quiet before a save is flushed. */
const DEBOUNCE_MS = 1500

/** How long "saved" / "error" show before the button returns to "Save". */
const REVERT_MS = 2000

interface UseCanvasAutosaveOptions {
  projectId: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  /**
   * Autosave stays dormant until the editor has finished checking for and
   * loading any previously saved canvas — otherwise an empty room would
   * immediately overwrite the saved snapshot.
   */
  enabled: boolean
  onStatusChange?: (status: CanvasSaveStatus) => void
}

/**
 * Debounced autosave for the collaborative canvas. Watches the live nodes and
 * edges, and once they settle, PUTs the snapshot to the canvas API route (which
 * uploads it to Vercel Blob and records the URL on the project). Also exposes
 * `saveNow` for a manual save through the exact same code path.
 */
export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  enabled,
  onStatusChange,
}: UseCanvasAutosaveOptions) {
  const [status, setStatus] = useState<CanvasSaveStatus>("idle")

  const updateStatus = useCallback(
    (next: CanvasSaveStatus) => {
      setStatus(next)
      onStatusChange?.(next)
    },
    [onStatusChange]
  )

  const lastSavedRef = useRef<string | null>(null)
  const initializedRef = useRef(false)
  const revertTimerRef = useRef<number | null>(null)

  const save = useCallback(
    async (snapshot: string) => {
      if (revertTimerRef.current !== null) {
        window.clearTimeout(revertTimerRef.current)
        revertTimerRef.current = null
      }

      updateStatus("saving")
      try {
        const response = await fetch(`/api/projects/${projectId}/canvas`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: snapshot,
        })
        if (!response.ok) throw new Error("Canvas save failed")
        lastSavedRef.current = snapshot
        updateStatus("saved")
      } catch {
        updateStatus("error")
      }

      revertTimerRef.current = window.setTimeout(() => {
        revertTimerRef.current = null
        updateStatus("idle")
      }, REVERT_MS)
    },
    [projectId, updateStatus]
  )

  const payload = JSON.stringify({ nodes, edges })

  // Keep the latest snapshot (and enabled flag) reachable from `saveNow` without
  // recreating the callback on every edit (ref writes stay out of render, per
  // `react-hooks/refs`).
  const payloadRef = useRef(payload)
  const enabledRef = useRef(enabled)
  useEffect(() => {
    payloadRef.current = payload
    enabledRef.current = enabled
  }, [payload, enabled])

  const saveNow = useCallback(() => {
    // Don't let a manual save race the initial load and overwrite the snapshot.
    if (!enabledRef.current) return
    void save(payloadRef.current)
  }, [save])

  useEffect(() => {
    if (!enabled) return

    // The first snapshot after enabling is whatever was just loaded (or an
    // empty room with nothing saved yet) — treat it as the baseline, don't
    // write it straight back.
    if (!initializedRef.current) {
      initializedRef.current = true
      lastSavedRef.current = payload
      return
    }

    if (payload === lastSavedRef.current) return

    const timer = window.setTimeout(() => {
      void save(payload)
    }, DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [enabled, payload, save])

  useEffect(
    () => () => {
      if (revertTimerRef.current !== null) {
        window.clearTimeout(revertTimerRef.current)
      }
    },
    []
  )

  return { status, saveNow }
}
