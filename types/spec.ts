/** Metadata for one generated spec, as returned by `GET /api/projects/[projectId]/specs`. */
export interface ProjectSpecSummary {
  id: string
  /** Derived download filename — matches the `Content-Disposition` of the download route. */
  filename: string
  /** ISO 8601 timestamp. */
  createdAt: string
}
