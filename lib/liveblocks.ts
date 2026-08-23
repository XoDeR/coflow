import { Liveblocks } from "@liveblocks/node"

declare global {
  var liveblocksGlobal: Liveblocks | undefined
}

// Constructed lazily (on first call, then cached) rather than at module scope:
// the Liveblocks constructor validates the secret key format synchronously, which
// would otherwise break Next.js's build-time route page-data collection.
export function getLiveblocksClient(): Liveblocks {
  if (!globalThis.liveblocksGlobal) {
    globalThis.liveblocksGlobal = new Liveblocks({ secret: process.env.LIVEBLOCKS_SECRET_KEY! })
  }
  return globalThis.liveblocksGlobal
}

// Same vivid palette used for canvas node text colors (`context/ui-context.md`),
// reused here so cursor colors stay consistent with the rest of the design system.
const CURSOR_COLOR_PALETTE = [
  "#52A8FF",
  "#BF7AF0",
  "#FF990A",
  "#FF6166",
  "#F75F8F",
  "#62C073",
  "#0AC7B4",
  "#00C8D4",
] as const

export function getUserColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % CURSOR_COLOR_PALETTE.length
  return CURSOR_COLOR_PALETTE[index]
}
