import { NODE_COLORS, SHAPE_DEFAULT_SIZES, type CanvasNode } from "@/types/canvas"
import type { CanvasTemplate } from "@/components/editor/starter-templates"

const VIEWPORT = { width: 280, height: 150 }
const PADDING = 12

interface Placed {
  node: CanvasNode
  x: number
  y: number
  width: number
  height: number
  cx: number
  cy: number
}

function nodeSize(node: CanvasNode) {
  const fallback = SHAPE_DEFAULT_SIZES[node.data.shape]
  return {
    width: node.width ?? fallback.width,
    height: node.height ?? fallback.height,
  }
}

/** Fit every template node into the fixed viewport and return screen-space geometry. */
function placeNodes(template: CanvasTemplate): Placed[] {
  const boxes = template.nodes.map((node) => {
    const { width, height } = nodeSize(node)
    return { node, x: node.position.x, y: node.position.y, width, height }
  })

  const minX = Math.min(...boxes.map((b) => b.x))
  const minY = Math.min(...boxes.map((b) => b.y))
  const maxX = Math.max(...boxes.map((b) => b.x + b.width))
  const maxY = Math.max(...boxes.map((b) => b.y + b.height))

  const contentW = Math.max(maxX - minX, 1)
  const contentH = Math.max(maxY - minY, 1)
  const availW = VIEWPORT.width - PADDING * 2
  const availH = VIEWPORT.height - PADDING * 2
  const scale = Math.min(availW / contentW, availH / contentH)

  const offsetX = PADDING + (availW - contentW * scale) / 2
  const offsetY = PADDING + (availH - contentH * scale) / 2

  return boxes.map((b) => {
    const x = offsetX + (b.x - minX) * scale
    const y = offsetY + (b.y - minY) * scale
    const width = b.width * scale
    const height = b.height * scale
    return { node: b.node, x, y, width, height, cx: x + width / 2, cy: y + height / 2 }
  })
}

function PreviewShape({ placed }: { placed: Placed }) {
  const { x, y, width, height, cx, cy } = placed
  const { fill, text } = NODE_COLORS[placed.node.data.color]
  const common = { fill, stroke: text, strokeWidth: 1 }

  switch (placed.node.data.shape) {
    case "circle":
      return <ellipse cx={cx} cy={cy} rx={width / 2} ry={height / 2} {...common} />
    case "pill":
      return <rect x={x} y={y} width={width} height={height} rx={height / 2} {...common} />
    case "diamond":
      return (
        <polygon
          points={`${cx},${y} ${x + width},${cy} ${cx},${y + height} ${x},${cy}`}
          {...common}
        />
      )
    case "hexagon": {
      const cut = width * 0.2
      return (
        <polygon
          points={`${x + cut},${y} ${x + width - cut},${y} ${x + width},${cy} ${x + width - cut},${y + height} ${x + cut},${y + height} ${x},${cy}`}
          {...common}
        />
      )
    }
    case "cylinder": {
      const ry = Math.min(height * 0.18, height / 2)
      const rx = width / 2
      return (
        <>
          <path
            d={`M${x},${y + ry} L${x},${y + height - ry} A${rx},${ry} 0 0 0 ${x + width},${y + height - ry} L${x + width},${y + ry} A${rx},${ry} 0 0 0 ${x},${y + ry} Z`}
            {...common}
          />
          <path
            d={`M${x},${y + ry} A${rx},${ry} 0 0 0 ${x + width},${y + ry}`}
            fill="none"
            stroke={text}
            strokeWidth={1}
          />
        </>
      )
    }
    default:
      return <rect x={x} y={y} width={width} height={height} rx={3} {...common} />
  }
}

/**
 * Lightweight static diagram preview for a starter template — plain SVG, no
 * React Flow instance. Edges are straight lines between node centers; nodes
 * use their own shape and color data.
 */
export function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const placed = placeNodes(template)
  const byId = new Map(placed.map((p) => [p.node.id, p]))

  return (
    <svg
      viewBox={`0 0 ${VIEWPORT.width} ${VIEWPORT.height}`}
      className="h-full w-full"
      role="img"
      aria-label={`${template.name} diagram preview`}
    >
      {template.edges.map((edgeItem) => {
        const source = byId.get(edgeItem.source)
        const target = byId.get(edgeItem.target)
        if (!source || !target) return null
        return (
          <line
            key={edgeItem.id}
            x1={source.cx}
            y1={source.cy}
            x2={target.cx}
            y2={target.cy}
            stroke="var(--text-muted)"
            strokeWidth={1}
          />
        )
      })}
      {placed.map((p) => (
        <PreviewShape key={p.node.id} placed={p} />
      ))}
    </svg>
  )
}
