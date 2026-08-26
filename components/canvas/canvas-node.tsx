"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react"
import { Handle, NodeResizer, Position, useReactFlow, type NodeProps } from "@xyflow/react"

import { NodeShapeVisual } from "@/components/canvas/node-shape-visual"
import { NODE_COLORS, SHAPE_DEFAULT_SIZES, SHAPE_MIN_SIZES } from "@/types/canvas"
import type { CanvasNode } from "@/types/canvas"

const HANDLE_POSITIONS = [Position.Top, Position.Right, Position.Bottom, Position.Left]

export function CanvasNodeRenderer({ id, data, selected, width, height }: NodeProps<CanvasNode>) {
  const { updateNodeData } = useReactFlow<CanvasNode>()
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { fill, text } = NODE_COLORS[data.color]
  const defaultSize = SHAPE_DEFAULT_SIZES[data.shape]
  const minSize = SHAPE_MIN_SIZES[data.shape]
  const borderColor = selected ? "var(--accent-primary)" : "var(--border-default)"

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [])

  useEffect(() => {
    if (isEditing) {
      const textarea = textareaRef.current
      textarea?.focus()
      textarea?.select()
      adjustTextareaHeight()
    }
  }, [isEditing, adjustTextareaHeight])

  const handleLabelDoubleClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
    setIsEditing(true)
  }, [])

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(id, { label: event.target.value })
      adjustTextareaHeight()
    },
    [id, updateNodeData, adjustTextareaHeight]
  )

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault()
      setIsEditing(false)
    }
  }, [])

  return (
    <div className="group relative flex h-full w-full items-center justify-center">
      <NodeResizer
        nodeId={id}
        isVisible={selected}
        minWidth={minSize.width}
        minHeight={minSize.height}
        color="var(--accent-primary)"
        handleClassName="h-2! w-2! rounded-full! border! border-brand! bg-surface!"
        lineStyle={{ borderColor: "transparent" }}
      />
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
      <div
        className="relative flex h-full w-full cursor-text items-center justify-center px-3 py-2"
        onDoubleClick={handleLabelDoubleClick}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            rows={1}
            className="nodrag nopan max-h-full w-full resize-none overflow-y-auto border-none bg-transparent text-center text-sm outline-none placeholder:text-copy-muted"
            style={{ color: text }}
            value={data.label}
            placeholder="Label"
            onChange={handleChange}
            onBlur={() => setIsEditing(false)}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <span
            className="pointer-events-none text-center text-sm wrap-break-word"
            style={{ color: data.label ? text : "var(--text-muted)" }}
          >
            {data.label || "Label"}
          </span>
        )}
      </div>
    </div>
  )
}
