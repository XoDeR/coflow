"use client"

import { useMemo } from "react"
import { useMutation, useStorage } from "@liveblocks/react"

import {
  AI_CHAT_FEED_KEY,
  parseAiChatFeed,
  type AiChatMessage,
} from "@/types/tasks"

export interface AiChat {
  /** Validated chat messages, oldest first. Empty until Storage loads. */
  messages: AiChatMessage[]
  /** Append a message to the shared `ai-chat` feed. */
  sendMessage: (message: AiChatMessage) => void
}

/**
 * Read and write the shared `ai-chat` Storage entry — real-time chat for the
 * people in the room. Non-suspense `@liveblocks/react` hooks so the AI sidebar
 * doesn't need to sit inside a `ClientSideSuspense` boundary (same approach as
 * `use-ai-status.ts`).
 */
export function useAiChat(): AiChat {
  const raw = useStorage((root) => root[AI_CHAT_FEED_KEY])
  const messages = useMemo(() => parseAiChatFeed(raw), [raw])

  const sendMessage = useMutation(({ storage }, message: AiChatMessage) => {
    const current = storage.get(AI_CHAT_FEED_KEY) ?? []
    storage.set(AI_CHAT_FEED_KEY, [...current, message])
  }, [])

  return { messages, sendMessage }
}
