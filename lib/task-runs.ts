import { prisma } from "@/lib/prisma"
import type { TaskRun } from "@/app/generated/prisma/client"

/**
 * Persist a Trigger.dev run so its ownership can be verified later (e.g. before
 * issuing a run-scoped public token).
 */
export function recordTaskRun(
  runId: string,
  projectId: string,
  userId: string
): Promise<TaskRun> {
  return prisma.taskRun.create({
    data: { runId, projectId, userId },
  })
}

/**
 * Return the TaskRun for `runId` only when it belongs to `userId`, otherwise
 * `null`. Callers treat `null` as "not authorized for this run".
 */
export async function getOwnedTaskRun(
  runId: string,
  userId: string
): Promise<TaskRun | null> {
  const taskRun = await prisma.taskRun.findUnique({ where: { runId } })
  if (!taskRun || taskRun.userId !== userId) return null
  return taskRun
}
