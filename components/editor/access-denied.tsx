import { Lock } from "lucide-react"
import Link from "next/link"

export function AccessDenied() {
  return (
    <div className="flex h-svh flex-col items-center justify-center gap-3 bg-base px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-subtle">
        <Lock className="h-5 w-5 text-copy-muted" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-copy-primary">
          You don&apos;t have access to this project
        </p>
        <p className="text-sm text-copy-muted">
          Ask the owner to share it with you, or go back to your projects.
        </p>
      </div>
      <Link href="/editor" className="text-sm text-brand hover:underline">
        Back to Editor
      </Link>
    </div>
  )
}
