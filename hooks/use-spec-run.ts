"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRealtimeRun } from "@trigger.dev/react-hooks"

import type { CanvasGraph } from "@/hooks/use-canvas-graph"
import type { generateSpecTask } from "@/trigger/generate-spec"

/** Outcome reported once a spec run leaves the active state. */
export type SpecRunOutcome = "success" | "error"

interface ActiveRun {
  runId: string
  publicToken: string
}

interface StartResult {
  ok: boolean
  /** Message to surface when `ok` is false; the run never starts in that case. */
  error?: string
}

/** A chat message forwarded to the spec generator. */
export interface SpecChatMessage {
  sender?: string
  role?: "user" | "assistant"
  content: string
}

interface StartInput extends CanvasGraph {
  chatHistory: SpecChatMessage[]
}

interface UseSpecRunOptions {
  /** Called once when a started run completes or errors. */
  onComplete: (outcome: SpecRunOutcome, specId: string | null) => void
}

export interface SpecRun {
  /** True from the moment `start` resolves successfully until the run finishes. */
  isRunning: boolean
  /** Human-readable progress line derived from run metadata, or `null`. */
  statusText: string | null
  /**
   * Trigger `POST /api/ai/spec`, then fetch a run-scoped token from
   * `POST /api/ai/spec/token`, and begin subscribing to the run.
   */
  start: (roomId: string, input: StartInput) => Promise<StartResult>
}

const STATUS_TEXT: Record<string, string> = {
  generating: "Generating the technical spec…",
  complete: "Spec ready",
  error: "Spec generation failed",
}

function readString(meta: unknown, key: string): string | null {
  if (meta && typeof meta === "object" && key in meta) {
    const value = (meta as Record<string, unknown>)[key]
    return typeof value === "string" ? value : null
  }
  return null
}

/**
 * Owns the lifecycle of a single spec-generation run for the Specs tab: kick off
 * the background task, subscribe with `useRealtimeRun`, and report completion
 * along with the persisted `specId` read from run metadata. Mirrors
 * `hooks/use-design-run.ts`.
 */
export function useSpecRun({ onComplete }: UseSpecRunOptions): SpecRun {
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null)

  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  })

  const { run } = useRealtimeRun<typeof generateSpecTask>(activeRun?.runId, {
    accessToken: activeRun?.publicToken,
    enabled: activeRun !== null,
    skipColumns: ["payload", "output"],
    onComplete: (completed, err) => {
      setActiveRun(null)
      const failed = Boolean(err) || completed.status !== "COMPLETED"
      onCompleteRef.current(
        failed ? "error" : "success",
        failed ? null : readString(completed.metadata, "specId")
      )
    },
  })

  const statusText = (() => {
    const status = readString(run?.metadata, "status")
    return status ? (STATUS_TEXT[status] ?? null) : null
  })()

  const start = useCallback(
    async (roomId: string, input: StartInput): Promise<StartResult> => {
      try {
        const specResponse = await fetch("/api/ai/spec", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId,
            chatHistory: input.chatHistory,
            nodes: input.nodes,
            edges: input.edges,
          }),
        })
        if (!specResponse.ok) {
          return { ok: false, error: "Couldn't start spec generation. Try again." }
        }
        const { runId } = (await specResponse.json()) as { runId?: string }
        if (!runId) {
          return { ok: false, error: "Couldn't start spec generation. Try again." }
        }

        const tokenResponse = await fetch("/api/ai/spec/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId }),
        })
        if (!tokenResponse.ok) {
          return { ok: false, error: "Couldn't connect to the spec run. Try again." }
        }
        const { token } = (await tokenResponse.json()) as { token?: string }
        if (!token) {
          return { ok: false, error: "Couldn't connect to the spec run. Try again." }
        }

        setActiveRun({ runId, publicToken: token })
        return { ok: true }
      } catch {
        return { ok: false, error: "Couldn't reach the spec service. Try again." }
      }
    },
    []
  )

  return { isRunning: activeRun !== null, statusText, start }
}
