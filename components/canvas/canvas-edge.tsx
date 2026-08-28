"use client"

import {
  useCallback,
  useEffect,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react"
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react"

import { useEdgeInteraction } from "@/components/canvas/edge-interaction-context"
import {
  EDGE_BORDER_RADIUS,
  EDGE_INTERACTION_WIDTH,
  EDGE_MARKER_END,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas"

/**
 * Re-exported from `types/canvas` so existing importers (`@/components/canvas/canvas-edge`)
 * keep working. The value now lives there so background tasks can build edges
 * without pulling in `@xyflow/react`.
 */
export { EDGE_MARKER_END }

export function CanvasEdgeRenderer({
  id,
  data,
  selected,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
}: EdgeProps<CanvasEdge>) {
  const { updateEdgeData } = useReactFlow<CanvasNode, CanvasEdge>()
  const { hoveredEdgeId, editingEdgeId, setEditingEdgeId } = useEdgeInteraction()
  const inputRef = useRef<HTMLInputElement>(null)

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: EDGE_BORDER_RADIUS,
  })

  const isEditing = editingEdgeId === id
  const active = hoveredEdgeId === id || Boolean(selected) || isEditing
  const label = data?.label ?? ""

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const startEditing = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation()
      setEditingEdgeId(id)
    },
    [id, setEditingEdgeId]
  )

  const stopEditing = useCallback(() => setEditingEdgeId(null), [setEditingEdgeId])

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      updateEdgeData(id, { label: event.target.value })
    },
    [id, updateEdgeData]
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape" || event.key === "Enter") {
        event.preventDefault()
        stopEditing()
      }
    },
    [stopEditing]
  )

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={EDGE_INTERACTION_WIDTH}
        style={{
          stroke: "var(--text-primary)",
          strokeWidth: 1.5,
          strokeOpacity: active ? 1 : 0.4,
          transition: "stroke-opacity 120ms ease",
        }}
      />
      {(isEditing || label) && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan absolute"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
            onDoubleClick={startEditing}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                value={label}
                size={Math.max(label.length, 4)}
                placeholder="Label"
                onChange={handleChange}
                onBlur={stopEditing}
                onKeyDown={handleKeyDown}
                className="rounded-xl border border-surface-border bg-elevated px-2 py-0.5 text-center text-xs text-copy-primary outline-none placeholder:text-copy-muted"
              />
            ) : (
              <span className="rounded-xl border border-surface-border bg-elevated px-2 py-0.5 text-xs text-copy-secondary">
                {label}
              </span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
