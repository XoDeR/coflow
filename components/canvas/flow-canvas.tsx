"use client"

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { CanvasNodeRenderer } from "@/components/canvas/canvas-node"
import { NodeShapeVisual } from "@/components/canvas/node-shape-visual"
import { ShapePanel } from "@/components/canvas/shape-panel"
import {
  NODE_COLORS,
  SHAPE_DRAG_MIME_TYPE,
  type CanvasEdge,
  type CanvasNode,
  type ShapeDragPayload,
} from "@/types/canvas"

const nodeTypes: NodeTypes = {
  canvasNode: CanvasNodeRenderer,
}

export function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner />
    </ReactFlowProvider>
  )
}

function FlowCanvasInner() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    })
  const { screenToFlowPosition } = useReactFlow<CanvasNode, CanvasEdge>()
  const shapeCounterRef = useRef(0)

  const [dragPreviewShape, setDragPreviewShape] = useState<ShapeDragPayload | null>(null)
  const [dragPreviewPosition, setDragPreviewPosition] = useState({ x: 0, y: 0 })

  const handleShapeDragStart = useCallback((payload: ShapeDragPayload) => {
    setDragPreviewShape(payload)
  }, [])

  const handleShapeDragEnd = useCallback(() => {
    setDragPreviewShape(null)
  }, [])

  useEffect(() => {
    if (!dragPreviewShape) return

    const handleWindowDragOver = (event: globalThis.DragEvent) => {
      setDragPreviewPosition({ x: event.clientX, y: event.clientY })
    }

    window.addEventListener("dragover", handleWindowDragOver)
    return () => window.removeEventListener("dragover", handleWindowDragOver)
  }, [dragPreviewShape])

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }, [])

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()

      const raw = event.dataTransfer.getData(SHAPE_DRAG_MIME_TYPE)
      if (!raw) return

      let payload: ShapeDragPayload
      try {
        payload = JSON.parse(raw)
      } catch {
        return
      }

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      shapeCounterRef.current += 1
      const id = `${payload.shape}-${Date.now()}-${shapeCounterRef.current}`

      const newNode: CanvasNode = {
        id,
        type: "canvasNode",
        position,
        width: payload.width,
        height: payload.height,
        data: {
          label: "",
          color: "neutral",
          shape: payload.shape,
        },
      }

      onNodesChange([{ type: "add", item: newNode }])
    },
    [onNodesChange, screenToFlowPosition]
  )

  return (
    <div className="relative h-full w-full" onDragOver={handleDragOver} onDrop={handleDrop}>
      <ReactFlow<CanvasNode, CanvasEdge>
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} color="var(--border-default)" />
        <MiniMap bgColor="var(--bg-surface)" className="border! border-surface-border!" />
      </ReactFlow>
      <ShapePanel onShapeDragStart={handleShapeDragStart} onShapeDragEnd={handleShapeDragEnd} />
      {dragPreviewShape && (
        <div
          className="pointer-events-none fixed z-50 opacity-70"
          style={{
            left: dragPreviewPosition.x - dragPreviewShape.width / 2,
            top: dragPreviewPosition.y - dragPreviewShape.height / 2,
            width: dragPreviewShape.width,
            height: dragPreviewShape.height,
          }}
        >
          <NodeShapeVisual
            shape={dragPreviewShape.shape}
            width={dragPreviewShape.width}
            height={dragPreviewShape.height}
            fill={NODE_COLORS.neutral.fill}
            stroke="var(--accent-primary)"
          />
        </div>
      )}
    </div>
  )
}
