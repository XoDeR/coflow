import { FileText, Sparkles, Users } from "lucide-react"
import type { ReactNode } from "react"

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI architecture generation",
    description: "Describe your system, AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Users,
    title: "Real-time collaboration",
    description: "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: FileText,
    title: "Instant spec generation",
    description: "Export a complete Markdown technical spec directly from the canvas graph.",
  },
]

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col lg:flex-row">
      <div className="relative hidden flex-1 overflow-hidden border-r border-surface-border bg-surface lg:block">
        <div className="absolute inset-0 bg-accent-dim" />
        <div className="relative flex h-full flex-col justify-center gap-10 px-16">
          <div className="flex items-center gap-2.5">
            <span className="h-7 w-7 rounded-md bg-brand" />
            <span className="text-lg font-semibold tracking-tight text-copy-primary">
              Coflow
            </span>
          </div>
          <div className="flex max-w-md flex-col gap-4">
            <h1 className="text-4xl font-semibold tracking-tight text-copy-primary">
              Design systems at the speed of thought.
            </h1>
            <p className="text-copy-secondary">
              Describe your architecture in plain English. Coflow maps it to
              a shared canvas your whole team can refine in real time.
            </p>
          </div>
          <ul className="flex max-w-md flex-col gap-5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-subtle text-brand">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-copy-primary">
                    {title}
                  </span>
                  <span className="text-sm text-copy-muted">
                    {description}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center bg-base px-6 py-12">
        {children}
      </div>
    </div>
  )
}
