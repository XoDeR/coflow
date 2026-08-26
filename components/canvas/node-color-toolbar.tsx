"use client"

import type { MouseEvent } from "react"

import { NODE_COLORS, type NodeColorName } from "@/types/canvas"

interface NodeColorToolbarProps {
  activeColor: NodeColorName
  onSelectColor: (color: NodeColorName) => void
}

export function NodeColorToolbar({ activeColor, onSelectColor }: NodeColorToolbarProps) {
  const stopPropagation = (event: MouseEvent) => event.stopPropagation()

  return (
    <div
      className="nodrag nopan absolute bottom-full left-1/2 z-10 mb-2 flex -translate-x-1/2 items-center gap-1.5 rounded-xl border border-surface-border bg-elevated px-2 py-1.5 shadow-lg"
      onMouseDown={stopPropagation}
      onClick={stopPropagation}
    >
      {Object.entries(NODE_COLORS).map(([name, color]) => {
        const colorName = name as NodeColorName
        const isActive = colorName === activeColor

        return (
          <button
            key={name}
            type="button"
            aria-label={`Set node color to ${name}`}
            aria-pressed={isActive}
            className="nodrag h-5 w-5 shrink-0 rounded-full border transition-shadow duration-150 hover:shadow-[0_0_6px_var(--glow-color)]"
            style={{
              backgroundColor: color.fill,
              borderColor: isActive ? color.text : "var(--border-subtle)",
              boxShadow: isActive
                ? `0 0 0 2px var(--bg-elevated), 0 0 0 3.5px ${color.text}`
                : undefined,
              ["--glow-color" as string]: color.text,
            }}
            onClick={(event) => {
              event.stopPropagation()
              onSelectColor(colorName)
            }}
          />
        )
      })}
    </div>
  )
}
