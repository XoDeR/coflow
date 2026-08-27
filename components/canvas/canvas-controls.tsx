"use client"

import type { ReactNode } from "react"
import { Maximize, Minus, Plus, Redo2, Undo2 } from "lucide-react"
import type { Edge, Node, ReactFlowInstance } from "@xyflow/react"

const ZOOM_ANIMATION_DURATION = 200

interface CanvasControlsProps<NodeType extends Node, EdgeType extends Edge> {
  reactFlow: Pick<ReactFlowInstance<NodeType, EdgeType>, "zoomIn" | "zoomOut" | "fitView">
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

/**
 * Floating pill control bar at the bottom-left of the canvas. Groups zoom
 * controls and history controls, separated by a thin divider.
 */
export function CanvasControls<NodeType extends Node, EdgeType extends Edge>({
  reactFlow,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: CanvasControlsProps<NodeType, EdgeType>) {
  return (
    <div className="absolute bottom-6 left-6 z-20 flex items-center gap-1 rounded-full border border-surface-border bg-surface/90 p-1.5 shadow-lg backdrop-blur">
      <ControlButton
        label="Zoom out"
        onClick={() => reactFlow.zoomOut({ duration: ZOOM_ANIMATION_DURATION })}
      >
        <Minus className="h-5 w-5" />
      </ControlButton>
      <ControlButton
        label="Fit view"
        onClick={() => reactFlow.fitView({ duration: ZOOM_ANIMATION_DURATION })}
      >
        <Maximize className="h-5 w-5" />
      </ControlButton>
      <ControlButton
        label="Zoom in"
        onClick={() => reactFlow.zoomIn({ duration: ZOOM_ANIMATION_DURATION })}
      >
        <Plus className="h-5 w-5" />
      </ControlButton>

      <div className="mx-1 h-5 w-px bg-surface-border" />

      <ControlButton label="Undo" onClick={onUndo} disabled={!canUndo}>
        <Undo2 className="h-5 w-5" />
      </ControlButton>
      <ControlButton label="Redo" onClick={onRedo} disabled={!canRedo}>
        <Redo2 className="h-5 w-5" />
      </ControlButton>
    </div>
  )
}

interface ControlButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}

function ControlButton({ label, onClick, disabled = false, children }: ControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full text-copy-secondary transition-colors hover:bg-subtle hover:text-copy-primary disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  )
}
