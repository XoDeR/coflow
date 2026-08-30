import { get, put } from "@vercel/blob"

/**
 * Blob storage for generated Markdown specs. Prisma keeps only the returned URL
 * as a reference (`ProjectSpec.filePath`); the Markdown payload lives in Vercel
 * Blob — the same metadata + blob split used for canvas snapshots
 * (`lib/canvas-storage.ts`).
 *
 * The store is configured for private access, so specs are written with
 * `access: "private"` and read back through the SDK's `get` (which attaches the
 * store token) rather than a plain `fetch` on the URL.
 */

const specBlobPath = (projectId: string, specId: string) =>
  `specs/${projectId}/${specId}.md`

/**
 * Upload the Markdown for one generated spec and return its blob URL. Each spec
 * record has its own id, so the pathname is unique per spec and never
 * overwritten.
 */
export async function uploadSpecMarkdown(
  projectId: string,
  specId: string,
  markdown: string
): Promise<string> {
  const blob = await put(specBlobPath(projectId, specId), markdown, {
    access: "private",
    contentType: "text/markdown",
    cacheControlMaxAge: 60,
  })

  return blob.url
}

/** Fetch a previously saved spec's Markdown from its blob URL, or `null`. */
export async function fetchSpecMarkdown(blobUrl: string): Promise<string | null> {
  try {
    const result = await get(blobUrl, { access: "private", useCache: false })
    if (!result || result.statusCode !== 200) return null

    return await new Response(result.stream).text()
  } catch {
    return null
  }
}
