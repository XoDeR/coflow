"use client"

import { useStore } from "@xyflow/react"
import { shallow, useOthers } from "@liveblocks/react/suspense"

/**
 * Live cursors for other room participants, rendered as an overlay on top of the
 * React Flow pane. `useOthers` never includes the current user, so their own
 * cursor is never drawn. Positions are stored in flow coordinates and projected
 * back to screen space with the current viewport transform so cursors stay
 * anchored to the canvas while panning and zooming.
 */
export function CanvasCursors() {
  const [offsetX, offsetY, zoom] = useStore((state) => state.transform)

  const cursors = useOthers(
    (others) =>
      others.map((other) => ({
        connectionId: other.connectionId,
        cursor: other.presence.cursor,
        name: other.info.name,
        color: other.info.color,
      })),
    shallow
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {cursors.map((other) =>
        other.cursor ? (
          <Cursor
            key={other.connectionId}
            x={other.cursor.x * zoom + offsetX}
            y={other.cursor.y * zoom + offsetY}
            name={other.name}
            color={other.color}
          />
        ) : null
      )}
    </div>
  )
}

interface CursorProps {
  x: number
  y: number
  name: string
  color: string
}

function Cursor({ x, y, name, color }: CursorProps) {
  return (
    <div
      className="absolute top-0 left-0 select-none"
      style={{ transform: `translate(${x}px, ${y}px)` }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M3 2.5 15.5 9 9.5 10.5 7 16.5Z"
          fill={color}
          stroke="var(--bg-base)"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="absolute top-4 left-4 rounded-md px-1.5 py-0.5 text-[0.7rem] font-medium whitespace-nowrap"
        style={{ backgroundColor: color, color: "var(--bg-base)" }}
      >
        {name}
      </span>
    </div>
  )
}
