"use client"

import { useMemo, useState } from "react"

import { MOCK_PROJECTS } from "@/lib/mock-projects"
import { slugify } from "@/lib/utils"
import type { Project } from "@/types/project"

type ProjectDialogState =
  | { type: "create" }
  | { type: "rename"; project: Project }
  | { type: "delete"; project: Project }
  | null

const MOCK_DELAY_MS = 400

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function useProjectDialogs() {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS)
  const [dialog, setDialog] = useState<ProjectDialogState>(null)
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const slug = useMemo(() => slugify(name), [name])

  function openCreateDialog() {
    setName("")
    setDialog({ type: "create" })
  }

  function openRenameDialog(project: Project) {
    setName(project.name)
    setDialog({ type: "rename", project })
  }

  function openDeleteDialog(project: Project) {
    setDialog({ type: "delete", project })
  }

  function closeDialog() {
    setDialog(null)
    setName("")
    setIsLoading(false)
  }

  function handleOpenChange(open: boolean) {
    if (!open) closeDialog()
  }

  async function submitCreate() {
    const trimmed = name.trim()
    if (!trimmed) return

    setIsLoading(true)
    await wait(MOCK_DELAY_MS)
    setProjects((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: trimmed,
        slug: slugify(trimmed),
        isOwner: true,
      },
    ])
    closeDialog()
  }

  async function submitRename() {
    if (dialog?.type !== "rename") return
    const trimmed = name.trim()
    if (!trimmed) return

    const projectId = dialog.project.id
    setIsLoading(true)
    await wait(MOCK_DELAY_MS)
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? { ...project, name: trimmed, slug: slugify(trimmed) }
          : project
      )
    )
    closeDialog()
  }

  async function confirmDelete() {
    if (dialog?.type !== "delete") return

    const projectId = dialog.project.id
    setIsLoading(true)
    await wait(MOCK_DELAY_MS)
    setProjects((prev) => prev.filter((project) => project.id !== projectId))
    closeDialog()
  }

  return {
    projects,
    dialog,
    name,
    slug,
    isLoading,
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

export type UseProjectDialogsReturn = ReturnType<typeof useProjectDialogs>
