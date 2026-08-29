import { auth } from "@trigger.dev/sdk"

import { getCurrentIdentity } from "@/lib/project-access"
import { getOwnedTaskRun } from "@/lib/task-runs"

export async function POST(request: Request) {
  const { userId } = await getCurrentIdentity()
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const runId = typeof body?.runId === "string" ? body.runId : ""
  if (!runId) {
    return Response.json({ error: "runId is required" }, { status: 400 })
  }

  const taskRun = await getOwnedTaskRun(runId, userId)
  if (!taskRun) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const token = await auth.createPublicToken({
    scopes: { read: { runs: [runId] } },
    expirationTime: "1h",
  })

  return Response.json({ token })
}
