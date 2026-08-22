# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Project dialogs (`context/feature-specs/04-project-dialogs.md`) — complete

## Current Goal

- Define the immediate implementation goal here.

## Completed

- `01-design-system`: shadcn/ui installed and configured (`components.json`, style `base-nova`, icon library `lucide`). Added Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea to `components/ui/` (unmodified, generated as-is). Installed `lucide-react`. Added `lib/utils.ts` with `cn()` (clsx + tailwind-merge). Rebuilt `app/globals.css` with the dark-only palette from `context/ui-context.md` (`--bg-*`, `--border-*`, `--text-*`, `--accent-*`, `--state-*`) mapped both to shadcn's semantic tokens (`--background`, `--card`, `--primary`, etc.) and to app-level Tailwind utilities (`bg-base`, `bg-surface`, `text-copy-primary`, `border-surface-border`, `text-brand`, `bg-accent-dim`, etc.) via `@theme inline`. Added `dark` class permanently to `<html>` in `app/layout.tsx` (no light mode, but shadcn components use `dark:` refinement classes internally so the variant must stay active). Verified: `tsc --noEmit` passes, all seven components import and compose without errors, `cn()` merges classes correctly, `next build` completes successfully.
- `02-editor`: `components/editor/editor-navbar.tsx` — fixed-height (`h-14`) top navbar, left/center/right flex sections, left section holds the sidebar toggle (`Button` `variant="ghost" size="icon-sm"`) swapping `PanelLeftOpen`/`PanelLeftClose` (lucide-react) based on the `isSidebarOpen` prop, right section left empty per spec, `bg-surface` background with `border-surface-border` bottom border. Client component (`"use client"`) since it takes an `onToggleSidebar` handler; state ownership left to the future parent layout.
- `02-editor`: `components/editor/project-sidebar.tsx` — floating overlay (`fixed`, not part of page flow, so opening it does not push content), slides in/out via a `translate-x` transition driven by the `isOpen` prop (`aria-hidden` + `pointer-events-none` when closed), header with "Projects" title and a close button (`onClose` prop), shadcn `Tabs` with "My Projects" and "Shared" triggers, each `TabsContent` showing a centered muted empty-state placeholder, fill-width "New Project" `Button` with a `Plus` icon pinned to the bottom above `border-surface-border`.
- `02-editor`: Dialog pattern requirement satisfied without new files — `components/ui/dialog.tsx` (shadcn, left untouched per the protected-foundation rule) already exposes `DialogTitle` / `DialogDescription` / `DialogFooter` and already styles from app tokens (`bg-popover` → `--bg-elevated`, `text-popover-foreground` → `--text-primary`, `rounded-xl`), so it's ready for real dialogs to be built on top of it later.
- `02-editor`: Verified `tsc --noEmit`, `eslint` on the new files, and `next build` all pass with no errors.
- `03-auth`: Installed `@clerk/ui` (spec dependency). Added `proxy.ts` at the project root (this Next.js version renamed `middleware.ts` → `proxy.ts`) using `clerkMiddleware` + `createRouteMatcher`; public routes are `/`, and the sign-in/sign-up path patterns built from `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL` — everything else calls `auth.protect()`. `/` stays public in the proxy (not protected) because `app/page.tsx` itself branches on auth state (see below); protecting it there would make the unauthenticated branch unreachable.
- `03-auth`: `lib/clerk-appearance.ts` — shared `appearance` config for `ClerkProvider`: `theme: dark` from `@clerk/ui/themes`, `variables` mapped entirely to the app's existing CSS custom properties (`colorPrimary` → `--accent-primary`, `colorBackground` → `--bg-elevated`, `colorDanger` → `--state-error`, `fontFamily` → `--font-geist-sans`, `borderRadius` → `--radius`, etc.) — no hardcoded colors, per `ui-context.md`.
- `03-auth`: `app/layout.tsx` wraps `<html>` with `ClerkProvider appearance={clerkAppearance}`.
- `03-auth`: `components/auth/auth-layout.tsx` — two-panel auth shell. Left panel (`hidden lg:flex`) holds a compact "Coflow" wordmark, one-line tagline, and a text-only feature list; right panel centers the Clerk form. No gradients, hero sections, feature cards, or scroll (`min-h-svh`). Below `lg`, only the form column renders.
- `03-auth`: `app/sign-in/[[...sign-in]]/page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx` — Clerk catch-all routes (required so `<SignIn />`/`<SignUp />` can infer path-based routing), each wrapped in `AuthLayout`.
- `03-auth`: `app/page.tsx` — server component, `await auth()` from `@clerk/nextjs/server`, redirects to `/editor` if signed in, `/sign-in` otherwise.
- `03-auth`: `components/editor/editor-navbar.tsx` — added Clerk's `<UserButton />` to the right nav section (previously empty); left as a default, unstyled Clerk component per the "don't rebuild Clerk internals" rule.
- `03-auth`: Added `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` to `.env.local` and `.example.env.local` — these are Clerk's own conventional env var names (not invented), and `proxy.ts` reads them to build the public-route matcher instead of hardcoding the paths twice.
- `03-auth`: Verified `tsc --noEmit`, `eslint`, and `next build` all pass. `next build` output confirms `proxy.ts` is picked up (`ƒ Proxy (Middleware)`) and both auth routes compile. Manually verified via `npm run dev`: `GET /` returns `307` (redirect to `/sign-in`) when signed out, `GET /sign-in` returns `200` and its HTML contains the "Coflow" wordmark, the tagline text, and Clerk's rendered form markup.
- `03-auth` (revision): Reworked `components/auth/auth-layout.tsx` to an even 50/50 split (`flex-1` both sides) after user feedback referencing a competitor screenshot. Left panel now gets `bg-surface` with a flat `bg-accent-dim` wash layered on top (absolutely-positioned overlay, content in a `relative` layer above it) so it reads as a distinct panel against the `bg-base` right side — both are existing tokens, no hardcoded hex, no gradient (gradients stay disallowed per the original spec). Added a solid `bg-brand` square as a compact logo mark, a large `text-4xl` heading, a one-line subhead, and a 3-item feature list (`Sparkles`/`Users`/`FileText` from `lucide-react`, each in a small `bg-subtle` icon square — not a bordered/elevated card, so this still respects "no feature cards"). Headline/body font stays Geist Sans throughout (`font-sans` inherited from `<html>`) rather than the serif display font shown in the reference screenshot, since `ui-context.md` only defines Geist Sans/Geist Mono. Re-verified `tsc --noEmit`, `eslint`, `next build`, and rendered HTML content via `curl` after this change.
- `02-editor`: `app/editor/page.tsx` — client component wiring the existing `EditorNavbar` and `ProjectSidebar` with real `isSidebarOpen` state (`useState`, default closed). Full-viewport column (`h-svh flex flex-col`): navbar on top, then a `relative flex-1 overflow-hidden` row containing the floating `ProjectSidebar` overlay and a centered `main` placeholder ("Canvas coming soon") standing in for the future React Flow canvas. No AI sidebar yet — that component doesn't exist in the codebase yet, so it's left out of scope rather than stubbed. Verified `tsc --noEmit`, `eslint`, and `next build` all pass; build output confirms `/editor` compiles as a static route, resolving the post-sign-in redirect 404.
- `04-project-dialogs`: `types/project.ts` (`Project` interface: `id`, `name`, `slug`, `isOwner`) and `lib/mock-projects.ts` (3 mock projects, 2 owned / 1 shared) — the mock data source; no API/db involved per spec. `lib/utils.ts` gained `slugify()` (lowercase, non-alphanumeric runs → single hyphen, trimmed).
- `04-project-dialogs`: `hooks/use-project-dialogs.ts` — the dedicated hook required by the spec. Owns the mock `projects` array (in-memory only — create/rename/delete mutate local state, nothing persists across reload, matching "no API calls or persistence"), a single `dialog` discriminated-union state (`{type:"create"}` / `{type:"rename", project}` / `{type:"delete", project}` / `null` — only one dialog open at a time by construction), the shared `name` form field, a derived `slug` (`useMemo(slugify(name))`) for the live preview, and `isLoading` toggled around a `MOCK_DELAY_MS` (400ms) `setTimeout` in each submit handler to simulate async without a real request.
- `04-project-dialogs`: `components/editor/create-project-dialog.tsx`, `rename-project-dialog.tsx`, `delete-project-dialog.tsx` — built on the untouched `components/ui/dialog.tsx` primitives (not modified, per the protected-foundation rule). Create: name input + live `/{slug}` preview text under it. Rename: prefilled/auto-focused input, current name in the description, submitting via `<form onSubmit>` so Enter submits. Delete: no input, `variant="destructive"` confirm button, explicit Cancel.
- `04-project-dialogs`: `components/editor/editor-home.tsx` — the `/editor` center content (heading, description, `New Project` button with a `Plus` icon), not wrapped in a card, per spec. `components/editor/project-sidebar.tsx` rewritten to accept `projects`/`onCreateProject`/`onRenameProject`/`onDeleteProject`; renders My Projects (`isOwner: true`) and Shared (`isOwner: false`) lists from the same array — rename/delete icon buttons (`Pencil`/`Trash2`, `opacity-0 group-hover:opacity-100`) only render on the owned-projects list, never on Shared. Added a `md:hidden` backdrop scrim (`fixed inset-0 bg-black/50`, click-to-close) so mobile taps outside the sidebar close it; desktop is unaffected (no backdrop rendered above `md`).
- `04-project-dialogs`: `app/editor/page.tsx` now calls `useProjectDialogs()` once and wires it in both directions — `EditorHome`'s `New Project` and `ProjectSidebar`'s `New Project` both call the same `openCreateDialog`, sidebar rename/delete icons call `openRenameDialog`/`openDeleteDialog`, and the three dialog components render at the page level keyed off `dialog?.type`.
- `04-project-dialogs`: Verified `tsc --noEmit`, `eslint`, and `next build` all pass with no errors. Manual click-through of `/editor` wasn't possible — Clerk's `proxy.ts` redirects unauthenticated requests to `/sign-in` before the page renders (confirmed via `curl`, same behavior as before this change) — so correctness rests on the type check + build + code review rather than a live click-through.

## In Progress

- None.

## Next Up

- Build the right-hand slide-over AI sidebar referenced in `ui-context.md`'s layout patterns (no component exists yet).
- Wire real project creation/rename/delete to the database (Prisma) and remove `lib/mock-projects.ts` once an API layer exists — `04-project-dialogs` was explicitly mock-data-only.

## Open Questions

- None yet.

## Architecture Decisions

- `03-auth`: Treated "use the existing sign-in and sign-up env vars" as "use Clerk's standard env var names" (`NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`) rather than a blocker, since those two vars didn't previously exist in `.env.local` but are Clerk's own convention, not app-invented names — consistent with the adjacent "do not rename or invent new ones" instruction.

## Session Notes

- Using Next.js 16.3.2 with React 19 and Tailwind CSS v4.
