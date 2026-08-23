"use client"

import { UserButton } from "@clerk/nextjs"
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Share2,
} from "lucide-react"

import { Button } from "@/components/ui/button"

interface EditorNavbarProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  projectName?: string
  isAiSidebarOpen?: boolean
  onToggleAiSidebar?: () => void
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  projectName,
  isAiSidebarOpen,
  onToggleAiSidebar,
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
        {onToggleAiSidebar ? (
          <>
            <Button variant="ghost" size="sm">
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
        <UserButton />
      </div>
    </header>
  )
}
