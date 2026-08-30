import { prisma } from "@/lib/prisma"
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access"
import { fetchSpecMarkdown } from "@/lib/spec-storage"

/**
 * Download a generated spec as a Markdown attachment. Access is gated the same
 * way as every other project resource: authenticated user, owner or
 * collaborator, and the spec must belong to the project in the URL. The blob URL
 * in `ProjectSpec.filePath` is never exposed — the content is streamed back
 * through this handler.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; specId: string }> }
) {
  const { userId, email } = await getCurrentIdentity()
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId, specId } = await params
  const { project, hasAccess } = await getProjectAccess(projectId, userId, email)
  if (!project) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }
  if (!hasAccess) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const spec = await prisma.projectSpec.findUnique({ where: { id: specId } })
  if (!spec || spec.projectId !== project.id) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const markdown = await fetchSpecMarkdown(spec.filePath)
  if (markdown === null) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return new Response(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="spec-${specId}.md"`,
    },
  })
}
