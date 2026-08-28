/**
 * Shared AI status feed.
 *
 * The AI workflows (design generation now, spec generation later) publish their
 * current activity here so every participant in a Liveblocks room sees the same
 * status. It lives under the `ai-status-feed` key in Liveblocks Storage — the
 * same shared-state mechanism the canvas itself uses, not a parallel realtime
 * channel — and is kept generic (an optional free-text detail line) so any AI
 * task can write to it.
 */

/** Liveblocks Storage key the feed lives under. */
export const AI_STATUS_FEED_KEY = "ai-status-feed" as const

/** Lifecycle of an AI run as surfaced to participants. */
export type AiStatusState = "working" | "complete" | "error"

const AI_STATUS_STATES: readonly AiStatusState[] = ["working", "complete", "error"]

/**
 * A single status feed message — only the most recent one is kept and displayed.
 *
 * Declared as a `type` (not an `interface`) so it passes Liveblocks' Storage
 * LSON validation, which rejects interfaces — same reason as `AiActivity` in
 * `types/ai-design.ts`.
 */
export type AiStatusMessage = {
  /** Whether the AI is mid-run, or has finished / failed. */
  state: AiStatusState
  /** Optional human-readable detail, shown as the status line in the sidebar. */
  text?: string
  /** Epoch ms the message was published; used to auto-dismiss finished states. */
  updatedAt: number
}

function isAiStatusState(value: unknown): value is AiStatusState {
  return typeof value === "string" && AI_STATUS_STATES.includes(value as AiStatusState)
}

/**
 * Narrow an untrusted value into an `AiStatusMessage`. Liveblocks Storage is
 * shared, mutable state, so the feed is validated at the boundary before the UI
 * renders it; anything malformed returns `null` and is skipped.
 */
export function parseAiStatusMessage(value: unknown): AiStatusMessage | null {
  if (typeof value !== "object" || value === null) return null

  const record = value as Record<string, unknown>

  const state = record.state
  if (!isAiStatusState(state)) return null

  const text = record.text
  if (text !== undefined && typeof text !== "string") return null

  const updatedAt = record.updatedAt

  return {
    state,
    text,
    updatedAt: typeof updatedAt === "number" ? updatedAt : 0,
  }
}
