import { prisma } from "@/lib/prisma"
import type { Project } from "@/app/generated/prisma/client"

export function getOwnedProjects(ownerId: string): Promise<Project[]> {
  return prisma.project.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
  })
}

export function getSharedProjects(email: string): Promise<Project[]> {
  if (!email) return Promise.resolve([])

  return prisma.project.findMany({
    where: { collaborators: { some: { email } } },
    orderBy: { createdAt: "desc" },
  })
}
