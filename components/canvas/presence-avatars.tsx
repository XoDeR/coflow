"use client"

import { useMemo } from "react"
import { UserButton, useAuth } from "@clerk/nextjs"
import { shallow, useOthers } from "@liveblocks/react/suspense"

const MAX_VISIBLE_AVATARS = 5

interface Collaborator {
  id: string
  name: string
  avatar: string
  color: string
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

/**
 * Top-right participant group for the editor canvas view:
 * collaborator avatars (everyone except the current Clerk user) followed by the
 * existing Clerk `UserButton` for the current user. The divider only shows when
 * at least one collaborator is present.
 */
export function PresenceAvatars() {
  const { userId } = useAuth()

  const collaborators = useOthers(
    (others) =>
      others
        .filter((other) => other.id && other.id !== userId)
        .map((other) => ({
          id: other.id as string,
          name: other.info.name,
          avatar: other.info.avatar,
          color: other.info.color,
        })),
    shallow
  )

  // The same person on multiple tabs is one collaborator.
  const uniqueCollaborators = useMemo(() => {
    const byId = new Map<string, Collaborator>()
    for (const collaborator of collaborators) {
      if (!byId.has(collaborator.id)) byId.set(collaborator.id, collaborator)
    }
    return [...byId.values()]
  }, [collaborators])

  const visible = uniqueCollaborators.slice(0, MAX_VISIBLE_AVATARS)
  const overflow = uniqueCollaborators.length - visible.length

  return (
    <div className="pointer-events-none absolute top-4 right-4 z-10 flex items-center gap-2 rounded-full border border-surface-border bg-surface/80 px-2 py-1 backdrop-blur-sm">
      {visible.length > 0 ? (
        <div className="flex items-center -space-x-2">
          {visible.map((collaborator) => (
            <CollaboratorAvatar key={collaborator.id} collaborator={collaborator} />
          ))}
          {overflow > 0 ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-subtle text-[0.65rem] font-medium text-copy-secondary ring-2 ring-surface">
              +{overflow}
            </div>
          ) : null}
        </div>
      ) : null}

      {visible.length > 0 ? <div className="h-6 w-px bg-surface-border" /> : null}

      <div className="pointer-events-auto">
        <UserButton />
      </div>
    </div>
  )
}

function CollaboratorAvatar({ collaborator }: { collaborator: Collaborator }) {
  const { name, avatar, color } = collaborator

  return (
    <div
      aria-label={name}
      className="h-7 w-7 shrink-0 overflow-hidden rounded-full ring-2 ring-surface select-none"
      style={{ backgroundColor: color }}
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[0.65rem] font-semibold text-white">
          {getInitials(name)}
        </span>
      )}
    </div>
  )
}
