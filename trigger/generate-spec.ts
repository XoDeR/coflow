import { logger, metadata, schemaTask } from "@trigger.dev/sdk"

import { saveGeneratedSpec } from "@/lib/project-specs"
import {
  generateSpecMarkdown,
  generateSpecPayloadSchema,
} from "@/lib/spec-generation"

/**
 * Spec-generation task. Takes the current canvas graph and the room's design
 * conversation and produces a Markdown technical specification with Gemini,
 * updating run metadata as it goes so the client can track progress in realtime.
 * The generated Markdown is returned as the task output; persisting it is a
 * later unit's job.
 */
export const generateSpecTask = schemaTask({
  id: "generate-spec",
  schema: generateSpecPayloadSchema,
  maxDuration: 300,
  // A single pass — regenerating a spec is cheap to re-trigger and a mid-flight
  // failure reports itself through run metadata rather than silently retrying.
  retry: { maxAttempts: 1 },
  run: async (payload) => {
    metadata.set("status", "generating")
    logger.log("Generating spec", {
      projectId: payload.projectId,
      roomId: payload.roomId,
      nodeCount: payload.nodes.length,
      edgeCount: payload.edges.length,
      messageCount: payload.chatHistory.length,
    })

    try {
      const spec = await generateSpecMarkdown({
        chatHistory: payload.chatHistory,
        nodes: payload.nodes,
        edges: payload.edges,
      })

      logger.log("Spec generated", { length: spec.length })

      // Persist: metadata row in Postgres, Markdown content in Vercel Blob.
      const record = await saveGeneratedSpec(payload.projectId, spec)
      metadata.set("status", "complete").set("specId", record.id)
      logger.log("Spec persisted", { specId: record.id, filePath: record.filePath })

      // Plain Markdown as the task output, per spec.
      return spec
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      metadata.set("status", "error").set("error", message)
      logger.error("Spec generation failed", { message })
      throw error
    }
  },
})
