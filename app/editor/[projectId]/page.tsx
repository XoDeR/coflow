import { auth, currentUser } from "@clerk/nextjs/server"

import { EditorShell } from "@/components/editor/editor-shell"
import { getOwnedProjects, getSharedProjects } from "@/lib/projects"
import type { Project } from "@/types/project"

interface WorkspacePageProps {
  params: Promise<{ projectId: string }>
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { userId } = await auth()
  if (!userId) return null

  const { projectId } = await params
  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress ?? ""

  const [owned, shared] = await Promise.all([
    getOwnedProjects(userId),
    getSharedProjects(email),
  ])

  const projects: Project[] = [
    ...owned.map((project) => ({ id: project.id, name: project.name, isOwner: true })),
    ...shared.map((project) => ({ id: project.id, name: project.name, isOwner: false })),
  ]

  return <EditorShell projects={projects} activeProjectId={projectId} />
}
