The database chema is ready. Build the backend project API routes only.

## Routes

Create REST endpoints for:

- `GET /api/projects` , list current user's projects
- `POST /api/projects` , create project
- `PATCH /api/projects/[projetcId]` , rename project
- `DELETE /api/projects/[projectId]` , delete project

## Rules

Use the authenticated Clerk user IS as `ownerId`.

When creating:

- default missing project name to `Untitled Project`
- use the schema's existing ID strategy, do not add sequential IDs

Security:

- unauthenticated requests return `401`
- only the project owner can rename or delete
- non-owner mutations return `403`

Keep this backend-only. Do not wire the UI yet.

## Check When Done

- routes exist for list/create/rename/delete
- owner checks are enforces for rename/delete
- `401` and `403` responses are handled correctly
- `npm run build` passes