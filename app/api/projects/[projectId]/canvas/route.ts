import { prisma } from "@/lib/prisma"
import {
  fetchCanvasSnapshot,
  parseCanvasSnapshot,
  uploadCanvasSnapshot,
} from "@/lib/canvas-storage"
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId, email } = await getCurrentIdentity()
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await params
  const { project, hasAccess } = await getProjectAccess(projectId, userId, email)
  if (!project) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }
  if (!hasAccess) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!project.canvasJsonPath) {
    return Response.json({ canvas: null })
  }

  const canvas = await fetchCanvasSnapshot(project.canvasJsonPath)
  return Response.json({ canvas })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId, email } = await getCurrentIdentity()
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await params
  const { project, hasAccess } = await getProjectAccess(projectId, userId, email)
  if (!project) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }
  if (!hasAccess) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const snapshot = parseCanvasSnapshot(body)
  if (!snapshot) {
    return Response.json({ error: "Invalid canvas payload" }, { status: 400 })
  }

  const url = await uploadCanvasSnapshot(projectId, snapshot)
  await prisma.project.update({
    where: { id: projectId },
    data: { canvasJsonPath: url },
  })

  return Response.json({ url })
}
