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
import { cn } from "@/lib/utils"

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
]

interface AiArchitectTabProps {
  /** An AI run is in progress in this room — lock the composer. */
  isGenerating?: boolean
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function AiArchitectTab({ isGenerating = false }: AiArchitectTabProps) {
  const { messages, sendMessage } = useAiChat()
  const senderName = useSelf((me) => me.info.name) ?? "Anonymous"

  const [input, setInput] = useState("")
  const [sendFailed, setSendFailed] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = scrollRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages.length])

  const send = useCallback(
    (content: string) => {
      if (isGenerating) return
      const trimmed = content.trim()
      if (!trimmed) return

      try {
        sendMessage({
          id: crypto.randomUUID(),
          sender: senderName,
          role: "user",
          content: trimmed,
          timestamp: Date.now(),
        })
        setInput("")
        setSendFailed(false)
      } catch {
        setSendFailed(true)
      }
    },
    [isGenerating, senderName, sendMessage]
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
              Start the conversation — messages are shared with everyone in this
              room.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => send(prompt)}
                  disabled={isGenerating}
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
                        ? "border-2 border-brand/50 bg-accent-dim text-copy-primary"
                        : "border border-surface-border bg-elevated text-ai-text"
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
            disabled={isGenerating}
            placeholder={
              isGenerating ? "Coflow AI is working…" : "Message the room…"
            }
            className="max-h-40 min-h-18 flex-1 resize-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          <Button
            size="icon"
            onClick={() => send(input)}
            disabled={isGenerating || !input.trim()}
            aria-label={isGenerating ? "AI is generating" : "Send message"}
            className="bg-ai text-white hover:bg-ai/90"
          >
            {isGenerating ? (
              <Loader2 className="animate-spin" />
            ) : (
              <SendHorizontal />
            )}
          </Button>
        </div>
        <p className="mt-1.5 text-[0.7rem] text-copy-faint">
          {isGenerating
            ? "The composer unlocks when generation finishes"
            : "Enter to send, Shift+Enter for a new line"}
        </p>
      </div>
    </div>
  )
}
