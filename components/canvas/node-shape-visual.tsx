import type { NodeShape } from "@/types/canvas"

const CSS_SHAPE_RADIUS: Partial<Record<NodeShape, string>> = {
  rectangle: "0.75rem",
  pill: "9999px",
  circle: "9999px",
}

function isSvgShape(shape: NodeShape): shape is "diamond" | "hexagon" | "cylinder" {
  return shape === "diamond" || shape === "hexagon" || shape === "cylinder"
}

function hexagonPoints(width: number, height: number) {
  const cut = width * 0.2
  return `${cut},0 ${width - cut},0 ${width},${height / 2} ${width - cut},${height} ${cut},${height} 0,${height / 2}`
}

interface CylinderPathsProps {
  width: number
  height: number
  fill: string
  stroke: string
}

function CylinderPaths({ width, height, fill, stroke }: CylinderPathsProps) {
  const rx = width / 2
  const ry = Math.min(height * 0.16, height / 2)
  const body = `M0,${ry} L0,${height - ry} A${rx},${ry} 0 0 0 ${width},${height - ry} L${width},${ry} A${rx},${ry} 0 0 0 0,${ry} Z`
  const lid = `M0,${ry} A${rx},${ry} 0 0 0 ${width},${ry}`
  return (
    <>
      <path d={body} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <path d={lid} fill="none" stroke={stroke} strokeWidth={1.5} />
    </>
  )
}

export interface NodeShapeVisualProps {
  shape: NodeShape
  width: number
  height: number
  fill: string
  stroke: string
}

/** Renders the shape background for a canvas node: CSS-styled for rectangle/pill/circle, inline SVG (scaled to width/height) for diamond/hexagon/cylinder. */
export function NodeShapeVisual({ shape, width, height, fill, stroke }: NodeShapeVisualProps) {
  if (!isSvgShape(shape)) {
    return (
      <div
        className="absolute inset-0 border"
        style={{ backgroundColor: fill, borderColor: stroke, borderRadius: CSS_SHAPE_RADIUS[shape] }}
      />
    )
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
      {shape === "diamond" && (
        <polygon
          points={`${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}`}
          fill={fill}
          stroke={stroke}
          strokeWidth={1.5}
        />
      )}
      {shape === "hexagon" && (
        <polygon points={hexagonPoints(width, height)} fill={fill} stroke={stroke} strokeWidth={1.5} />
      )}
      {shape === "cylinder" && <CylinderPaths width={width} height={height} fill={fill} stroke={stroke} />}
    </svg>
  )
}
