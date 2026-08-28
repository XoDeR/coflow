"use client"

import { useMemo } from "react"
import { useStorage } from "@liveblocks/react"

import {
  AI_STATUS_FEED_KEY,
  parseAiStatusMessage,
  type AiStatusMessage,
} from "@/types/tasks"

export interface AiStatus {
  /** The most recent validated feed message, or `null` when there is none. */
  message: AiStatusMessage | null
  /** Whether an AI run is currently in progress in this room. */
  isGenerating: boolean
}

/**
 * Read the shared `ai-status-feed` Storage entry. Non-suspense `useStorage` so
 * callers (e.g. the AI sidebar) don't need to sit inside a `ClientSideSuspense`
 * boundary — it returns `null` until Storage loads.
 */
export function useAiStatus(): AiStatus {
  const raw = useStorage((root) => root[AI_STATUS_FEED_KEY])
  const message = useMemo(() => parseAiStatusMessage(raw), [raw])
  return { message, isGenerating: message?.state === "working" }
}
