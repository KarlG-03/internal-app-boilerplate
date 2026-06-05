# Internal App Boilerplate

pnpm monorepo starter for **internal company apps**: NestJS API, Vite React web, Vite React admin.

Includes JWT auth (refresh tokens), email verification, Google sign-in (optional), admin panel, API security defaults, Prisma + Postgres, Cursor/Copilot rules, and deploy configs for **Vercel** and **Render**.

## Stack

| App | Path | Port (dev) |
|-----|------|------------|
| API | `apps/api` | 2005 |
| Web | `apps/web` | 5173 |
| Admin | `apps/admin` | 5174 |

Shared UI primitives: `packages/ui` (`@repo/ui`).

## Quick start

```bash
pnpm install
pnpm db:up
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local   # trim to VITE_* only
cp .env.example apps/admin/.env.local

pnpm db:migrate
pnpm dev
```

- Web: http://localhost:5173  
- Admin: http://localhost:5174  
- API health: http://localhost:2005/api/health  

## First admin user

1. Register on the web app (`/signup`).
2. Bootstrap superadmin (uses `ADMIN_BOOTSTRAP_SECRET` from API env):

```bash
curl -X POST http://localhost:2005/api/admin/bootstrap \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@company.com","secret":"YOUR_ADMIN_BOOTSTRAP_SECRET"}'
```

3. Sign in at http://localhost:5174/login

## What's included

### API security

- Global JWT guard with `@PublicRoute()` opt-out
- Rate limiting (Throttler)
- Helmet, CORS, validation pipes
- Refresh token rotation
- Optional `X-API-Key` for scripts
- Generic client error messages (see `.cursor/rules/error-handling.mdc`)

### Web / Admin

- Sign in, sign up, forgot/reset password, email verification
- App shell + sidebar (mobile-friendly)
- Blank dashboard placeholder
- Profile + account delete

### Rules (Cursor + Copilot)

- `.cursor/rules/` — always-on standards (Prisma, pnpm, monorepo, error handling, JWT, etc.)
- `.github/copilot-instructions.md` + mirrored instruction files

## New project from this template

**Use GitHub “Use this template”** — not fork. See [docs/USING-TEMPLATE.md](docs/USING-TEMPLATE.md).

After creating a repo:

1. Rename `VITE_APP_NAME` / `APP_NAME` for your client
2. Design your Prisma schema in `apps/api/prisma/schema.prisma`
3. Add Nest modules under `apps/api/src/`
4. Add pages under `apps/web/src/pages/`
5. Deploy (Vercel or Render — see `docs/DEPLOY-VERCEL.md`, `render.yaml`)

## Deploy

- **Vercel**: `docs/DEPLOY-VERCEL.md` (3 projects: API, web, admin)
- **Render**: `render.yaml` blueprint (Postgres + API + 2 static sites)

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | API + web + admin |
| `pnpm build` | Build all packages |
| `pnpm db:migrate` | Prisma migrate dev (local) |
| `pnpm db:migrate:deploy` | Apply migrations (CI/prod) |

## License

Private / UNLICENSED — adjust per your org.
