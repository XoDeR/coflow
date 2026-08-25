"use client"

import type { DragEvent } from "react"
import {
  Circle,
  Diamond,
  Hexagon,
  Pill as PillIcon,
  RectangleHorizontal,
  Cylinder,
  type LucideIcon,
} from "lucide-react"

import {
  NODE_SHAPES,
  SHAPE_DEFAULT_SIZES,
  SHAPE_DRAG_MIME_TYPE,
  type NodeShape,
  type ShapeDragPayload,
} from "@/types/canvas"

const SHAPE_ICONS: Record<NodeShape, LucideIcon> = {
  rectangle: RectangleHorizontal,
  diamond: Diamond,
  circle: Circle,
  pill: PillIcon,
  cylinder: Cylinder,
  hexagon: Hexagon,
}

// 1x1 transparent gif — hides the browser's default drag snapshot so only the ghost preview shows.
const EMPTY_DRAG_IMAGE_SRC =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="

interface ShapePanelProps {
  onShapeDragStart: (payload: ShapeDragPayload) => void
  onShapeDragEnd: () => void
}

export function ShapePanel({ onShapeDragStart, onShapeDragEnd }: ShapePanelProps) {
  const handleDragStart = (event: DragEvent<HTMLButtonElement>, shape: NodeShape) => {
    const size = SHAPE_DEFAULT_SIZES[shape]
    const payload: ShapeDragPayload = { shape, width: size.width, height: size.height }
    event.dataTransfer.setData(SHAPE_DRAG_MIME_TYPE, JSON.stringify(payload))
    event.dataTransfer.effectAllowed = "copy"

    const emptyImage = new Image()
    emptyImage.src = EMPTY_DRAG_IMAGE_SRC
    event.dataTransfer.setDragImage(emptyImage, 0, 0)

    onShapeDragStart(payload)
  }

  return (
    <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-surface-border bg-surface/90 p-1.5 shadow-lg backdrop-blur">
      {NODE_SHAPES.map((shape) => {
        const Icon = SHAPE_ICONS[shape]
        return (
          <button
            key={shape}
            type="button"
            draggable
            onDragStart={(event) => handleDragStart(event, shape)}
            onDragEnd={onShapeDragEnd}
            title={shape}
            aria-label={`Drag to add a ${shape} node`}
            className="flex h-9 w-9 cursor-grab items-center justify-center rounded-xl text-copy-secondary transition-colors hover:bg-subtle hover:text-copy-primary active:cursor-grabbing"
          >
            <Icon className="h-5 w-5" />
          </button>
        )
      })}
    </div>
  )
}
