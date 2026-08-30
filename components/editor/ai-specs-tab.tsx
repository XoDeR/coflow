"use client"

import { useState } from "react"
import { AlertTriangle, Download, FileText, Loader2, Sparkles } from "lucide-react"

import { SpecPreviewDialog } from "@/components/editor/spec-preview-dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { downloadUrl } from "@/lib/download"
import { useProjectSpecs } from "@/hooks/use-project-specs"
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
  const { specs, isLoading, error } = useProjectSpecs(roomId)
  const [selected, setSelected] = useState<ProjectSpecSummary | null>(null)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-surface-border p-4">
        {/* Triggering generation is a separate unit — this stays inert for now. */}
        <Button disabled className="w-full bg-ai text-white hover:bg-ai/90">
          <Sparkles />
          Generate Spec
        </Button>
      </div>

      <ScrollArea className="flex-1">
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
                No specs yet. Generated specs for this project will appear here.
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
      </ScrollArea>

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
