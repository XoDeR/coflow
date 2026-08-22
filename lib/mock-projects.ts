import type { Project } from "@/types/project"

export const MOCK_PROJECTS: Project[] = [
  {
    id: "1",
    name: "Checkout Service Redesign",
    slug: "checkout-service-redesign",
    isOwner: true,
  },
  {
    id: "2",
    name: "Notification Pipeline",
    slug: "notification-pipeline",
    isOwner: true,
  },
  {
    id: "3",
    name: "Payments Platform Migration",
    slug: "payments-platform-migration",
    isOwner: false,
  },
]
