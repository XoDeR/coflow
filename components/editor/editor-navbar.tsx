"use client"

import { UserButton } from "@clerk/nextjs"
import {
  LayoutTemplate,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Share2,
} from "lucide-react"

import { CanvasSaveButton } from "@/components/canvas/canvas-save-button"
import { Button } from "@/components/ui/button"
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave"

interface EditorNavbarProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  projectName?: string
  isAiSidebarOpen?: boolean
  onToggleAiSidebar?: () => void
  onShare?: () => void
  onOpenTemplates?: () => void
  /** Autosave status for the active canvas; omitted outside a workspace. */
  saveStatus?: CanvasSaveStatus
  /** Triggers a manual canvas save; omitted outside a workspace. */
  onSave?: () => void
  /**
   * When false, the navbar omits its Clerk `UserButton` — the editor canvas view
   * renders the current user inside its own top-right presence group instead.
   */
  showUserButton?: boolean
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  projectName,
  isAiSidebarOpen,
  onToggleAiSidebar,
  onShare,
  onOpenTemplates,
  saveStatus,
  onSave,
  showUserButton = true,
}: EditorNavbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center border-b border-surface-border bg-surface px-3">
      <div className="flex flex-1 items-center justify-start">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="text-copy-secondary" />
          ) : (
            <PanelLeftOpen className="text-copy-secondary" />
          )}
        </Button>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        {projectName ? (
          <h1 className="truncate text-sm font-medium text-copy-primary">
            {projectName}
          </h1>
        ) : null}
      </div>
      <div className="flex flex-1 items-center justify-end gap-1">
        {saveStatus && onSave ? (
          <CanvasSaveButton status={saveStatus} onSave={onSave} />
        ) : null}
        {onOpenTemplates ? (
          <Button variant="ghost" size="sm" onClick={onOpenTemplates}>
            <LayoutTemplate />
            Templates
          </Button>
        ) : null}
        {onToggleAiSidebar ? (
          <>
            <Button variant="ghost" size="sm" onClick={onShare}>
              <Share2 />
              Share
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleAiSidebar}
              aria-label={isAiSidebarOpen ? "Close AI sidebar" : "Open AI sidebar"}
            >
              {isAiSidebarOpen ? (
                <PanelRightClose className="text-copy-secondary" />
              ) : (
                <PanelRightOpen className="text-copy-secondary" />
              )}
            </Button>
          </>
        ) : null}
        {showUserButton ? <UserButton /> : null}
      </div>
    </header>
  )
}
