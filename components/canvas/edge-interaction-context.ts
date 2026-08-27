"use client"

import { createContext, useContext } from "react"

export interface EdgeInteractionContextValue {
  /** Id of the edge currently hovered (via React Flow's `onEdgeMouseEnter`), or `null`. */
  hoveredEdgeId: string | null
  /** Id of the edge whose label is being edited inline, or `null`. */
  editingEdgeId: string | null
  setEditingEdgeId: (id: string | null) => void
}

export const EdgeInteractionContext = createContext<EdgeInteractionContextValue>({
  hoveredEdgeId: null,
  editingEdgeId: null,
  setEditingEdgeId: () => {},
})

export function useEdgeInteraction(): EdgeInteractionContextValue {
  return useContext(EdgeInteractionContext)
}
