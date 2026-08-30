"use client"

import { useCallback, useState } from "react"
import { AlertTriangle, Download, FileText, Loader2, Sparkles } from "lucide-react"

import { SpecPreviewDialog } from "@/components/editor/spec-preview-dialog"
import { Button } from "@/components/ui/button"
import { useAiChat } from "@/hooks/use-ai-chat"
import { useAiStatus } from "@/hooks/use-ai-status"
import { useCanvasGraph } from "@/hooks/use-canvas-graph"
import { useProjectSpecs } from "@/hooks/use-project-specs"
import { useSpecRun } from "@/hooks/use-spec-run"
import { downloadUrl } from "@/lib/download"
import type { ProjectSpecSummary } from "@/types/spec"

interface AiSpecsTabProps {
  /** Liveblocks room / project id for the active workspace. */
  roomId: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function AiSpecsTab({ roomId }: AiSpecsTabProps) {
  const { specs, isLoading, error, reload } = useProjectSpecs(roomId)
  const { messages } = useAiChat()
  const { nodes, edges } = useCanvasGraph()
  const { isGenerating } = useAiStatus()

  const [selected, setSelected] = useState<ProjectSpecSummary | null>(null)
  const [runError, setRunError] = useState<string | null>(null)

  const { isRunning, statusText, start } = useSpecRun({
    onComplete: (outcome, specId) => {
      if (outcome === "success") {
        reload()
        // Open the new spec straight away — its metadata is fully derivable
        // (the download route names the file `spec-{id}.md`).
        if (specId) {
          setSelected({
            id: specId,
            filename: `spec-${specId}.md`,
            createdAt: new Date().toISOString(),
          })
        }
      } else {
        setRunError("Spec generation didn't finish. Please try again.")
      }
    },
  })

  const runActive = isRunning || isGenerating

  const handleGenerate = useCallback(() => {
    if (runActive) return
    setRunError(null)
    void start(roomId, {
      chatHistory: messages.map((message) => ({
        sender: message.sender,
        role: message.role,
        content: message.content,
      })),
      nodes,
      edges,
    }).then((result) => {
      if (!result.ok) setRunError(result.error ?? "Something went wrong.")
    })
  }, [runActive, start, roomId, messages, nodes, edges])

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-surface-border p-4">
        <Button
          onClick={handleGenerate}
          disabled={runActive}
          className="w-full bg-ai text-white hover:bg-ai/90 disabled:opacity-60"
        >
          {isRunning ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Sparkles />
          )}
          {isRunning ? "Generating…" : "Generate Spec"}
        </Button>
        {runError ? (
          <p className="mt-2 text-[0.7rem] text-error">{runError}</p>
        ) : null}
      </div>

      {runActive ? (
        <div
          aria-live="polite"
          className="flex items-center gap-2 border-b border-surface-border bg-elevated px-4 py-2 text-xs text-ai-text"
        >
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
          <span className="truncate">
            {statusText ?? "Coflow AI is writing the spec…"}
          </span>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-copy-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading specs…
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 py-6 text-sm text-error">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : specs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-subtle">
                <FileText className="h-4 w-4 text-ai-text" />
              </div>
              <p className="max-w-52 text-xs text-copy-muted">
                No specs yet. Generate one from the current canvas and design
                conversation.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {specs.map((spec) => (
                <li
                  key={spec.id}
                  className="flex items-center gap-2 rounded-xl border border-surface-border bg-elevated p-2.5"
                >
                  <button
                    type="button"
                    onClick={() => setSelected(spec)}
                    className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-subtle">
                      <FileText className="h-4 w-4 text-ai-text" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-copy-primary">
                        {spec.filename}
                      </p>
                      <p className="mt-0.5 text-[0.7rem] text-copy-muted">
                        {formatDate(spec.createdAt)}
                      </p>
                    </div>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Download ${spec.filename}`}
                    onClick={() =>
                      downloadUrl(
                        `/api/projects/${roomId}/specs/${spec.id}/download`,
                        spec.filename
                      )
                    }
                  >
                    <Download className="text-copy-secondary" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <SpecPreviewDialog
        projectId={roomId}
        spec={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </div>
  )
}
