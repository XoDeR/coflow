import {
  SHAPE_DEFAULT_SIZES,
  type CanvasEdge,
  type CanvasNode,
  type NodeColorName,
  type NodeShape,
} from "@/types/canvas"

/**
 * A prebuilt canvas diagram a user can import to start from instead of an
 * empty canvas. Follows the same node/edge schema as user-created content
 * (see `architecture-context.md` — "Starter System Designs").
 */
export interface CanvasTemplate {
  id: string
  name: string
  description: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

/** Build a `canvasNode` at a top-left position, sized from the shape's default. */
function node(
  id: string,
  label: string,
  shape: NodeShape,
  color: NodeColorName,
  x: number,
  y: number
): CanvasNode {
  const { width, height } = SHAPE_DEFAULT_SIZES[shape]
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    width,
    height,
    data: { label, color, shape },
  }
}

/** Build a `canvasEdge` between two node ids, with an optional label. */
function edge(source: string, target: string, label = ""): CanvasEdge {
  return {
    id: `${source}--${target}`,
    source,
    target,
    type: "canvasEdge",
    data: { label },
  }
}

const microservices: CanvasTemplate = {
  id: "microservices",
  name: "Microservices",
  description:
    "An API gateway fronting independent services, each with its own datastore, plus an async message queue.",
  nodes: [
    node("client", "Client", "circle", "blue", 300, 0),
    node("gateway", "API Gateway", "hexagon", "teal", 275, 170),
    node("auth", "Auth Service", "pill", "purple", 30, 330),
    node("users", "Users Service", "pill", "green", 250, 330),
    node("orders", "Orders Service", "pill", "orange", 470, 330),
    node("users-db", "Users DB", "cylinder", "neutral", 270, 480),
    node("orders-db", "Orders DB", "cylinder", "neutral", 490, 480),
    node("queue", "Message Queue", "rectangle", "pink", 260, 640),
  ],
  edges: [
    edge("client", "gateway"),
    edge("gateway", "auth"),
    edge("gateway", "users"),
    edge("gateway", "orders"),
    edge("users", "users-db"),
    edge("orders", "orders-db"),
    edge("orders", "queue", "events"),
    edge("queue", "users", "consume"),
  ],
}

const cicdPipeline: CanvasTemplate = {
  id: "cicd-pipeline",
  name: "CI/CD Pipeline",
  description:
    "A commit-to-production delivery pipeline with build, test, manual approval, and post-deploy monitoring.",
  nodes: [
    node("commit", "Commit", "circle", "blue", 0, 200),
    node("build", "Build", "pill", "teal", 180, 218),
    node("test", "Unit Tests", "pill", "green", 400, 218),
    node("integration", "Integration Tests", "pill", "green", 620, 218),
    node("staging", "Deploy Staging", "rectangle", "orange", 850, 210),
    node("approval", "Approve?", "diamond", "purple", 1050, 150),
    node("production", "Deploy Production", "rectangle", "red", 1280, 210),
    node("monitoring", "Monitoring", "hexagon", "pink", 1285, 40),
  ],
  edges: [
    edge("commit", "build"),
    edge("build", "test"),
    edge("test", "integration", "pass"),
    edge("integration", "staging"),
    edge("staging", "approval"),
    edge("approval", "production", "promote"),
    edge("production", "monitoring"),
    edge("monitoring", "commit", "alerts"),
  ],
}

const eventDriven: CanvasTemplate = {
  id: "event-driven",
  name: "Event-Driven System",
  description:
    "A producer publishing to a central event bus that fans out to independent consumers, with an event store and dead-letter queue.",
  nodes: [
    node("producer", "Producer Service", "pill", "blue", 0, 210),
    node("bus", "Event Bus", "rectangle", "teal", 280, 200),
    node("order-processor", "Order Processor", "pill", "green", 560, 40),
    node("notifier", "Notification Service", "pill", "orange", 560, 210),
    node("analytics", "Analytics Service", "pill", "purple", 560, 380),
    node("event-store", "Event Store", "cylinder", "neutral", 300, 380),
    node("dlq", "Dead Letter Queue", "cylinder", "red", 830, 40),
  ],
  edges: [
    edge("producer", "bus", "publish"),
    edge("bus", "order-processor"),
    edge("bus", "notifier"),
    edge("bus", "analytics"),
    edge("bus", "event-store", "persist"),
    edge("order-processor", "dlq", "on failure"),
  ],
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  microservices,
  cicdPipeline,
  eventDriven,
]
