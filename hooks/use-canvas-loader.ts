"use client"

import { useEffect, useRef, useState } from "react"

import type { CanvasSnapshot } from "@/types/canvas"

interface UseCanvasLoaderOptions {
  projectId: string
  /**
   * Live node/edge counts. Captured on the first run to decide whether the
   * Liveblocks room was empty: a room that already has nodes or edges means
   * collaboration is in progress and the saved snapshot must not be loaded on
   * top of it.
   */
  nodeCount: number
  edgeCount: number
  onLoad: (snapshot: CanvasSnapshot) => void
}

/**
 * On editor mount, loads the project's saved canvas snapshot into an empty
 * Liveblocks room. Runs exactly once and reports when it is finished so
 * autosave can safely take over.
 */
export function useCanvasLoader({
  projectId,
  nodeCount,
  edgeCount,
  onLoad,
}: UseCanvasLoaderOptions) {
  const [isLoaded, setIsLoaded] = useState(false)
  // Blocks re-runs once the load has actually finished. A run that is cancelled
  // before finishing (e.g. Strict Mode's mount/unmount/mount) leaves this false
  // so the remount can retry.
  const doneRef = useRef(false)

  useEffect(() => {
    if (doneRef.current) return

    const roomIsEmpty = nodeCount === 0 && edgeCount === 0
    let cancelled = false

    function finish() {
      if (cancelled) return
      doneRef.current = true
      setIsLoaded(true)
    }

    async function load() {
      if (!roomIsEmpty) {
        finish()
        return
      }

      try {
        const response = await fetch(`/api/projects/${projectId}/canvas`)
        if (!response.ok) return

        const data = (await response.json().catch(() => null)) as {
          canvas: CanvasSnapshot | null
        } | null
        const canvas = data?.canvas
        if (cancelled || !canvas) return
        if (canvas.nodes.length === 0 && canvas.edges.length === 0) return

        onLoad(canvas)
      } finally {
        finish()
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [projectId, nodeCount, edgeCount, onLoad])

  return { isLoaded }
}
