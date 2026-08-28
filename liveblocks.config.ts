import type { LiveblocksFlow } from "@liveblocks/react-flow";

import type { AiActivity } from "./types/ai-design";
import type { CanvasEdge, CanvasNode } from "./types/canvas";

// Define Liveblocks types for your application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {
      // The React Flow canvas, synced via useLiveblocksFlow (defaults to the "flow" key).
      // Optional: useLiveblocksFlow lazily creates it on first connect if missing.
      flow?: LiveblocksFlow<CanvasNode, CanvasEdge>;
      // Shared AI design-agent status feed, written by the design-agent Trigger.dev task.
      // Optional: only present once the agent has run at least once in the room.
      aiActivity?: AiActivity;
    };

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    // Custom events, for useBroadcastEvent, useEventListener
    RoomEvent: Record<string, never>;
    // Example has two events, using a union
    // | { type: "PLAY" }
    // | { type: "REACTION"; emoji: "🔥" };

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: Record<string, never>;
    // Example, attaching coordinates to a thread
    // x: number;
    // y: number;

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: Record<string, never>;
    // Example, rooms with a title and url
    // title: string;
    // url: string;
  }
}

export {};
