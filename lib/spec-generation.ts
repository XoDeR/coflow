import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText } from "ai"
import { z } from "zod"

/**
 * Gemini-backed generation of a Markdown technical specification from a canvas
 * graph and the room's chat history. This module only produces the Markdown;
 * triggering, ownership, and run tracking live in the route and the
 * `generate-spec` task.
 */

const google = createGoogleGenerativeAI({
  // `@ai-sdk/google` defaults to `GOOGLE_GENERATIVE_AI_API_KEY`; this project's
  // key is stored under `GOOGLE_AI_API_KEY` (same as `lib/design-actions.ts`).
  apiKey: process.env.GOOGLE_AI_API_KEY,
})

const MODEL = "gemini-3.5-flash-lite"

/** A single chat message forwarded from the room's `ai-chat` feed. */
const specChatMessageSchema = z.object({
  sender: z.string().optional(),
  role: z.enum(["user", "assistant"]).optional(),
  content: z.string(),
})

/** A canvas node — a lenient subset of the editor's `CanvasNode` shape. */
const specNodeSchema = z.object({
  id: z.string(),
  data: z
    .object({
      label: z.string().optional(),
      shape: z.string().optional(),
      color: z.string().optional(),
    })
    .optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
})

/** A canvas edge — a lenient subset of the editor's `CanvasEdge` shape. */
const specEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  data: z.object({ label: z.string().optional() }).optional(),
})

/**
 * Validated payload for both `POST /api/ai/spec` (request body) and the
 * `generate-spec` task. `projectId` is resolved server-side from the
 * authenticated user + `roomId` and is never read from the client request body.
 */
export const generateSpecPayloadSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(specChatMessageSchema).default([]),
  nodes: z.array(specNodeSchema).default([]),
  edges: z.array(specEdgeSchema).default([]),
})

export type GenerateSpecPayload = z.infer<typeof generateSpecPayloadSchema>

export interface GenerateSpecInput {
  chatHistory: GenerateSpecPayload["chatHistory"]
  nodes: GenerateSpecPayload["nodes"]
  edges: GenerateSpecPayload["edges"]
}

const SYSTEM_PROMPT = `You are Coflow's specification writer. You turn a system-design canvas (nodes and edges) plus the design conversation into a clear technical specification.

Respond with GitHub-flavored Markdown only — no code fence around the whole document, no preamble, no closing remarks.

Structure the document with these sections (omit a section only if there is genuinely nothing to say):
1. "# <System name> — Technical Specification"
2. "## Overview" — what the system does, in two or three sentences, grounded in the canvas and conversation.
3. "## Components" — one subsection ("### <Component>") per node, describing its responsibility. Use the node shape as a hint (rectangle = service/component, pill = worker/process, cylinder = datastore, hexagon = external system, diamond = gateway/decision, circle = event/endpoint).
4. "## Data & Control Flow" — walk the edges in flow order, describing how components interact; mention edge labels where present.
5. "## Considerations" — scaling, failure modes, and open questions implied by the design or raised in the conversation.

Be concrete and concise. Do not invent components or connections that are not in the canvas. If the canvas is empty, say so plainly and summarize only what the conversation describes.`

export async function generateSpecMarkdown(
  input: GenerateSpecInput
): Promise<string> {
  const { text } = await generateText({
    model: google(MODEL),
    system: SYSTEM_PROMPT,
    prompt: buildUserPrompt(input),
    temperature: 0.3,
    maxOutputTokens: 8000,
  })

  const spec = stripDocumentFence(text.trim())
  if (!spec) {
    throw new Error("Gemini returned an empty specification")
  }
  return spec
}

function buildUserPrompt({ chatHistory, nodes, edges }: GenerateSpecInput): string {
  const nodeLines = nodes.map((node) => {
    const label = node.data?.label?.trim() || node.id
    const shape = node.data?.shape ?? "rectangle"
    return `- ${label} (id: ${node.id}, shape: ${shape})`
  })

  const nodeLabels = new Map(
    nodes.map((node) => [node.id, node.data?.label?.trim() || node.id])
  )
  const edgeLines = edges.map((edge) => {
    const from = nodeLabels.get(edge.source) ?? edge.source
    const to = nodeLabels.get(edge.target) ?? edge.target
    const label = edge.data?.label?.trim()
    return `- ${from} -> ${to}${label ? ` (${label})` : ""}`
  })

  const conversation = chatHistory
    .map((message) => {
      const who = message.role === "assistant" ? "AI" : message.sender?.trim() || "User"
      return `${who}: ${message.content}`
    })
    .join("\n")

  const canvas =
    nodes.length === 0 && edges.length === 0
      ? "The canvas is currently empty."
      : `Nodes:\n${nodeLines.join("\n") || "(none)"}\n\nEdges:\n${
          edgeLines.join("\n") || "(none)"
        }`

  const chatSection = conversation
    ? `Design conversation:\n${conversation}`
    : "Design conversation: (none)"

  return `${canvas}\n\n${chatSection}\n\nWrite the technical specification now.`
}

/** Drop a stray ```` ```markdown ```` wrapper if the model fenced the whole reply. */
function stripDocumentFence(text: string): string {
  const match = text.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i)
  return match?.[1]?.trim() ?? text
}
