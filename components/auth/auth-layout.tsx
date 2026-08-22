import type { ReactNode } from "react"

const FEATURES = [
  "Describe a system in plain English and generate an architecture",
  "Refine the design together on a shared real-time canvas",
  "Convert the finished graph into a written technical spec",
]

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh lg:flex-row flex-col">
      <div className="hidden flex-1 flex-col justify-center gap-8 border-r border-surface-border px-16 lg:flex">
        <span className="text-lg font-semibold tracking-tight text-copy-primary">
          Coflow
        </span>
        <p className="max-w-sm text-copy-secondary">
          A real-time collaborative workspace for designing system
          architecture.
        </p>
        <ul className="flex max-w-sm flex-col gap-3 text-sm text-copy-muted">
          {FEATURES.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </div>
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        {children}
      </div>
    </div>
  )
}
