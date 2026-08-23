import { auth, currentUser } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"
import type { Project } from "@/app/generated/prisma/client"

export interface ProjectIdentity {
  userId: string | null
  email: string
}

export interface ProjectAccessResult {
  project: Project | null
  hasAccess: boolean
}

export async function getCurrentIdentity(): Promise<ProjectIdentity> {
  const { userId } = await auth()
  if (!userId) return { userId: null, email: "" }

  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress ?? ""

  return { userId, email }
}

export async function getProjectAccess(
  projectId: string,
  userId: string,
  email: string
): Promise<ProjectAccessResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { collaborators: true },
  })

  if (!project) return { project: null, hasAccess: false }

  const isOwner = project.ownerId === userId
  const isCollaborator = email
    ? project.collaborators.some((collaborator) => collaborator.email === email)
    : false

  return { project, hasAccess: isOwner || isCollaborator }
}
