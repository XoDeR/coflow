/**
 * Trigger a browser download for a same-origin URL by clicking a transient
 * anchor. The server sets `Content-Disposition: attachment`, so the browser
 * handles the save; the `download` hint just supplies a default filename.
 */
export function downloadUrl(url: string, filename: string): void {
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.rel = "noopener"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}
