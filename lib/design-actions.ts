import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText } from "ai"

import {
  DESIGN_ACTION_TYPES,
  DESIGN_GRID_COLUMN_STEP,
  DESIGN_GRID_ROW_STEP,
  type DesignAction,
  type DesignPlan,
} from "@/types/ai-design"
import {
  NODE_COLORS,
  NODE_SHAPES,
  type CanvasEdge,
  type CanvasNode,
  type NodeColorName,
  type NodeShape,
} from "@/types/canvas"

/**
 * Gemini-backed interpretation of a natural-language design prompt into a set of
 * canvas actions. This module only produces the plan — writing it into the
 * Liveblocks room is `lib/design-agent-room.ts`'s job.
 */

const google = createGoogleGenerativeAI({
  // `@ai-sdk/google` defaults to `GOOGLE_GENERATIVE_AI_API_KEY`; this project's
  // key is stored under `GOOGLE_AI_API_KEY`.
  apiKey: process.env.GOOGLE_AI_API_KEY,
})

const MODEL = "gemini-3.5-flash-lite"

const COLOR_NAMES = Object.keys(NODE_COLORS) as NodeColorName[]

/** Flat action shape returned by the model — narrowed to `DesignAction` below. */
interface RawAction {
  type: string
  id?: string
  label?: string
  shape?: string
  color?: string
  column?: number
  row?: number
  width?: number
  height?: number
  source?: string
  target?: string
}

interface RawPlan {
  summary?: string
  actions?: RawAction[]
}

const SYSTEM_PROMPT = `You are Coflow's system-design agent. You turn a natural-language description of a software system into a diagram on a shared canvas by emitting a list of actions.

Respond with a single raw JSON object and nothing else — no prose, no markdown code fences. Shape:
{
  "summary": "I mapped out an event-driven order pipeline.",
  "actions": [
    { "type": "addNode", "id": "api-gateway", "label": "API Gateway", "shape": "rectangle", "color": "neutral", "column": 0, "row": 0 },
    { "type": "addEdge", "id": "api-gateway--order-service", "source": "api-gateway", "target": "order-service", "label": "REST" }
  ]
}

- "summary": one short first-person sentence describing the change.
- "actions": an ordered list of canvas actions. List every addNode before the addEdge actions that reference it.

Action types:
- addNode: { id, label, shape, color, column, row }
- moveNode: { id, column, row }
- resizeNode: { id, width, height }
- updateNodeData: { id, label?, shape?, color? }
- deleteNode: { id }
- addEdge: { id, source, target, label? }
- deleteEdge: { id }

Allowed shapes (use them by meaning):
- rectangle: general component or service
- pill: a running process / worker
- cylinder: database or persistent storage
- hexagon: external system or third-party boundary
- diamond: decision, gateway, or router
- circle: event, trigger, or endpoint

Allowed colors (name only): ${COLOR_NAMES.join(", ")}. Use "neutral" by default and reserve
other colors to group related concerns (e.g. all datastores "blue", all external systems "orange").

Layout rules:
- "column" and "row" are integers. Spacing between them is applied automatically — never output pixel coordinates.
- Increase "column" left-to-right following the request/data flow. Use "row" to stack parallel components in the same stage.
- Never place two nodes on the same (column, row) cell.
- Keep new designs focused: roughly 4-12 nodes.

Editing an existing canvas:
- You are given the current nodes and edges. Reuse their ids when modifying them.
- Only delete something if the prompt clearly asks to remove or replace it.
- Give every new node and edge a fresh stable kebab-case id derived from its label (e.g. "api-gateway", "api-gateway--auth-service").

Edges:
- "source" and "target" must reference node ids that exist or that you create in the same response.
- Keep edge labels short (a protocol or verb) or omit them.`

export interface GenerateDesignPlanInput {
  prompt: string
  graph: { nodes: CanvasNode[]; edges: CanvasEdge[] }
}

export async function generateDesignPlan(
  input: GenerateDesignPlanInput
): Promise<DesignPlan> {
  // `generateText` + tolerant parsing rather than `generateObject`: Gemini's
  // constrained-decoding structured output is unreliable for this nested schema
  // (and `generateObject` is deprecated in this AI SDK version). `normalizePlan`
  // does the real validation.
  const { text } = await generateText({
    model: google(MODEL),
    system: SYSTEM_PROMPT,
    prompt: buildUserPrompt(input),
    temperature: 0.3,
    maxOutputTokens: 8000,
  })

  const parsed = parsePlanJson(text)
  if (!parsed) {
    throw new Error(
      `Gemini did not return usable JSON (first 400 chars: ${text.slice(0, 400)})`
    )
  }

  return normalizePlan(parsed)
}

/** Extract a JSON object from the model's reply, tolerating fences and stray prose. */
function parsePlanJson(text: string): RawPlan | null {
  const trimmed = text.trim()
  const candidates = [trimmed]

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) candidates.push(fenced[1].trim())

  const first = trimmed.indexOf("{")
  const last = trimmed.lastIndexOf("}")
  if (first !== -1 && last > first) candidates.push(trimmed.slice(first, last + 1))

  for (const candidate of candidates) {
    try {
      const value = JSON.parse(candidate) as unknown
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return value as RawPlan
      }
    } catch {
      // fall through to the next candidate
    }
  }
  return null
}

function buildUserPrompt({ prompt, graph }: GenerateDesignPlanInput): string {
  const nodes = graph.nodes.map((node) => ({
    id: node.id,
    label: node.data.label,
    shape: node.data.shape,
    color: node.data.color,
    column: Math.round((node.position?.x ?? 0) / DESIGN_GRID_COLUMN_STEP),
    row: Math.round((node.position?.y ?? 0) / DESIGN_GRID_ROW_STEP),
  }))
  const edges = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.data?.label ?? "",
  }))

  const canvasState =
    nodes.length === 0 && edges.length === 0
      ? "The canvas is currently empty."
      : `Current canvas:\nnodes: ${JSON.stringify(nodes)}\nedges: ${JSON.stringify(edges)}`

  return `${canvasState}\n\nUser request: ${prompt}`
}

/** Narrow the model's loosely-typed output into validated `DesignAction`s. */
function normalizePlan(raw: RawPlan): DesignPlan {
  const summary = typeof raw.summary === "string" ? raw.summary.trim() : ""
  const actions: DesignAction[] = []

  for (const candidate of raw.actions ?? []) {
    const action = normalizeAction(candidate)
    if (action) actions.push(action)
  }

  return { summary, actions }
}

function normalizeAction(raw: RawAction): DesignAction | null {
  if (!DESIGN_ACTION_TYPES.includes(raw.type as (typeof DESIGN_ACTION_TYPES)[number])) {
    return null
  }
  const id = typeof raw.id === "string" ? raw.id.trim() : ""
  if (!id) return null

  switch (raw.type as (typeof DESIGN_ACTION_TYPES)[number]) {
    case "addNode": {
      const label = typeof raw.label === "string" ? raw.label.trim() : ""
      if (!label) return null
      return {
        type: "addNode",
        id,
        label,
        shape: toShape(raw.shape) ?? "rectangle",
        color: toColor(raw.color) ?? "neutral",
        column: toGridIndex(raw.column),
        row: toGridIndex(raw.row),
      }
    }
    case "moveNode":
      return { type: "moveNode", id, column: toGridIndex(raw.column), row: toGridIndex(raw.row) }
    case "resizeNode": {
      if (!isFiniteNumber(raw.width) || !isFiniteNumber(raw.height)) return null
      return { type: "resizeNode", id, width: raw.width, height: raw.height }
    }
    case "updateNodeData": {
      const next: Extract<DesignAction, { type: "updateNodeData" }> = { type: "updateNodeData", id }
      if (typeof raw.label === "string" && raw.label.trim()) next.label = raw.label.trim()
      const shape = toShape(raw.shape)
      if (shape) next.shape = shape
      const color = toColor(raw.color)
      if (color) next.color = color
      if (next.label === undefined && next.shape === undefined && next.color === undefined) {
        return null
      }
      return next
    }
    case "deleteNode":
      return { type: "deleteNode", id }
    case "addEdge": {
      const source = typeof raw.source === "string" ? raw.source.trim() : ""
      const target = typeof raw.target === "string" ? raw.target.trim() : ""
      if (!source || !target) return null
      const edge: Extract<DesignAction, { type: "addEdge" }> = {
        type: "addEdge",
        id,
        source,
        target,
      }
      if (typeof raw.label === "string" && raw.label.trim()) edge.label = raw.label.trim()
      return edge
    }
    case "deleteEdge":
      return { type: "deleteEdge", id }
    default:
      return null
  }
}

function toShape(value: unknown): NodeShape | null {
  return NODE_SHAPES.includes(value as NodeShape) ? (value as NodeShape) : null
}

function toColor(value: unknown): NodeColorName | null {
  return COLOR_NAMES.includes(value as NodeColorName) ? (value as NodeColorName) : null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

/** Clamp a grid index to a sane non-negative integer. */
function toGridIndex(value: unknown): number {
  if (!isFiniteNumber(value)) return 0
  return Math.max(0, Math.round(value))
}
