import { tasks } from "@trigger.dev/sdk"

import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access"
import { recordTaskRun } from "@/lib/task-runs"
import type { designAgentTask } from "@/trigger/design-agent"

export async function POST(request: Request) {
  const { userId, email } = await getCurrentIdentity()
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : ""
  const roomId = typeof body?.roomId === "string" ? body.roomId : ""
  const projectId = typeof body?.projectId === "string" ? body.projectId : ""

  if (!prompt) {
    return Response.json({ error: "prompt is required" }, { status: 400 })
  }
  if (!roomId || !projectId) {
    return Response.json(
      { error: "roomId and projectId are required" },
      { status: 400 }
    )
  }

  const { project, hasAccess } = await getProjectAccess(projectId, userId, email)
  if (!project) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }
  if (!hasAccess) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const handle = await tasks.trigger<typeof designAgentTask>("design-agent", {
    prompt,
    roomId,
  })

  await recordTaskRun(handle.id, projectId, userId)

  return Response.json({ runId: handle.id }, { status: 202 })
}
