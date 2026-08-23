import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await params

  const existing = await prisma.project.findUnique({ where: { id: projectId } })
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }
  if (existing.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const rawName = body && typeof body === "object" ? (body as Record<string, unknown>).name : undefined
  if (typeof rawName !== "string" || rawName.trim().length === 0) {
    return Response.json({ error: "name is required" }, { status: 400 })
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { name: rawName.trim() },
  })

  return Response.json({ project })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await params

  const existing = await prisma.project.findUnique({ where: { id: projectId } })
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }
  if (existing.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const project = await prisma.project.delete({ where: { id: projectId } })

  return Response.json({ project })
}
