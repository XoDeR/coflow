"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

import { generateShortSuffix, slugify } from "@/lib/utils"
import type { Project } from "@/types/project"

type ProjectDialogState =
  | { type: "create" }
  | { type: "rename"; project: Project }
  | { type: "delete"; project: Project }
  | null

interface UseProjectActionsOptions {
  activeProjectId?: string
}

async function parseError(response: Response): Promise<string> {
  const body = await response.json().catch(() => null)
  const error =
    body && typeof body === "object" ? (body as Record<string, unknown>).error : undefined
  return typeof error === "string" ? error : "Something went wrong"
}

export function useProjectActions({ activeProjectId }: UseProjectActionsOptions = {}) {
  const router = useRouter()
  const [dialog, setDialog] = useState<ProjectDialogState>(null)
  const [name, setName] = useState("")
  const [suffix, setSuffix] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const slug = useMemo(() => slugify(name), [name])
  const roomId = useMemo(() => (slug ? `${slug}-${suffix}` : ""), [slug, suffix])

  function openCreateDialog() {
    setName("")
    setSuffix(generateShortSuffix())
    setError(null)
    setDialog({ type: "create" })
  }

  function openRenameDialog(project: Project) {
    setName(project.name)
    setError(null)
    setDialog({ type: "rename", project })
  }

  function openDeleteDialog(project: Project) {
    setError(null)
    setDialog({ type: "delete", project })
  }

  function closeDialog() {
    setDialog(null)
    setName("")
    setSuffix("")
    setIsLoading(false)
    setError(null)
  }

  function handleOpenChange(open: boolean) {
    if (!open) closeDialog()
  }

  async function submitCreate() {
    const trimmed = name.trim()
    if (!trimmed || !slug) return

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      })
      if (!response.ok) {
        setError(await parseError(response))
        setIsLoading(false)
        return
      }
      const { project } = (await response.json()) as { project: { id: string } }
      closeDialog()
      router.push(`/editor/${project.id}`)
    } catch {
      setError("Something went wrong")
      setIsLoading(false)
    }
  }

  async function submitRename() {
    if (dialog?.type !== "rename") return
    const trimmed = name.trim()
    if (!trimmed) return

    const projectId = dialog.project.id
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      })
      if (!response.ok) {
        setError(await parseError(response))
        setIsLoading(false)
        return
      }
      closeDialog()
      router.refresh()
    } catch {
      setError("Something went wrong")
      setIsLoading(false)
    }
  }

  async function confirmDelete() {
    if (dialog?.type !== "delete") return

    const projectId = dialog.project.id
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        setError(await parseError(response))
        setIsLoading(false)
        return
      }
      closeDialog()
      if (activeProjectId === projectId) {
        router.push("/editor")
      } else {
        router.refresh()
      }
    } catch {
      setError("Something went wrong")
      setIsLoading(false)
    }
  }

  return {
    dialog,
    name,
    roomId,
    isLoading,
    error,
    setName,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    handleOpenChange,
    submitCreate,
    submitRename,
    confirmDelete,
  }
}

export type UseProjectActionsReturn = ReturnType<typeof useProjectActions>
