"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Download, Loader2 } from "lucide-react"

import { MarkdownContent } from "@/components/editor/markdown-content"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { downloadUrl } from "@/lib/download"
import type { ProjectSpecSummary } from "@/types/spec"

interface SpecPreviewDialogProps {
  projectId: string
  /** The spec to preview, or `null` when the modal is closed. */
  spec: ProjectSpecSummary | null
  onOpenChange: (open: boolean) => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function SpecPreviewDialog({
  projectId,
  spec,
  onOpenChange,
}: SpecPreviewDialogProps) {
  const [content, setContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const specId = spec?.id ?? null
  const downloadHref = spec
    ? `/api/projects/${projectId}/specs/${spec.id}/download`
    : null

  useEffect(() => {
    if (!specId) return

    let cancelled = false

    async function loadContent() {
      setContent(null)
      setError(null)
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/projects/${projectId}/specs/${specId}/download`
        )
        if (!response.ok) throw new Error("Couldn't load this spec.")
        const text = await response.text()
        if (!cancelled) setContent(text)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Couldn't load this spec.")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadContent()

    return () => {
      cancelled = true
    }
  }, [projectId, specId])

  return (
    <Dialog open={spec !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col gap-4 rounded-3xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{spec?.filename ?? "Spec"}</DialogTitle>
          <DialogDescription>
            {spec ? `Generated ${formatDate(spec.createdAt)}` : null}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="-mx-1 max-h-[52vh] flex-1 px-1">
          {isLoading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-copy-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading spec…
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 py-8 text-sm text-error">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : content !== null ? (
            <MarkdownContent content={content} />
          ) : null}
        </ScrollArea>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={!downloadHref}
            onClick={() => {
              if (downloadHref && spec) downloadUrl(downloadHref, spec.filename)
            }}
          >
            <Download />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
