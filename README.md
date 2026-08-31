# CoFlow

Real-time collaborative system design workspace. Describe a system in plain English, let an AI agent lay it out on a shared canvas, refine the architecture together, and generate a Markdown technical spec from the resulting graph.

![AI-generated architecture on the canvas](screenshots/ai-generated-schema.png)

## What it does

1. Sign in and create or open an architecture project.
2. Optionally import a prebuilt starter design (monolith, microservices, event-driven, serverless, …).
3. Prompt the AI to generate or extend the design — nodes and edges are written straight into the shared canvas.
4. Collaborate live: multiple users edit the same canvas with cursors and presence.
5. Generate a technical spec from the current graph and view or download it as Markdown.

![Generated spec panel](screenshots/ai-generated-spec.png)

## How it's built

| Layer            | Technology              | Role                                                      |
| ---------------- | ----------------------- | -------------------------------------------------------- |
| Framework        | Next.js 16 + TypeScript | Full-stack app, server/client boundaries, API handlers   |
| UI               | Tailwind + shadcn/ui    | Component composition and styling                        |
| Auth             | Clerk                   | User identity and route protection                       |
| Database         | Prisma + PostgreSQL     | Projects, collaborators, specs, and task-run metadata    |
| Canvas           | Liveblocks + React Flow | Real-time collaborative canvas, presence, and cursors    |
| AI               | Google Gemini (`@ai-sdk/google`) | Interprets prompts into canvas nodes/edges and specs |
| Background tasks | Trigger.dev             | Durable AI design- and spec-generation workflows         |
| Artifact storage | Vercel Blob             | Canvas snapshots and generated Markdown specs            |

### Architecture

- **`app/api`** — authenticated request handlers: input validation, ownership checks, task triggering, persistence.
- **`trigger`** — long-running background jobs. AI design generation (`trigger/design-agent.ts`) uses Gemini to interpret the prompt and writes structured node/edge updates into the shared Liveblocks room through the same flow storage the editor uses. Spec generation converts the canvas graph into Markdown.
- **`lib`** — shared infrastructure: Prisma client, access-control helpers, utilities.
- **`components`** — canvas surfaces, sidebars, dialogs, and interactive elements.
- **`prisma`** — database schema and generated client.

### Storage model

- PostgreSQL holds metadata, ownership, relationships, and task-run records.
- Vercel Blob holds the generated artifacts: canvas snapshots at `canvas/{projectId}.json` and specs at `specs/{projectId}/{specId}.md`. The blob URL is stored in the database as the reference.

### Auth and collaboration

- Every project has a single owner (Clerk user ID) plus optional collaborators.
- Only authenticated users reach protected routes; only the owner or a collaborator can mutate project resources.
- Liveblocks room tokens are issued only after verifying project membership.

## Getting started

```bash
npm install
npx prisma migrate deploy   # apply the database schema
```

Then run **both** processes side by side:

```bash
npm run dev                  # Next.js app on http://localhost:3000
npx trigger.dev@latest dev   # Trigger.dev worker — required for any AI call
```

AI design and spec generation run entirely inside Trigger.dev tasks, so without the worker running the app loads but no AI generation happens.

### Environment

| Variable | Used by |
| --- | --- |
| `DATABASE_URL` | Prisma / PostgreSQL |
| Clerk keys (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) | Auth |
| `LIVEBLOCKS_SECRET_KEY` | Realtime canvas + Trigger.dev tasks |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob artifact storage |
| `TRIGGER_SECRET_KEY` | Trigger.dev background tasks |
| `GOOGLE_AI_API_KEY` | AI generation — must be available to the Trigger.dev worker |

## Deployment

Deployed on Vercel; the build runs `prisma generate && next build`. Trigger.dev tasks are deployed separately with `npx trigger.dev@latest deploy`.

![Deployed on Vercel](screenshots/deployed-on-vercel.png)
