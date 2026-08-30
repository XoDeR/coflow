"use client"

import type { ComponentPropsWithoutRef } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"

/**
 * Renders a Markdown string with the workspace's dark tokens. No typography
 * plugin is installed, so element styles are mapped explicitly. Used by the
 * spec preview modal.
 */
const COMPONENTS: Components = {
  h1: (props) => (
    <h1
      className="mt-6 mb-3 text-lg font-semibold text-copy-primary first:mt-0"
      {...props}
    />
  ),
  h2: (props) => (
    <h2
      className="mt-6 mb-2 text-base font-semibold text-copy-primary first:mt-0"
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className="mt-4 mb-2 text-sm font-semibold text-copy-primary first:mt-0"
      {...props}
    />
  ),
  p: (props) => <p className="my-2 leading-relaxed text-copy-secondary" {...props} />,
  ul: (props) => (
    <ul className="my-2 list-disc space-y-1 pl-5 text-copy-secondary" {...props} />
  ),
  ol: (props) => (
    <ol className="my-2 list-decimal space-y-1 pl-5 text-copy-secondary" {...props} />
  ),
  li: (props) => <li className="leading-relaxed" {...props} />,
  a: (props) => (
    <a
      className="text-brand underline underline-offset-2"
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  strong: (props) => (
    <strong className="font-semibold text-copy-primary" {...props} />
  ),
  em: (props) => <em className="italic" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="my-3 border-l-2 border-surface-border pl-3 text-copy-muted"
      {...props}
    />
  ),
  hr: () => <hr className="my-4 border-surface-border" />,
  code: ({ className, ...props }: ComponentPropsWithoutRef<"code">) => {
    const isBlock = /language-/.test(className ?? "")
    return (
      <code
        className={
          isBlock
            ? "font-mono text-xs text-copy-secondary"
            : "rounded bg-subtle px-1 py-0.5 font-mono text-[0.8em] text-copy-primary"
        }
        {...props}
      />
    )
  },
  pre: (props) => (
    <pre
      className="my-3 overflow-x-auto rounded-xl border border-surface-border bg-elevated p-3 text-xs"
      {...props}
    />
  ),
  table: (props) => (
    <div className="my-3 overflow-x-auto">
      <table
        className="w-full border-collapse text-left text-xs text-copy-secondary"
        {...props}
      />
    </div>
  ),
  th: (props) => (
    <th
      className="border border-surface-border bg-elevated px-2 py-1 font-medium text-copy-primary"
      {...props}
    />
  ),
  td: (props) => (
    <td className="border border-surface-border px-2 py-1" {...props} />
  ),
}

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
