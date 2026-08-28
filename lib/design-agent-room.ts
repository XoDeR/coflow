import type { JsonObject } from "@liveblocks/node"
import {
  mutateFlow,
  type MutableFlow,
  type MutateFlowOptions,
} from "@liveblocks/react-flow/node"

import { getLiveblocksClient } from "@/lib/liveblocks"
import {
  DESIGN_GRID_COLUMN_STEP,
  DESIGN_GRID_ROW_STEP,
  type AiActivity,
  type AiActivityStatus,
  type DesignAction,
} from "@/types/ai-design"
import {
  EDGE_MARKER_END,
  SHAPE_DEFAULT_SIZES,
  SHAPE_MIN_SIZES,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas"

/**
 * The Liveblocks side of the design agent: reading the room's canvas, applying
 * generated actions through the same flow storage the editor uses, and
 * publishing the agent's presence and status feed so every participant sees the
 * work happening in real time.
 */

/** Identity the agent presents as in the room (cursor + avatar). */
export const AI_AGENT = {
  id: "coflow-ai-agent",
  name: "Coflow AI",
  color: "#6457f9",
} as const

const flowOptions = (roomId: string): MutateFlowOptions<CanvasNode, CanvasEdge> => ({
  client: getLiveblocksClient(),
  roomId,
})

export interface RoomGraph {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

/** Snapshot the room's current nodes and edges. */
export async function readRoomGraph(roomId: string): Promise<RoomGraph> {
  const graph: RoomGraph = { nodes: [], edges: [] }

  await mutateFlow<CanvasNode, CanvasEdge>(flowOptions(roomId), (flow) => {
    graph.nodes = [...flow.nodes]
    graph.edges = [...flow.edges]
  })

  return graph
}

export interface ApplyResult {
  applied: number
  skipped: number
}

/**
 * Apply a list of design actions to the room's canvas. Node creations are
 * applied first (stable within that group) so edges in the same plan can
 * reference nodes the plan also creates, regardless of the model's ordering;
 * everything else keeps its original order.
 */
export async function applyDesignActions(
  roomId: string,
  actions: DesignAction[]
): Promise<ApplyResult> {
  let applied = 0
  const ordered = [
    ...actions.filter((action) => action.type === "addNode"),
    ...actions.filter((action) => action.type !== "addNode"),
  ]

  await mutateFlow<CanvasNode, CanvasEdge>(flowOptions(roomId), (flow) => {
    for (const action of ordered) {
      if (applyAction(flow, action)) applied += 1
    }
  })

  return { applied, skipped: actions.length - applied }
}

function applyAction(
  flow: MutableFlow<CanvasNode, CanvasEdge>,
  action: DesignAction
): boolean {
  switch (action.type) {
    case "addNode": {
      const size = SHAPE_DEFAULT_SIZES[action.shape]
      flow.addNode({
        id: action.id,
        type: "canvasNode",
        position: gridToPosition(action.column, action.row),
        width: size.width,
        height: size.height,
        data: { label: action.label, color: action.color, shape: action.shape },
      })
      return true
    }
    case "moveNode": {
      if (!flow.getNode(action.id)) return false
      flow.updateNode(action.id, { position: gridToPosition(action.column, action.row) })
      return true
    }
    case "resizeNode": {
      const node = flow.getNode(action.id)
      if (!node) return false
      const min = SHAPE_MIN_SIZES[node.data.shape]
      flow.updateNode(action.id, {
        width: Math.max(min.width, Math.round(action.width)),
        height: Math.max(min.height, Math.round(action.height)),
      })
      return true
    }
    case "updateNodeData": {
      if (!flow.getNode(action.id)) return false
      const patch: Partial<CanvasNode["data"]> = {}
      if (action.label !== undefined) patch.label = action.label
      if (action.shape !== undefined) patch.shape = action.shape
      if (action.color !== undefined) patch.color = action.color
      flow.updateNodeData(action.id, patch)
      return true
    }
    case "deleteNode": {
      if (!flow.getNode(action.id)) return false
      for (const edge of flow.edges) {
        if (edge.source === action.id || edge.target === action.id) flow.removeEdge(edge.id)
      }
      flow.removeNode(action.id)
      return true
    }
    case "addEdge": {
      const source = flow.getNode(action.source)
      const target = flow.getNode(action.target)
      if (!source || !target) return false
      const [sourceHandle, targetHandle] = pickHandles(source, target)
      flow.addEdge({
        id: action.id,
        source: action.source,
        target: action.target,
        sourceHandle,
        targetHandle,
        type: "canvasEdge",
        markerEnd: EDGE_MARKER_END,
        data: { label: action.label ?? "" },
      })
      return true
    }
    case "deleteEdge": {
      if (!flow.getEdge(action.id)) return false
      flow.removeEdge(action.id)
      return true
    }
    default:
      return false
  }
}

function gridToPosition(column: number, row: number): { x: number; y: number } {
  return { x: column * DESIGN_GRID_COLUMN_STEP, y: row * DESIGN_GRID_ROW_STEP }
}

/**
 * Pick which side of each node an edge attaches to. Handles are keyed by side
 * (`"top"` / `"right"` / `"bottom"` / `"left"`) in `canvas-node.tsx`; an edge
 * with no handle id collapses onto the top handle.
 */
function pickHandles(source: CanvasNode, target: CanvasNode): [string, string] {
  const dx = (target.position?.x ?? 0) - (source.position?.x ?? 0)
  const dy = (target.position?.y ?? 0) - (source.position?.y ?? 0)

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? ["right", "left"] : ["left", "right"]
  }
  return dy >= 0 ? ["bottom", "top"] : ["top", "bottom"]
}

/** Centroid of the nodes an action set adds, for a meaningful agent cursor position. */
export function planFocusPosition(actions: DesignAction[]): { x: number; y: number } | null {
  const added = actions.filter(
    (action): action is Extract<DesignAction, { type: "addNode" }> => action.type === "addNode"
  )
  if (added.length === 0) return null

  const sum = added.reduce(
    (acc, action) => {
      const { x, y } = gridToPosition(action.column, action.row)
      return { x: acc.x + x, y: acc.y + y }
    },
    { x: 0, y: 0 }
  )
  return { x: Math.round(sum.x / added.length), y: Math.round(sum.y / added.length) }
}

interface AiPresence {
  cursor: { x: number; y: number } | null
  thinking: boolean
}

async function writeAiPresence(roomId: string, presence: AiPresence, ttl: number): Promise<void> {
  await getLiveblocksClient().setPresence(roomId, {
    userId: AI_AGENT.id,
    // `setPresence` types `data` as a bare `JsonObject`; `AiPresence` is a
    // subset of the room's `Presence` shape and is JSON-safe by construction.
    data: { ...presence } as JsonObject,
    userInfo: { name: AI_AGENT.name, avatar: "", color: AI_AGENT.color },
    ttl,
  })
}

/** Show the agent in the room with an optional cursor and a thinking flag. */
export function setAiPresence(roomId: string, presence: AiPresence): Promise<void> {
  return writeAiPresence(roomId, presence, 120)
}

/**
 * Retract the agent's presence. There is no delete-presence API, so this writes
 * an idle presence with the minimum TTL and lets it expire.
 */
export function clearAiPresence(roomId: string): Promise<void> {
  return writeAiPresence(roomId, { cursor: null, thinking: false }, 2)
}

/** Publish the agent's current status to the room-wide feed. */
export async function publishAiActivity(
  roomId: string,
  runId: string,
  status: AiActivityStatus,
  message: string
): Promise<void> {
  const activity: AiActivity = { runId, status, message, updatedAt: Date.now() }
  await getLiveblocksClient().mutateStorage(roomId, ({ root }) => {
    root.set("aiActivity", activity)
  })
}
