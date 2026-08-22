# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Auth (`context/feature-specs/03-auth.md`) — complete

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

## In Progress

- None.

## Next Up

- Build the `/editor` route itself (layout + real `isSidebarOpen` state wiring `EditorNavbar` + `ProjectSidebar`) — referenced as the post-sign-in redirect target in `03-auth` but out of that spec's scope; until this exists, an authenticated visit to `/` will redirect to a 404.
- Build real dialogs on top of the verified `components/ui/dialog.tsx` pattern when a feature needs one.

## Open Questions

- None yet.

## Architecture Decisions

- `03-auth`: Treated "use the existing sign-in and sign-up env vars" as "use Clerk's standard env var names" (`NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`) rather than a blocker, since those two vars didn't previously exist in `.env.local` but are Clerk's own convention, not app-invented names — consistent with the adjacent "do not rename or invent new ones" instruction.

## Session Notes

- Using Next.js 16.3.2 with React 19 and Tailwind CSS v4.
