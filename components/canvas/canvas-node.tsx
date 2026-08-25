"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"

import { NodeShapeVisual } from "@/components/canvas/node-shape-visual"
import { NODE_COLORS, SHAPE_DEFAULT_SIZES } from "@/types/canvas"
import type { CanvasNode } from "@/types/canvas"

const HANDLE_POSITIONS = [Position.Top, Position.Right, Position.Bottom, Position.Left]

export function CanvasNodeRenderer({ data, selected, width, height }: NodeProps<CanvasNode>) {
  const { fill, text } = NODE_COLORS[data.color]
  const defaultSize = SHAPE_DEFAULT_SIZES[data.shape]
  const borderColor = selected ? "var(--accent-primary)" : "var(--border-default)"

  return (
    <div className="group relative flex h-full w-full items-center justify-center">
      <NodeShapeVisual
        shape={data.shape}
        width={width ?? defaultSize.width}
        height={height ?? defaultSize.height}
        fill={fill}
        stroke={borderColor}
      />
      {HANDLE_POSITIONS.map((position) => (
        <Handle
          key={position}
          type="source"
          position={position}
          className="h-2! w-2! border! border-white! bg-white! opacity-0 transition-opacity group-hover:opacity-100"
        />
      ))}
      <span className="relative px-3 py-2 text-center text-sm" style={{ color: text }}>
        {data.label}
      </span>
    </div>
  )
}
