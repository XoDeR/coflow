"use client"

import { Component, type ReactNode } from "react"
import { ClientSideSuspense } from "@liveblocks/react/suspense"
import { AlertTriangle } from "lucide-react"

import { FlowCanvas } from "@/components/canvas/flow-canvas"
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave"

interface CanvasRoomProps {
  roomId: string
  templatesModalOpen: boolean
  onTemplatesModalOpenChange: (open: boolean) => void
  onSaveStatusChange: (status: CanvasSaveStatus) => void
  onRegisterSave: (save: () => void) => void
}

/**
 * The collaborative canvas surface. Must be rendered inside an `<EditorRoom>`.
 * Its own error boundary + Suspense wrap only the canvas, so the AI sidebar
 * (a sibling inside the same room) stays mounted if the canvas fails to load.
 */
export function CanvasRoom({
  roomId,
  templatesModalOpen,
  onTemplatesModalOpenChange,
  onSaveStatusChange,
  onRegisterSave,
}: CanvasRoomProps) {
  return (
    <div className="h-full w-full">
      <CanvasErrorBoundary>
        <ClientSideSuspense fallback={<CanvasLoading />}>
          <FlowCanvas
            projectId={roomId}
            templatesModalOpen={templatesModalOpen}
            onTemplatesModalOpenChange={onTemplatesModalOpenChange}
            onSaveStatusChange={onSaveStatusChange}
            onRegisterSave={onRegisterSave}
          />
        </ClientSideSuspense>
      </CanvasErrorBoundary>
    </div>
  )
}

function CanvasLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-base">
      <p className="text-sm text-copy-muted">Loading canvas…</p>
    </div>
  )
}

interface CanvasErrorBoundaryProps {
  children: ReactNode
}

interface CanvasErrorBoundaryState {
  hasError: boolean
}

class CanvasErrorBoundary extends Component<CanvasErrorBoundaryProps, CanvasErrorBoundaryState> {
  state: CanvasErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-base text-center">
          <AlertTriangle className="h-8 w-8 text-copy-muted" />
          <p className="text-sm text-copy-primary">Couldn&apos;t connect to the canvas.</p>
          <p className="text-xs text-copy-muted">Refresh the page to try again.</p>
        </div>
      )
    }

    return this.props.children
  }
}
