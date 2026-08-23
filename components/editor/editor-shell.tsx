"use client"

import { useState } from "react"

import { AiSidebar } from "@/components/editor/ai-sidebar"
import { CreateProjectDialog } from "@/components/editor/create-project-dialog"
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog"
import { EditorHome } from "@/components/editor/editor-home"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog"
import { ShareDialog } from "@/components/editor/share-dialog"
import { useProjectActions } from "@/hooks/use-project-actions"
import type { Project } from "@/types/project"

interface EditorShellProps {
  projects: Project[]
  activeProjectId?: string
}

export function EditorShell({ projects, activeProjectId }: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const activeProject = activeProjectId
    ? projects.find((project) => project.id === activeProjectId)
    : undefined

  const {
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
  } = useProjectActions({ activeProjectId })

  return (
    <div className="flex h-svh flex-col bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        projectName={activeProject?.name}
        isAiSidebarOpen={isAiSidebarOpen}
        onToggleAiSidebar={
          activeProjectId ? () => setIsAiSidebarOpen((open) => !open) : undefined
        }
        onShare={activeProjectId ? () => setIsShareDialogOpen(true) : undefined}
      />
      <div className="relative flex flex-1 overflow-hidden">
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          projects={projects}
          activeProjectId={activeProjectId}
          onCreateProject={openCreateDialog}
          onRenameProject={openRenameDialog}
          onDeleteProject={openDeleteDialog}
        />
        <main className="flex flex-1 items-center justify-center bg-base p-6">
          {activeProjectId ? (
            <div className="flex flex-col items-center gap-1.5 text-center">
              <h1 className="text-lg font-medium text-copy-primary">
                {activeProject?.name ?? "Workspace"}
              </h1>
              <p className="text-sm text-copy-muted">Canvas coming soon.</p>
            </div>
          ) : (
            <EditorHome onCreateProject={openCreateDialog} />
          )}
        </main>
        {activeProjectId ? (
          <AiSidebar
            isOpen={isAiSidebarOpen}
            onClose={() => setIsAiSidebarOpen(false)}
          />
        ) : null}
      </div>

      <CreateProjectDialog
        open={dialog?.type === "create"}
        name={name}
        roomId={roomId}
        isLoading={isLoading}
        error={error}
        onOpenChange={handleOpenChange}
        onNameChange={setName}
        onSubmit={submitCreate}
      />
      <RenameProjectDialog
        open={dialog?.type === "rename"}
        currentName={dialog?.type === "rename" ? dialog.project.name : ""}
        name={name}
        isLoading={isLoading}
        error={error}
        onOpenChange={handleOpenChange}
        onNameChange={setName}
        onSubmit={submitRename}
      />
      <DeleteProjectDialog
        open={dialog?.type === "delete"}
        projectName={dialog?.type === "delete" ? dialog.project.name : ""}
        isLoading={isLoading}
        error={error}
        onOpenChange={handleOpenChange}
        onConfirm={confirmDelete}
      />
      {activeProjectId ? (
        <ShareDialog
          open={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          projectId={activeProjectId}
        />
      ) : null}
    </div>
  )
}
