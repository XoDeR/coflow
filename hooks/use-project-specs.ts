"use client"

import { useCallback, useEffect, useState } from "react"

import type { ProjectSpecSummary } from "@/types/spec"

interface UseProjectSpecs {
  specs: ProjectSpecSummary[]
  isLoading: boolean
  error: string | null
  reload: () => void
}

async function parseError(response: Response): Promise<string> {
  const body = await response.json().catch(() => null)
  const error =
    body && typeof body === "object"
      ? (body as Record<string, unknown>).error
      : undefined
  return typeof error === "string" ? error : "Something went wrong"
}

/**
 * Fetch the generated-spec metadata list for a project. Content is never held
 * here — the preview modal fetches each spec's Markdown on demand through the
 * download route.
 */
export function useProjectSpecs(projectId: string): UseProjectSpecs {
  const [specs, setSpecs] = useState<ProjectSpecSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  useEffect(() => {
    let cancelled = false

    async function loadSpecs() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/projects/${projectId}/specs`)
        if (!response.ok) throw new Error(await parseError(response))
        const data = (await response.json()) as { specs: ProjectSpecSummary[] }
        if (cancelled) return
        setSpecs(data.specs)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Something went wrong")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadSpecs()

    return () => {
      cancelled = true
    }
  }, [projectId, reloadKey])

  return { specs, isLoading, error, reload }
}
