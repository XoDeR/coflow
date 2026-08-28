"use client"

import type { ReactNode } from "react"
import {
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense"

interface EditorRoomProps {
  roomId: string
  children: ReactNode
}

/**
 * Liveblocks room context for the whole editor workspace. Wraps both the canvas
 * and the AI sidebar so they share one room connection — the sidebar reads the
 * `ai-status-feed` Storage entry and participant presence from here. Renders no
 * DOM of its own, so children keep their place in the surrounding flex layout.
 */
export function EditorRoom({ roomId, children }: EditorRoomProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomId} initialPresence={{ cursor: null, thinking: false }}>
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  )
}
