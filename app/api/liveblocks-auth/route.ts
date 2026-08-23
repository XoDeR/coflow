import { currentUser } from "@clerk/nextjs/server"

import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access"
import { getLiveblocksClient, getUserColor } from "@/lib/liveblocks"

export async function POST(request: Request) {
  const { userId, email } = await getCurrentIdentity()
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const roomId = body && typeof body === "object" ? (body as Record<string, unknown>).room : undefined
  if (typeof roomId !== "string" || roomId.length === 0) {
    return Response.json({ error: "room is required" }, { status: 400 })
  }

  const { hasAccess } = await getProjectAccess(roomId, userId, email)
  if (!hasAccess) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const liveblocks = getLiveblocksClient()

  await liveblocks.getOrCreateRoom(roomId, {
    defaultAccesses: ["room:write"],
  })

  const user = await currentUser()
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || email || "Anonymous"
  const avatar = user?.imageUrl ?? ""

  const { status, body: responseBody } = await liveblocks.identifyUser(
    { userId, groupIds: [] },
    { userInfo: { name, avatar, color: getUserColor(userId) } }
  )

  return new Response(responseBody, { status })
}
