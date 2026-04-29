# Project guidelines

Menuthere CRM — Vite + React + TypeScript + Tailwind + shadcn/ui + Convex.

## UI

- Use shadcn/ui for all UI components in this project. Invoke the shadcn skill when building, modifying, or scaffolding UI. Prefer composing existing shadcn primitives over hand-rolling components or pulling in alternative UI libraries.
- Forms use `Field` / `FieldGroup` / `FieldLabel`. Use `gap-*` not `space-y-*`.
- Status pills are rendered by `src/components/StatusBadge.tsx` — reuse it.

## Data layer

- Backend lives in `convex/`. Tables: `customers`, `statuses`, `remarks` (see `convex/schema.ts`).
- Use `useQuery` / `useMutation` from `convex/react`. Import the API as `import { api } from "@convex/_generated/api"`.
- Statuses are dynamic. Default ones are seeded on first load by `statuses.seedIfEmpty`.
- Status changes on a customer also append a remark to the timeline (handled in `customers.changeStatus`).

## Path aliases

- `@/...` → `src/...`
- `@convex/...` → `convex/...`

## Dev loop

- `npm run dev` runs both `convex dev` and `vite` together.
- The first run of `convex dev` prompts for browser-based login.

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
