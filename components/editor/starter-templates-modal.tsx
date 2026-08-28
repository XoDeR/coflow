"use client"

import { Download, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/starter-templates"
import { TemplatePreview } from "@/components/editor/template-preview"

interface StarterTemplatesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (template: CanvasTemplate) => void
}

export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  const handleImport = (template: CanvasTemplate) => {
    onImport(template)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-5 rounded-3xl p-6 sm:max-w-3xl"
      >
        <DialogClose
          render={
            <Button
              variant="outline"
              size="icon-sm"
              className="absolute top-5 right-5 rounded-full"
              aria-label="Close"
            />
          }
        >
          <X />
        </DialogClose>

        <DialogHeader className="gap-1.5 pr-10">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Start from a template
          </DialogTitle>
          <DialogDescription>
            Importing a template replaces everything currently on the canvas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[65vh] gap-4 overflow-y-auto sm:grid-cols-3">
          {CANVAS_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="flex flex-col gap-3 rounded-2xl border border-surface-border/70 p-3 transition-colors hover:border-subtle-border hover:bg-surface/40"
            >
              <div className="h-36 overflow-hidden rounded-xl border border-surface-border bg-base">
                <TemplatePreview template={template} />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <h3 className="text-sm font-semibold text-copy-primary">
                  {template.name}
                </h3>
                <p className="text-xs leading-relaxed text-copy-muted">
                  {template.description}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleImport(template)}
              >
                <Download />
                Import
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
