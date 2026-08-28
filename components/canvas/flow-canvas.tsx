"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
} from "react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import {
  useCanRedo,
  useCanUndo,
  useRedo,
  useUndo,
  useUpdateMyPresence,
} from "@liveblocks/react/suspense"
import {
  addEdge,
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdges,
  useNodes,
  useReactFlow,
  type DefaultEdgeOptions,
  type EdgeMouseHandler,
  type EdgeTypes,
  type NodeTypes,
  type OnConnect,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { useCanvasAutosave } from "@/hooks/use-canvas-autosave"
import { useCanvasLoader } from "@/hooks/use-canvas-loader"
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave"
import { CanvasControls } from "@/components/canvas/canvas-controls"
import { CanvasCursors } from "@/components/canvas/canvas-cursors"
import { CanvasEdgeRenderer, EDGE_MARKER_END } from "@/components/canvas/canvas-edge"
import { EdgeInteractionContext } from "@/components/canvas/edge-interaction-context"
import { CanvasNodeRenderer } from "@/components/canvas/canvas-node"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { NodeShapeVisual } from "@/components/canvas/node-shape-visual"
import { PresenceAvatars } from "@/components/canvas/presence-avatars"
import { ShapePanel } from "@/components/canvas/shape-panel"
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal"
import type { CanvasTemplate } from "@/components/editor/starter-templates"
import {
  NODE_COLORS,
  SHAPE_DRAG_MIME_TYPE,
  type CanvasEdge,
  type CanvasNode,
  type CanvasSnapshot,
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
  projectId: string
  templatesModalOpen: boolean
  onTemplatesModalOpenChange: (open: boolean) => void
  onSaveStatusChange: (status: CanvasSaveStatus) => void
  onRegisterSave: (save: () => void) => void
}

export function FlowCanvas({
  projectId,
  templatesModalOpen,
  onTemplatesModalOpenChange,
  onSaveStatusChange,
  onRegisterSave,
}: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner
        projectId={projectId}
        templatesModalOpen={templatesModalOpen}
        onTemplatesModalOpenChange={onTemplatesModalOpenChange}
        onSaveStatusChange={onSaveStatusChange}
        onRegisterSave={onRegisterSave}
      />
    </ReactFlowProvider>
  )
}

function FlowCanvasInner({
  projectId,
  templatesModalOpen,
  onTemplatesModalOpenChange,
  onSaveStatusChange,
  onRegisterSave,
}: FlowCanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    })
  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>()
  const { screenToFlowPosition } = reactFlow
  const shapeCounterRef = useRef(0)

  const updateMyPresence = useUpdateMyPresence()

  // Broadcast the cursor in flow coordinates so other clients can re-project it
  // through their own viewport transform.
  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      updateMyPresence({ cursor: { x: position.x, y: position.y } })
    },
    [screenToFlowPosition, updateMyPresence]
  )

  const handleMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null })
  }, [updateMyPresence])

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

  // Delete selected nodes/edges on Backspace or Delete. React Flow's built-in
  // key deletion is disabled (`deleteKeyCode={null}`); removal is routed through
  // `onDelete` — the Liveblocks collaborative mutation from `useLiveblocksFlow`
  // that actually deletes from shared Storage (its `onNodesChange` /
  // `onEdgesChange` ignore `"remove"` changes) — so deletes reach every client.
  // The listener is on `window` (not the wrapper element) because selecting a
  // node/edge doesn't move DOM focus into the canvas, so a wrapper-level
  // `onKeyDown` never fires — same reason the zoom / history shortcuts use
  // `window`.
  const flowNodes = useNodes<CanvasNode>()
  const flowEdges = useEdges<CanvasEdge>()
  const selectionRef = useRef({ nodes: flowNodes, edges: flowEdges })
  useEffect(() => {
    selectionRef.current = { nodes: flowNodes, edges: flowEdges }
  }, [flowNodes, flowEdges])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Backspace" && event.key !== "Delete") return

      const target = event.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return
      }

      const selectedNodes = selectionRef.current.nodes.filter((node) => node.selected)
      const selectedEdges = selectionRef.current.edges.filter((edge) => edge.selected)
      if (selectedNodes.length === 0 && selectedEdges.length === 0) return

      event.preventDefault()
      onDelete({ nodes: selectedNodes, edges: selectedEdges })
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onDelete])

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

  // Load a previously saved canvas snapshot into an empty room on mount. Edges
  // are normalized exactly like `handleConnect` / `handleImportTemplate` so the
  // custom renderer picks them up.
  const applySnapshot = useCallback(
    (snapshot: CanvasSnapshot) => {
      onNodesChange(snapshot.nodes.map((node) => ({ type: "add", item: node })))
      onEdgesChange(
        snapshot.edges.map((edge) => ({
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
    [onNodesChange, onEdgesChange, reactFlow]
  )

  const { isLoaded } = useCanvasLoader({
    projectId,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    onLoad: applySnapshot,
  })

  const { saveNow } = useCanvasAutosave({
    projectId,
    nodes,
    edges,
    enabled: isLoaded,
    onStatusChange: onSaveStatusChange,
  })

  useEffect(() => {
    onRegisterSave(saveNow)
  }, [onRegisterSave, saveNow])

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
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onEdgeMouseEnter={handleEdgeMouseEnter}
          onEdgeMouseLeave={handleEdgeMouseLeave}
          onEdgeDoubleClick={handleEdgeDoubleClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionMode={ConnectionMode.Loose}
          deleteKeyCode={null}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} color="var(--border-default)" />
          <MiniMap bgColor="var(--bg-surface)" className="border! border-surface-border!" />
        </ReactFlow>
        <CanvasCursors />
        <PresenceAvatars />
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
