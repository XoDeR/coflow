"use client"

import { useEffect, useState } from "react"
import { useStorage } from "@liveblocks/react/suspense"
import { AlertTriangle, Check, Loader2, Sparkles } from "lucide-react"

import type { AiActivity } from "@/types/ai-design"

/** How long a finished (complete / error) status stays on screen. */
const DISMISS_AFTER_MS = 6000

/**
 * Room-wide status feed for the AI design agent. Reads the shared `aiActivity`
 * Storage entry written by the `design-agent` Trigger.dev task, so every
 * participant sees the same progress messages.
 */
export function AiActivityFeed() {
  const activity = useStorage((root) => root.aiActivity) as AiActivity | null

  const [now, setNow] = useState(() => Date.now())
  const done = activity?.status === "complete" || activity?.status === "error"

  useEffect(() => {
    if (!done) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [done])

  if (!activity) return null
  if (done && now - activity.updatedAt > DISMISS_AFTER_MS) return null

  return (
    <div className="pointer-events-none absolute top-4 left-1/2 z-10 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-full border border-surface-border bg-surface/90 px-3 py-1.5 text-xs text-copy-secondary shadow-lg backdrop-blur-sm">
        <StatusIcon status={activity.status} />
        <span className="max-w-[60vw] truncate">{activity.message}</span>
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: AiActivity["status"] }) {
  if (status === "error") {
    return <AlertTriangle className="h-4 w-4 shrink-0 text-error" />
  }
  if (status === "complete") {
    return <Check className="h-4 w-4 shrink-0 text-success" />
  }
  if (status === "starting") {
    return <Sparkles className="h-4 w-4 shrink-0 text-ai-text" />
  }
  return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ai-text" />
}
