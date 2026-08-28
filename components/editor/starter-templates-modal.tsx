"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Start from a template</DialogTitle>
          <DialogDescription>
            Importing a template replaces everything currently on the canvas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[60vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
          {CANVAS_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="flex flex-col gap-3 rounded-xl border border-surface-border bg-surface p-3"
            >
              <div className="h-32 overflow-hidden rounded-lg border border-surface-border bg-base">
                <TemplatePreview template={template} />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-medium text-copy-primary">
                  {template.name}
                </h3>
                <p className="text-xs text-copy-muted">{template.description}</p>
              </div>
              <Button
                type="button"
                size="sm"
                className="mt-auto self-start"
                onClick={() => handleImport(template)}
              >
                Import
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
