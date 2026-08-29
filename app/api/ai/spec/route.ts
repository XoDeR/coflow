import { tasks } from "@trigger.dev/sdk"

import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access"
import { generateSpecPayloadSchema } from "@/lib/spec-generation"
import { recordTaskRun } from "@/lib/task-runs"
import type { generateSpecTask } from "@/trigger/generate-spec"

export async function POST(request: Request) {
  const { userId, email } = await getCurrentIdentity()
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const roomId = typeof body?.roomId === "string" ? body.roomId : ""
  if (!roomId) {
    return Response.json({ error: "roomId is required" }, { status: 400 })
  }

  // Project access is resolved from the authenticated user + `roomId` only. The
  // room id and the project id are the same value across the app; a
  // client-supplied `projectId` is never trusted.
  const { project, hasAccess } = await getProjectAccess(roomId, userId, email)
  if (!project) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }
  if (!hasAccess) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const parsed = generateSpecPayloadSchema.safeParse({
    projectId: project.id,
    roomId,
    chatHistory: body?.chatHistory,
    nodes: body?.nodes,
    edges: body?.edges,
  })
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const handle = await tasks.trigger<typeof generateSpecTask>(
    "generate-spec",
    parsed.data
  )

  await recordTaskRun(handle.id, project.id, userId)

  return Response.json({ runId: handle.id }, { status: 202 })
}
