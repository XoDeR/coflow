import { prisma } from "@/lib/prisma"
import { enrichCollaborators } from "@/lib/collaborators"
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

  const collaborators = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  })
  const enriched = await enrichCollaborators(collaborators)

  return Response.json({ collaborators: enriched, isOwner: project.ownerId === userId })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await getCurrentIdentity()
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await params
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }
  if (project.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const rawEmail =
    body && typeof body === "object" ? (body as Record<string, unknown>).email : undefined
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : ""

  if (!EMAIL_PATTERN.test(email)) {
    return Response.json({ error: "A valid email is required" }, { status: 400 })
  }

  const existing = await prisma.projectCollaborator.findUnique({
    where: { projectId_email: { projectId, email } },
  })
  if (existing) {
    return Response.json({ error: "Already a collaborator" }, { status: 409 })
  }

  const collaborator = await prisma.projectCollaborator.create({
    data: { projectId, email },
  })
  const [enriched] = await enrichCollaborators([collaborator])

  return Response.json({ collaborator: enriched }, { status: 201 })
}
