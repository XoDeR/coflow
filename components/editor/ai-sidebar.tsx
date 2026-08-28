"use client"

import { Bot, Download, FileText, Sparkles, X } from "lucide-react"

import { AiArchitectTab } from "@/components/editor/ai-architect-tab"
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const TAB_TRIGGER_CLASS =
  "flex-1 text-copy-muted hover:text-copy-secondary data-active:bg-ai/10 data-active:text-ai-text data-active:shadow-none dark:text-copy-muted dark:hover:text-copy-secondary dark:data-active:border-transparent dark:data-active:bg-ai/10 dark:data-active:text-ai-text"

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  return (
    <aside
      aria-hidden={!isOpen}
      className={cn(
        "fixed top-14 right-0 bottom-0 z-40 flex w-80 flex-col border-l border-surface-border bg-surface/95 shadow-2xl backdrop-blur-sm transition-transform duration-200 ease-out",
        isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
      )}
    >
      <div className="flex items-start justify-between border-b border-surface-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-subtle">
            <Bot className="h-4 w-4 text-ai-text" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-copy-primary">
              AI Workspace
            </h2>
            <p className="text-xs text-copy-muted">Collaborate with Coflow AI</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close AI sidebar"
        >
          <X className="text-copy-secondary" />
        </Button>
      </div>

      <Tabs
        defaultValue="architect"
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="px-4 pt-3">
          <TabsList className="w-full bg-surface">
            <TabsTrigger value="architect" className={TAB_TRIGGER_CLASS}>
              AI Architect
            </TabsTrigger>
            <TabsTrigger value="specs" className={TAB_TRIGGER_CLASS}>
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="architect"
          className="flex flex-1 flex-col overflow-hidden"
        >
          <AiArchitectTab />
        </TabsContent>

        <TabsContent
          value="specs"
          className="flex-1 overflow-y-auto p-4"
        >
          <Button className="w-full bg-ai text-white hover:bg-ai/90">
            <Sparkles />
            Generate Spec
          </Button>

          <div className="mt-4 rounded-2xl border border-surface-border bg-elevated p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-subtle">
                <FileText className="h-4 w-4 text-ai-text" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-copy-primary">
                  E-commerce Backend Spec
                </h3>
                <p className="mt-1 line-clamp-3 text-xs text-copy-muted">
                  A technical specification covering service boundaries, data
                  models, queue topology, and API contracts for a scalable
                  e-commerce backend.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="mt-3"
                >
                  <Download />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  )
}
