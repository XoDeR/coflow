"use client"

import { useEffect, useState } from "react"

import type { Collaborator } from "@/types/collaborator"

interface UseShareDialogOptions {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

async function parseError(response: Response): Promise<string> {
  const body = await response.json().catch(() => null)
  const error =
    body && typeof body === "object" ? (body as Record<string, unknown>).error : undefined
  return typeof error === "string" ? error : "Something went wrong"
}

export function useShareDialog({ projectId, open, onOpenChange }: UseShareDialogOptions) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [inviteEmail, setInviteEmail] = useState("")
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const [removingId, setRemovingId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return

    let cancelled = false

    async function loadCollaborators() {
      setIsLoading(true)
      setLoadError(null)
      try {
        const response = await fetch(`/api/projects/${projectId}/collaborators`)
        if (!response.ok) throw new Error(await parseError(response))
        const data = (await response.json()) as {
          collaborators: Collaborator[]
          isOwner: boolean
        }
        if (cancelled) return
        setCollaborators(data.collaborators)
        setIsOwner(data.isOwner)
      } catch (err) {
        if (cancelled) return
        setLoadError(err instanceof Error ? err.message : "Something went wrong")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadCollaborators()

    return () => {
      cancelled = true
    }
  }, [open, projectId])

  async function submitInvite() {
    const trimmed = inviteEmail.trim()
    if (!trimmed) return

    setIsInviting(true)
    setInviteError(null)
    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      })
      if (!response.ok) {
        setInviteError(await parseError(response))
        return
      }
      const { collaborator } = (await response.json()) as { collaborator: Collaborator }
      setCollaborators((current) => [...current, collaborator])
      setInviteEmail("")
    } catch {
      setInviteError("Something went wrong")
    } finally {
      setIsInviting(false)
    }
  }

  async function removeCollaborator(collaboratorId: string) {
    setRemovingId(collaboratorId)
    try {
      const response = await fetch(
        `/api/projects/${projectId}/collaborators/${collaboratorId}`,
        { method: "DELETE" }
      )
      if (!response.ok) return
      setCollaborators((current) => current.filter((c) => c.id !== collaboratorId))
    } finally {
      setRemovingId(null)
    }
  }

  async function copyLink() {
    const url = `${window.location.origin}/editor/${projectId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setInviteEmail("")
      setInviteError(null)
      setCopied(false)
    }
    onOpenChange(next)
  }

  return {
    collaborators,
    isOwner,
    isLoading,
    loadError,
    inviteEmail,
    setInviteEmail,
    isInviting,
    inviteError,
    submitInvite,
    removingId,
    removeCollaborator,
    copied,
    copyLink,
    handleOpenChange,
  }
}
