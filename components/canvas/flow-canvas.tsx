"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import { useCanRedo, useCanUndo, useRedo, useUndo } from "@liveblocks/react/suspense"
import {
  addEdge,
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type DefaultEdgeOptions,
  type EdgeMouseHandler,
  type EdgeTypes,
  type NodeTypes,
  type OnConnect,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { CanvasControls } from "@/components/canvas/canvas-controls"
import { CanvasEdgeRenderer, EDGE_MARKER_END } from "@/components/canvas/canvas-edge"
import { EdgeInteractionContext } from "@/components/canvas/edge-interaction-context"
import { CanvasNodeRenderer } from "@/components/canvas/canvas-node"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { NodeShapeVisual } from "@/components/canvas/node-shape-visual"
import { ShapePanel } from "@/components/canvas/shape-panel"
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal"
import type { CanvasTemplate } from "@/components/editor/starter-templates"
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

const edgeTypes: EdgeTypes = {
  canvasEdge: CanvasEdgeRenderer,
}

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "canvasEdge",
  markerEnd: EDGE_MARKER_END,
}

interface FlowCanvasProps {
  templatesModalOpen: boolean
  onTemplatesModalOpenChange: (open: boolean) => void
}

export function FlowCanvas({ templatesModalOpen, onTemplatesModalOpenChange }: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner
        templatesModalOpen={templatesModalOpen}
        onTemplatesModalOpenChange={onTemplatesModalOpenChange}
      />
    </ReactFlowProvider>
  )
}

function FlowCanvasInner({ templatesModalOpen, onTemplatesModalOpenChange }: FlowCanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    })
  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>()
  const { screenToFlowPosition } = reactFlow
  const shapeCounterRef = useRef(0)

  const undo = useUndo()
  const redo = useRedo()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()

  useKeyboardShortcuts({ reactFlow, onUndo: undo, onRedo: redo })

  // Liveblocks' own `onConnect` adds a plain edge with no `type`, so new
  // connections would bypass the custom edge renderer. Build the `canvasEdge`
  // ourselves and route it through `onEdgesChange`, which already syncs to Storage.
  const handleConnect = useCallback<OnConnect>(
    (connection) => {
      const [newEdge] = addEdge<CanvasEdge>(connection, [])
      if (!newEdge) return
      onEdgesChange([
        {
          type: "add",
          item: {
            ...newEdge,
            type: "canvasEdge",
            markerEnd: EDGE_MARKER_END,
            data: { label: "" },
          },
        },
      ])
    },
    [onEdgesChange]
  )

  // Edge hover/edit state lives here (not inside the edge component) so single-click
  // selection keeps working — React Flow's own edge handlers drive it.
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null)
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null)

  const handleEdgeMouseEnter = useCallback<EdgeMouseHandler<CanvasEdge>>(
    (_, edge) => setHoveredEdgeId(edge.id),
    []
  )
  const handleEdgeMouseLeave = useCallback(() => setHoveredEdgeId(null), [])
  const handleEdgeDoubleClick = useCallback<EdgeMouseHandler<CanvasEdge>>(
    (_, edge) => setEditingEdgeId(edge.id),
    []
  )

  const edgeInteraction = useMemo(
    () => ({ hoveredEdgeId, editingEdgeId, setEditingEdgeId }),
    [hoveredEdgeId, editingEdgeId]
  )

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

  // Replace the whole canvas with a starter template: clear existing nodes/edges
  // first, then add the template's, then fit the view. All routed through the
  // same `onNodesChange`/`onEdgesChange` handlers that sync to Liveblocks Storage.
  const handleImportTemplate = useCallback(
    (template: CanvasTemplate) => {
      if (edges.length > 0) {
        onEdgesChange(edges.map((edge) => ({ type: "remove", id: edge.id })))
      }
      if (nodes.length > 0) {
        onNodesChange(nodes.map((node) => ({ type: "remove", id: node.id })))
      }

      onNodesChange(template.nodes.map((node) => ({ type: "add", item: node })))
      onEdgesChange(
        template.edges.map((edge) => ({
          type: "add",
          item: {
            ...edge,
            type: "canvasEdge",
            markerEnd: EDGE_MARKER_END,
            data: { label: edge.data?.label ?? "" },
          },
        }))
      )

      window.setTimeout(() => reactFlow.fitView({ duration: 300 }), 50)
    },
    [nodes, edges, onNodesChange, onEdgesChange, reactFlow]
  )

  return (
    <EdgeInteractionContext.Provider value={edgeInteraction}>
      <div className="relative h-full w-full" onDragOver={handleDragOver} onDrop={handleDrop}>
        <ReactFlow<CanvasNode, CanvasEdge>
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onDelete={onDelete}
          onEdgeMouseEnter={handleEdgeMouseEnter}
          onEdgeMouseLeave={handleEdgeMouseLeave}
          onEdgeDoubleClick={handleEdgeDoubleClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionMode={ConnectionMode.Loose}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} color="var(--border-default)" />
          <MiniMap bgColor="var(--bg-surface)" className="border! border-surface-border!" />
        </ReactFlow>
        <CanvasControls
          reactFlow={reactFlow}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
        <ShapePanel onShapeDragStart={handleShapeDragStart} onShapeDragEnd={handleShapeDragEnd} />
        <StarterTemplatesModal
          open={templatesModalOpen}
          onOpenChange={onTemplatesModalOpenChange}
          onImport={handleImportTemplate}
        />
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
    </EdgeInteractionContext.Provider>
  )
}
