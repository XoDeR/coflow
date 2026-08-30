import { prisma } from "@/lib/prisma"
import { uploadSpecMarkdown } from "@/lib/spec-storage"
import type { ProjectSpec } from "@/app/generated/prisma/client"

/**
 * Persist a generated Markdown spec: create the metadata record, upload the
 * Markdown to Vercel Blob under the record's id, then store the blob URL in
 * `ProjectSpec.filePath`. Mirrors the canvas persistence pattern — Prisma holds
 * metadata only, the content lives in Blob.
 */
export async function saveGeneratedSpec(
  projectId: string,
  markdown: string
): Promise<ProjectSpec> {
  const record = await prisma.projectSpec.create({
    data: { projectId, filePath: "" },
  })

  const filePath = await uploadSpecMarkdown(projectId, record.id, markdown)

  return prisma.projectSpec.update({
    where: { id: record.id },
    data: { filePath },
  })
}
