"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"

import { NODE_COLORS } from "@/types/canvas"
import type { CanvasNode } from "@/types/canvas"

const HANDLE_POSITIONS = [Position.Top, Position.Right, Position.Bottom, Position.Left]

export function CanvasNodeRenderer({ data, selected }: NodeProps<CanvasNode>) {
  const { fill, text } = NODE_COLORS[data.color]

  return (
    <div
      className="group flex h-full w-full items-center justify-center rounded-xl border px-3 py-2 text-center text-sm"
      style={{
        backgroundColor: fill,
        color: text,
        borderColor: selected ? "var(--accent-primary)" : "var(--border-default)",
      }}
    >
      {HANDLE_POSITIONS.map((position) => (
        <Handle
          key={position}
          type="source"
          position={position}
          className="h-2! w-2! border! border-white! bg-white! opacity-0 transition-opacity group-hover:opacity-100"
        />
      ))}
      <span>{data.label}</span>
    </div>
  )
}
