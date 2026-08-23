import { clerkClient } from "@clerk/nextjs/server"

import type { ProjectCollaborator } from "@/app/generated/prisma/client"
import type { Collaborator } from "@/types/collaborator"

export async function enrichCollaborators(
  collaborators: ProjectCollaborator[]
): Promise<Collaborator[]> {
  if (collaborators.length === 0) return []

  const client = await clerkClient()
  const { data: users } = await client.users.getUserList({
    emailAddress: collaborators.map((collaborator) => collaborator.email),
    limit: collaborators.length,
  })

  const userByEmail = new Map<string, (typeof users)[number]>()
  for (const user of users) {
    for (const address of user.emailAddresses) {
      userByEmail.set(address.emailAddress.toLowerCase(), user)
    }
  }

  return collaborators.map((collaborator) => {
    const user = userByEmail.get(collaborator.email.toLowerCase())
    if (!user) {
      return { id: collaborator.id, email: collaborator.email, name: null, imageUrl: null }
    }

    const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()

    return {
      id: collaborator.id,
      email: collaborator.email,
      name: name || null,
      imageUrl: user.imageUrl || null,
    }
  })
}
