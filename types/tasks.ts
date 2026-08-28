import { z } from "zod"

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

/**
 * Room chat feed (`25-sidebar-chat-feed`).
 *
 * Real-time chat between the people in a Liveblocks room, surfaced in the AI
 * sidebar. It lives under the `ai-chat` key in Liveblocks Storage — the same
 * shared-state mechanism the canvas and `ai-status-feed` use, not a parallel
 * realtime channel — and is kept deliberately separate from `ai-status-feed`,
 * which carries AI progress/presence, not conversation.
 */

/** Liveblocks Storage key the chat feed lives under. */
export const AI_CHAT_FEED_KEY = "ai-chat" as const

/**
 * A single chat message. Zod schema (not a hand-written guard) per the feature
 * spec; every feed entry is validated against it before the sidebar renders it,
 * since Liveblocks Storage is shared, mutable state.
 */
export const aiChatMessageSchema = z.object({
  /** Stable id, used as the React key. */
  id: z.string().min(1),
  /** Display name of the person who sent the message. */
  sender: z.string().min(1),
  /** Who authored it. Only `"user"` is produced today (no AI replies yet). */
  role: z.enum(["user", "assistant"]),
  /** The message text. */
  content: z.string().min(1),
  /** Epoch ms the message was sent. */
  timestamp: z.number(),
})

export type AiChatMessage = z.infer<typeof aiChatMessageSchema>

/**
 * Narrow an untrusted Storage value into a list of chat messages, dropping any
 * entry that fails validation rather than discarding the whole feed.
 */
export function parseAiChatFeed(value: unknown): AiChatMessage[] {
  if (!Array.isArray(value)) return []

  const messages: AiChatMessage[] = []
  for (const entry of value) {
    const result = aiChatMessageSchema.safeParse(entry)
    if (result.success) messages.push(result.data)
  }
  return messages.sort((a, b) => a.timestamp - b.timestamp)
}
