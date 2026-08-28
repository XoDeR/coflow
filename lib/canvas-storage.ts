import { get, put } from "@vercel/blob"

import type { CanvasSnapshot } from "@/types/canvas"

/**
 * Blob storage for canvas snapshots. Prisma keeps only the returned URL as a
 * reference (`Project.canvasJsonPath`); the JSON payload lives in Vercel Blob.
 *
 * The store is configured for private access, so snapshots are written with
 * `access: "private"` and read back through the SDK's `get` (which attaches the
 * store token) rather than a plain `fetch` on the URL.
 */

const canvasBlobPath = (projectId: string) => `canvas/${projectId}.json`

/**
 * Upload the latest canvas JSON for a project and return its blob URL. The
 * pathname is stable per project, so repeated saves overwrite the same object.
 */
export async function uploadCanvasSnapshot(
  projectId: string,
  snapshot: CanvasSnapshot
): Promise<string> {
  const blob = await put(canvasBlobPath(projectId), JSON.stringify(snapshot), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  })

  return blob.url
}

/** Fetch and validate a previously saved canvas snapshot from its blob URL. */
export async function fetchCanvasSnapshot(blobUrl: string): Promise<CanvasSnapshot | null> {
  try {
    const result = await get(blobUrl, { access: "private", useCache: false })
    if (!result || result.statusCode !== 200) return null

    const data = (await new Response(result.stream).json().catch(() => null)) as unknown
    return parseCanvasSnapshot(data)
  } catch {
    return null
  }
}

/** Narrow untrusted input to a `CanvasSnapshot` before it is trusted anywhere. */
export function parseCanvasSnapshot(input: unknown): CanvasSnapshot | null {
  if (!input || typeof input !== "object") return null

  const { nodes, edges } = input as Record<string, unknown>
  if (!Array.isArray(nodes) || !Array.isArray(edges)) return null

  return {
    nodes: nodes as CanvasSnapshot["nodes"],
    edges: edges as CanvasSnapshot["edges"],
  }
}
