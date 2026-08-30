"use client"

import { useMemo } from "react"
import { useStorage } from "@liveblocks/react"

/** A canvas node projected down to what spec generation needs. */
export interface CanvasGraphNode {
  id: string
  position?: { x: number; y: number }
  data?: { label?: string; shape?: string; color?: string }
}

/** A canvas edge projected down to what spec generation needs. */
export interface CanvasGraphEdge {
  id: string
  source: string
  target: string
}

export interface CanvasGraph {
  nodes: CanvasGraphNode[]
  edges: CanvasGraphEdge[]
}

/**
 * Runtime shape of the `flow` Storage entry as `useStorage` exposes it. It runs
 * the selector against `root.toJSON()`, and `LiveMap.toJSON()` produces a plain
 * `Record<id, value>` (not a `Map`). Typed locally because the library's own
 * `ToImmutable<LiveblocksFlow>` type is too deep for the compiler here.
 */
interface FlowStorage {
  nodes: Record<string, RawFlowNode>
  edges: Record<string, RawFlowEdge>
}

interface RawFlowNode {
  id: string
  position?: { x: number; y: number }
  data?: { label?: string; shape?: string; color?: string }
}

interface RawFlowEdge {
  id: string
  source: string
  target: string
}

/**
 * Read the current canvas graph (nodes + edges) from the room's `flow` Storage
 * entry — the same entry `useLiveblocksFlow` syncs on the canvas side. Non-suspense
 * `useStorage` so the AI sidebar needn't sit inside a Suspense boundary; returns
 * an empty graph until Storage loads.
 */
export function useCanvasGraph(): CanvasGraph {
  const flow = useStorage((root) => root.flow ?? null) as FlowStorage | null

  return useMemo<CanvasGraph>(() => {
    if (!flow) return { nodes: [], edges: [] }

    const nodes = Object.values(flow.nodes ?? {}).map((node) => ({
      id: node.id,
      position: node.position
        ? { x: node.position.x, y: node.position.y }
        : undefined,
      data: node.data
        ? {
            label: node.data.label,
            shape: node.data.shape,
            color: node.data.color,
          }
        : undefined,
    }))

    const edges = Object.values(flow.edges ?? {}).map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    }))

    return { nodes, edges }
  }, [flow])
}
