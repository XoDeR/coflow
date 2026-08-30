import { prisma } from "@/lib/prisma"
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access"

/**
 * List generated specs for a project (metadata only — content lives in Vercel
 * Blob and is served through the sibling `[specId]/download` route). Gated the
 * same way as every other project resource: authenticated user, owner or
 * collaborator. Thin read-only companion to the persistence flow in unit 28;
 * no generation or storage logic lives here.
 */
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

  const specs = await prisma.projectSpec.findMany({
    where: { projectId: project.id, filePath: { not: "" } },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  })

  return Response.json({
    specs: specs.map((spec) => ({
      id: spec.id,
      filename: `spec-${spec.id}.md`,
      createdAt: spec.createdAt.toISOString(),
    })),
  })
}
