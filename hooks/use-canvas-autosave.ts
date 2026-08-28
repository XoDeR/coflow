"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import type { CanvasEdge, CanvasNode } from "@/types/canvas"

export type CanvasSaveStatus = "idle" | "saving" | "saved" | "error"

/** How long the canvas must be quiet before a save is flushed. */
const DEBOUNCE_MS = 1500

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
 * uploads it to Vercel Blob and records the URL on the project).
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

  const save = useCallback(
    async (snapshot: string) => {
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
    },
    [projectId, updateStatus]
  )

  const payload = JSON.stringify({ nodes, edges })

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

  return { status }
}
