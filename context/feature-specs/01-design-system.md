Read `AGENTS.md` before starting.

We're adding the design system and UI primitive components.

Install and configure `shadcn/ui`.

Add these shadcn components:

- Button
- Card
- Dialog
- Input
- Tabs
- Textarea
- ScrollArea

Do not modify the generated `components/ui/*` files after installation.

Install `lucide-react` for icons.

Create `lib/utils.ts` with a reusable `cn()` helper for merging Tailwind classes.

ensure all components match the existing dakr theme in `globals.css`

### Check when done
- all components import without errors
- `cn()` works properly
- No default light styling appears
