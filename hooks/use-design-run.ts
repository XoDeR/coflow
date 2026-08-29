"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRealtimeRun } from "@trigger.dev/react-hooks"

/** Outcome reported once a design run leaves the active state. */
export type DesignRunOutcome = "success" | "error"

interface ActiveRun {
  runId: string
  publicToken: string
}

interface StartResult {
  ok: boolean
  /** Message to surface in the chat feed when `ok` is false. */
  error?: string
}

export interface DesignRun {
  /** True from the moment `start` resolves successfully until the run finishes. */
  isRunning: boolean
  /**
   * Trigger `POST /api/ai/design`, then fetch a run-scoped public token from
   * `POST /api/ai/design/token`, and begin subscribing to the run. Resolves
   * `{ ok: false, error }` if either request fails; the run never starts in
   * that case.
   */
  start: (prompt: string, roomId: string) => Promise<StartResult>
}

interface UseDesignRunOptions {
  /** Called once when a started run completes or errors. */
  onComplete: (outcome: DesignRunOutcome) => void
}

/**
 * Owns the lifecycle of a single design-generation run for the AI sidebar:
 * kick off the background task, subscribe to it with `useRealtimeRun`, and
 * report completion. Canvas updates are not handled here — Liveblocks reflects
 * the agent's node/edge/presence writes on its own.
 */
export function useDesignRun({ onComplete }: UseDesignRunOptions): DesignRun {
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null)

  // Keep the latest callback without re-subscribing the realtime hook.
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  })

  useRealtimeRun(activeRun?.runId, {
    accessToken: activeRun?.publicToken,
    enabled: activeRun !== null,
    skipColumns: ["payload", "output"],
    onComplete: (run, err) => {
      setActiveRun(null)
      onCompleteRef.current(
        err || run.status !== "COMPLETED" ? "error" : "success"
      )
    },
  })

  const start = useCallback(
    async (prompt: string, roomId: string): Promise<StartResult> => {
      try {
        const designResponse = await fetch("/api/ai/design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // `roomId` doubles as the project id across the app (see the
          // `07-wire-editor-home` room-ID/project-ID alignment decision).
          body: JSON.stringify({ prompt, roomId, projectId: roomId }),
        })
        if (!designResponse.ok) {
          return { ok: false, error: "Couldn't start the design run. Try again." }
        }
        const { runId } = (await designResponse.json()) as { runId?: string }
        if (!runId) {
          return { ok: false, error: "Couldn't start the design run. Try again." }
        }

        const tokenResponse = await fetch("/api/ai/design/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId }),
        })
        if (!tokenResponse.ok) {
          return {
            ok: false,
            error: "Couldn't connect to the design run. Try again.",
          }
        }
        const { token } = (await tokenResponse.json()) as { token?: string }
        if (!token) {
          return {
            ok: false,
            error: "Couldn't connect to the design run. Try again.",
          }
        }

        setActiveRun({ runId, publicToken: token })
        return { ok: true }
      } catch {
        return { ok: false, error: "Couldn't reach the design service. Try again." }
      }
    },
    []
  )

  return { isRunning: activeRun !== null, start }
}
