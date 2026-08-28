import type { NodeColorName, NodeShape } from "@/types/canvas"

/**
 * Spacing the design agent lays generated nodes out on. The model returns
 * integer `(column, row)` grid cells; these steps convert them to canvas
 * coordinates so generated diagrams keep consistent gaps no matter what the
 * model picks.
 */
export const DESIGN_GRID_COLUMN_STEP = 320
export const DESIGN_GRID_ROW_STEP = 200

/** The canvas mutations the design agent is allowed to perform. */
export type DesignAction =
  | {
      type: "addNode"
      id: string
      label: string
      shape: NodeShape
      color: NodeColorName
      column: number
      row: number
    }
  | { type: "moveNode"; id: string; column: number; row: number }
  | { type: "resizeNode"; id: string; width: number; height: number }
  | {
      type: "updateNodeData"
      id: string
      label?: string
      shape?: NodeShape
      color?: NodeColorName
    }
  | { type: "deleteNode"; id: string }
  | { type: "addEdge"; id: string; source: string; target: string; label?: string }
  | { type: "deleteEdge"; id: string }

export const DESIGN_ACTION_TYPES = [
  "addNode",
  "moveNode",
  "resizeNode",
  "updateNodeData",
  "deleteNode",
  "addEdge",
  "deleteEdge",
] as const

/** The design agent's interpretation of a prompt: a summary plus the actions to apply. */
export interface DesignPlan {
  /** Short, first-person summary of the change, surfaced in the status feed. */
  summary: string
  actions: DesignAction[]
}

export type AiActivityStatus =
  | "starting"
  | "thinking"
  | "updating"
  | "complete"
  | "error"

/**
 * Room-scoped status feed for the AI design agent. The Trigger.dev task writes
 * it into Liveblocks Storage (outside the React Flow `flow` key, so canvas
 * autosave never touches it) and every participant reads the same value.
 *
 * Declared as a `type` (not an `interface`) so it passes Liveblocks' Storage
 * LSON validation, which rejects interfaces.
 */
export type AiActivity = {
  runId: string
  status: AiActivityStatus
  message: string
  updatedAt: number
}
