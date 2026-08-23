import { redirect } from "next/navigation"

import { AccessDenied } from "@/components/editor/access-denied"
import { EditorShell } from "@/components/editor/editor-shell"
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access"
import { getOwnedProjects, getSharedProjects } from "@/lib/projects"
import type { Project } from "@/types/project"

interface WorkspacePageProps {
  params: Promise<{ roomId: string }>
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { userId, email } = await getCurrentIdentity()
  if (!userId) redirect("/sign-in")

  const { roomId } = await params
  const { project, hasAccess } = await getProjectAccess(roomId, userId, email)

  if (!project || !hasAccess) {
    return <AccessDenied />
  }

  const [owned, shared] = await Promise.all([
    getOwnedProjects(userId),
    getSharedProjects(email),
  ])

  const projects: Project[] = [
    ...owned.map((p) => ({ id: p.id, name: p.name, isOwner: true })),
    ...shared.map((p) => ({ id: p.id, name: p.name, isOwner: false })),
  ]

  return <EditorShell projects={projects} activeProjectId={roomId} />
}
