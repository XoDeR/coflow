"use client"

import { useRef, useState, type KeyboardEvent } from "react"

import { Bot, Loader2, SendHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
]

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

interface AiArchitectTabProps {
  /** An AI run is in progress in this room — lock the composer. */
  isGenerating?: boolean
}

export function AiArchitectTab({ isGenerating = false }: AiArchitectTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  function sendMessage(content: string) {
    if (isGenerating) return
    const trimmed = content.trim()
    if (!trimmed) return
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${prev.length}`, role: "user", content: trimmed },
    ])
    setInput("")
    requestAnimationFrame(() => {
      const node = scrollRef.current
      if (node) node.scrollTop = node.scrollHeight
    })
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      sendMessage(input)
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
              Describe a system and Coflow AI will help you architect it on the
              canvas.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
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
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                  message.role === "user"
                    ? "self-end border-2 border-brand/50 bg-accent-dim text-copy-primary"
                    : "self-start border border-surface-border bg-elevated text-ai-text"
                )}
              >
                {message.content}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-surface-border p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            placeholder={
              isGenerating
                ? "Coflow AI is working…"
                : "Ask Coflow AI to design something…"
            }
            className="max-h-40 min-h-18 flex-1 resize-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          <Button
            size="icon"
            onClick={() => sendMessage(input)}
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
