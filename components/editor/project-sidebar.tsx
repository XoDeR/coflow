"use client"

import { Pencil, Plus, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { Project } from "@/types/project"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  projects: Project[]
  onCreateProject: () => void
  onRenameProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
}

export function ProjectSidebar({
  isOpen,
  onClose,
  projects,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}: ProjectSidebarProps) {
  const ownedProjects = projects.filter((project) => project.isOwner)
  const sharedProjects = projects.filter((project) => !project.isOwner)

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 top-14 z-30 bg-black/50 transition-opacity duration-200 ease-out md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        aria-hidden={!isOpen}
        className={cn(
          "fixed top-14 bottom-0 left-0 z-40 flex w-72 flex-col border-r border-surface-border bg-surface/95 backdrop-blur-sm transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
          <h2 className="text-sm font-medium text-copy-primary">Projects</h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="text-copy-secondary" />
          </Button>
        </div>

        <Tabs
          defaultValue="my-projects"
          className="flex flex-1 flex-col overflow-hidden px-4 pt-3"
        >
          <TabsList className="w-full">
            <TabsTrigger value="my-projects" className="flex-1">
              My Projects
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex-1">
              Shared
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="my-projects"
            className="flex flex-1 flex-col overflow-y-auto"
          >
            {ownedProjects.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-copy-muted">No projects yet</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-0.5 py-2">
                {ownedProjects.map((project) => (
                  <li
                    key={project.id}
                    className="group flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-subtle"
                  >
                    <span className="truncate text-sm text-copy-primary">
                      {project.name}
                    </span>
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onRenameProject(project)}
                        aria-label={`Rename ${project.name}`}
                      >
                        <Pencil className="text-copy-secondary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onDeleteProject(project)}
                        aria-label={`Delete ${project.name}`}
                      >
                        <Trash2 className="text-copy-secondary" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
          <TabsContent
            value="shared"
            className="flex flex-1 flex-col overflow-y-auto"
          >
            {sharedProjects.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-copy-muted">
                  No shared projects yet
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-0.5 py-2">
                {sharedProjects.map((project) => (
                  <li
                    key={project.id}
                    className="flex items-center rounded-lg px-2 py-1.5 hover:bg-subtle"
                  >
                    <span className="truncate text-sm text-copy-primary">
                      {project.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>

        <div className="border-t border-surface-border p-4">
          <Button className="w-full" onClick={onCreateProject}>
            <Plus />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}
