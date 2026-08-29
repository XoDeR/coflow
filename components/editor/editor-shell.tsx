"use client"

import { useCallback, useRef, useState } from "react"

import { CanvasRoom } from "@/components/canvas/canvas-room"
import { EditorRoom } from "@/components/canvas/editor-room"
import { AiSidebar } from "@/components/editor/ai-sidebar"
import { CreateProjectDialog } from "@/components/editor/create-project-dialog"
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog"
import { EditorHome } from "@/components/editor/editor-home"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog"
import { ShareDialog } from "@/components/editor/share-dialog"
import { useProjectActions } from "@/hooks/use-project-actions"
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave"
import type { Project } from "@/types/project"

interface EditorShellProps {
  projects: Project[]
  activeProjectId?: string
}

export function EditorShell({ projects, activeProjectId }: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<CanvasSaveStatus>("idle")
  // The manual-save function lives inside the Liveblocks room (it needs the live
  // canvas state); the canvas registers it here so the navbar button can call it.
  const saveNowRef = useRef<(() => void) | null>(null)
  const registerSave = useCallback((fn: () => void) => {
    saveNowRef.current = fn
  }, [])
  const handleManualSave = useCallback(() => {
    saveNowRef.current?.()
  }, [])
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
        onOpenTemplates={
          activeProjectId ? () => setIsTemplatesModalOpen(true) : undefined
        }
        saveStatus={activeProjectId ? saveStatus : undefined}
        onSave={activeProjectId ? handleManualSave : undefined}
        showUserButton={!activeProjectId}
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
        {activeProjectId ? (
          <EditorRoom roomId={activeProjectId}>
            <main className="relative flex-1 overflow-hidden bg-base">
              <CanvasRoom
                roomId={activeProjectId}
                templatesModalOpen={isTemplatesModalOpen}
                onTemplatesModalOpenChange={setIsTemplatesModalOpen}
                onSaveStatusChange={setSaveStatus}
                onRegisterSave={registerSave}
              />
            </main>
            <AiSidebar
              isOpen={isAiSidebarOpen}
              onClose={() => setIsAiSidebarOpen(false)}
              roomId={activeProjectId}
            />
          </EditorRoom>
        ) : (
          <main className="flex flex-1 items-center justify-center bg-base p-6">
            <EditorHome onCreateProject={openCreateDialog} />
          </main>
        )}
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
