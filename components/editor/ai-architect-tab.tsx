"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react"

import { useSelf } from "@liveblocks/react"
import { Bot, Loader2, SendHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAiChat } from "@/hooks/use-ai-chat"
import { useAiStatus } from "@/hooks/use-ai-status"
import { useDesignRun } from "@/hooks/use-design-run"
import { cn } from "@/lib/utils"

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
]

const AI_SENDER = "Coflow AI"

interface AiArchitectTabProps {
  /** Liveblocks room / project id — the target of the design run. */
  roomId: string
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function AiArchitectTab({ roomId }: AiArchitectTabProps) {
  const { messages, sendMessage } = useAiChat()
  const senderName = useSelf((me) => me.info.name) ?? "Anonymous"
  const { message: statusMessage, isGenerating } = useAiStatus()

  const [input, setInput] = useState("")
  const [sendFailed, setSendFailed] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const pushMessage = useCallback(
    (role: "user" | "assistant", sender: string, content: string) => {
      sendMessage({
        id: crypto.randomUUID(),
        sender,
        role,
        content,
        timestamp: Date.now(),
      })
    },
    [sendMessage]
  )

  const { isRunning, start } = useDesignRun({
    onComplete: (outcome) => {
      pushMessage(
        "assistant",
        AI_SENDER,
        outcome === "success"
          ? "I've updated the canvas with your design."
          : "The design run didn't finish. Please try again."
      )
    },
  })

  // A run is active for this participant when they started one, or when anyone
  // in the room has generation in progress (surfaced through `ai-status-feed`).
  const runActive = isRunning || isGenerating

  useEffect(() => {
    const node = scrollRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages.length])

  const send = useCallback(
    (content: string) => {
      if (runActive) return
      const trimmed = content.trim()
      if (!trimmed) return

      try {
        pushMessage("user", senderName, trimmed)
      } catch {
        setSendFailed(true)
        return
      }
      setInput("")
      setSendFailed(false)

      void start(trimmed, roomId).then((result) => {
        if (!result.ok) {
          pushMessage(
            "assistant",
            AI_SENDER,
            result.error ?? "Something went wrong. Please try again."
          )
        }
      })
    },
    [runActive, senderName, roomId, pushMessage, start]
  )

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      send(input)
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-subtle">
              <Bot className="h-5 w-5 text-ai-text" />
            </div>
            <p className="max-w-60 text-sm text-copy-muted">
              Describe a system and Coflow AI will map it onto the shared canvas.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => send(prompt)}
                  disabled={runActive}
                  className="rounded-full bg-subtle px-3 py-1.5 text-xs text-ai-text transition-colors hover:bg-subtle-border/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message) => {
              const isOwn =
                message.role === "user" && message.sender === senderName
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex max-w-[85%] flex-col gap-1",
                    isOwn ? "items-end self-end" : "items-start self-start"
                  )}
                >
                  <div className="flex items-center gap-1.5 px-1 text-[0.7rem] text-copy-faint">
                    <span className="font-medium text-copy-muted">
                      {message.sender}
                    </span>
                    <span>{formatTime(message.timestamp)}</span>
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                      isOwn
                        ? "bg-success text-background"
                        : "border border-surface-border bg-elevated text-copy-primary"
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {runActive ? (
        <div
          aria-live="polite"
          className="flex items-center gap-2 border-t border-surface-border bg-elevated px-4 py-2 text-xs text-success"
        >
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
          <span className="truncate">
            {statusMessage?.text?.trim() || "Coflow AI is working…"}
          </span>
        </div>
      ) : null}

      <div className="border-t border-surface-border p-3">
        {sendFailed ? (
          <p className="mb-1.5 text-[0.7rem] text-error">
            Couldn’t send that message. Try again.
          </p>
        ) : null}
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={runActive}
            placeholder={
              runActive ? "Coflow AI is working…" : "Describe a system to design…"
            }
            className="max-h-40 min-h-18 flex-1 resize-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          <Button
            size="icon"
            onClick={() => send(input)}
            disabled={runActive || !input.trim()}
            aria-label={runActive ? "AI is generating" : "Send message"}
            className="bg-success text-background hover:bg-success/90 disabled:opacity-50"
          >
            {runActive ? (
              <Loader2 className="animate-spin" />
            ) : (
              <SendHorizontal />
            )}
          </Button>
        </div>
        <p className="mt-1.5 text-[0.7rem] text-copy-faint">
          {runActive
            ? "The composer unlocks when generation finishes"
            : "Enter to send, Shift+Enter for a new line"}
        </p>
      </div>
    </div>
  )
}
