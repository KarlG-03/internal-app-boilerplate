# Copilot Instructions

These instructions apply to all files in this monorepo.

---

## Core Standards

- **DRY**: Repeat logic → shared function, hook, util, or package; repeat UI → component.
- **Single responsibility**: One main idea per file; split when a file grows past **~300 lines** (soft limit).
- **One component per file** (named export + file name matching the component).
- **Separation of concerns**: UI vs data-fetch vs business rules vs IO (DB, HTTP) in different layers.
- **Types**: TypeScript strict; avoid `any`; explicit types at API boundaries (DTOs, env, forms).
- **Early returns** over deep nesting; handle errors at boundaries; no empty `catch`.
- **Naming**: Verbs for functions (`get`, `create`, `validate`); nouns for types.
- **Dependencies**: Stable public APIs between packages; no deep imports into another package's internals.
- **Tests**: Add or update tests for crucial business logic and edge cases whenever behavior changes.
- **PR-first workflow**: Changes targeting `dev` should go through a feature branch and pull request by default. Only commit or push directly to `dev` when the user explicitly opts out of the PR flow.

## Public Response Security

- **Never share sensitive information in public/API responses**: All user-visible errors and API bodies must be safe for public exposure.
- **Do not expose**: secrets/tokens/keys, env var names, stack traces, SQL/internal exception payloads, internal hosts/paths/ports, or provider/configuration internals.
- **Use least disclosure**: return minimal, generic, actionable messages to clients; keep full diagnostics in server logs only.
- **Prefer stable error codes** for client handling over detailed internal messages.

---

## Rule Mirroring

This repo has two parallel rule sets that must stay in sync:

| Cursor | Copilot Chat |
|--------|--------------|
| `.cursor/rules/*.mdc` | `.github/instructions/*.instructions.md` |
| `.cursor/commands/*.md` | `.github/prompts/*.prompt.md` |
| `.cursor/rules/core-standards.mdc` + other `alwaysApply: true` rules | `.github/copilot-instructions.md` |

- **Whenever you add or change a rule in one system, apply the same change to the mirror file in the other system** before committing.
- File-scoped rules: keep `globs` (Cursor) and `applyTo` (Copilot) targeting the same path patterns.
- Always-on rules (`alwaysApply: true` / `copilot-instructions.md`): keep content in sync across both.

---

## Imports

- Prefer **path aliases** (`@/` for web) over long `../../../` chains.
- **Barrels**: Package exports through clear entry points; avoid circular barrel graphs.

---

## Monorepo + Modulith

- **Layout**: Shared code in `packages/*`; apps in `apps/*` (`apps/api`, `apps/web`). No copy-paste between apps—extract to a package.
- **Modulith**: One NestJS deployable with **domain modules** (borrowers, loans, etc.). Each module owns its slice; **avoid circular imports** between modules.
- **API**: Clients depend on HTTP contract and env config—not on Nest internals.
- **React**: Barrel folders `ComponentName/ComponentName.tsx` + `index.tsx` re-exporting default.

---

## Package Manager — pnpm

- **Installs**: `pnpm install`; do not use `npm` or `yarn` for this repo.
- **Root scripts**: Run from workspace root (`pnpm dev`, `pnpm build`, etc.).
- **Workspace packages**: Target apps/packages with `--filter <name-or-path>` (e.g. `pnpm --filter api …`, `pnpm --filter ./apps/web …`).
- **Parallel apps**: Prefer `pnpm --parallel --filter … --filter … run <script>` over per-package guesses when orchestrating multiple workspace dev servers.
- **Lockfile**: Treat `pnpm-lock.yaml` as the source of dependency truth; regenerate via pnpm rather than editing by hand.

---

## Pull Request Workflow

### Default branch

- **Integration branch:** `dev`. PRs should target **`dev`** unless the user names another base (e.g. `staging`, `main`).

### When the user prompts for PR / merge

- **Create a pull request** into **`dev`** (from the current feature branch), e.g. GitHub CLI: `gh pr create --base dev`.
- **Merge into `dev`** when they ask to merge (e.g. `gh pr merge` after checks pass), or give exact steps if `gh` is unavailable.

### Do not

- **Auto-commit:** never run `git commit` unless the user **explicitly** asks to commit, save work in git, or similar.
- **Push or merge to `main`** unless the user **explicitly** asks (release, hotfix, deploy from `main`, etc.).
- **Push new work straight to `dev` (or `staging` / `preprod`)** without a PR when the user asked to "commit to dev" or "put work on dev" in the normal sense. Those phrases mean: **feature branch → `gh pr create --base dev` → merge on GitHub** (see prompt **promote-through-environments**). Only bypass if the user **explicitly** opts out (e.g. "push directly to dev", "skip PR", "no PR for this").

### Routine changes

- Prefer a **feature branch** off **`dev`** (or `main` if that is your only trunk), push the branch, open PR → **`dev`**, then merge after review/checks.
- After the user asks to **commit** or **save work targeting dev**, prefer: commit on the **current feature branch** → `git push -u origin <branch>` → **`gh pr create --base dev --head <branch>`** (or give the user the PR URL steps). Do not replace that with **`git checkout dev && git commit && git push`** unless they opted out of PRs.

---

## Database — Prisma

- **ORM**: Use **Prisma** for schema, migrations, and queries. Do not mix a second ORM or raw driver stack for the same database without an explicit migration plan.
- **Layout**: Keep **`schema.prisma`** and **`prisma/migrations/`** next to the deployable that owns the database (`apps/<service>/prisma/`).
- **Datasource**: `DATABASE_URL` is the canonical connection string—load it from env or a secrets manager; never commit it.
- **Migrations**: Use **`prisma migrate dev`** in development and **`prisma migrate deploy`** in CI/production. Prefer migration history over ad-hoc `db push` for shared/prod databases.
- **Migration reset danger**: `prisma migrate dev` can trigger a **full database reset** (data loss) when it detects schema drift or migration history conflicts (e.g. after renaming/reordering migration files). Never rename or reorder existing migration folders. Before running `prisma migrate dev`, warn the user if drift is detected — offer to fix the drift without a reset. Never run `prisma migrate reset` on a shared or production database.
- **Client lifecycle**: Use **one** `PrismaClient` per process. Connect when the app boots, **disconnect on shutdown**. Inject that shared instance into data-access code—avoid constructing `PrismaClient` ad hoc (e.g. per request).
- **API boundaries**: Prefer **generated Prisma types** (or thin mappers); keep HTTP DTOs separate where wire shapes differ.

---

## Render Postgres

- **`DATABASE_URL`** is the canonical env var; never commit it or paste it into source.
- **Internal URL**: Use for workloads running on Render in the same account/region.
- **External URL**: Use for local dev, CI, or off-Render runners.
- **SSL**: Prefer TLS for external clients (`sslmode=require` or equivalent).
- **Migrations**: Apply schema changes via explicit migrations in build/release—not ad-hoc `db push` in production.
- **Separate databases** per environment (production / staging / dev).
- **Frontend (Vite SPA)**: `VITE_*` is inlined at build time; Render must expose `VITE_API_URL` to the static site service. `CORS_ORIGIN` on the API must include the static site's browser origin. Configure `/*` → `/index.html` rewrite for client-side routing.

---

## Spend & Billing Safety

Before **any** action that might **charge money** or **upgrade** infrastructure, **stop and ask the user for explicit confirmation** with a clear price impact (even if approximate or "metered"). Do not infer consent from earlier messages.

Apply to (non-exhaustive):

- **Render**: non-free `plan` values (`starter`, `basic-*`, `pro-*`, flexible compute, autoscaled tiers), extras (HA, replicas, disks, egress-heavy choices), converting from free/expiring tiers to paid, or MCP/tool calls that create or resize billable resources.
- **Other hosts & APIs**: analogous paid SKUs, reserved capacity, usage-based billing, or prepaid credits.
- **MCP / agents**: tooling that provisions cloud resources or modifies production env in ways tied to scaling.

If the user's goal is achievable on a **free or existing** footprint, prefer that path unless they **explicitly** choose otherwise.
