# Deploy to Vercel

This repo is a pnpm monorepo with three deployables:

- `apps/web` (Vite SPA)
- `apps/admin` (Vite SPA)
- `apps/api` (NestJS API, deployed as a single Vercel Serverless Function)

## Vercel projects

Create **three** Vercel projects pointing at the same GitHub repo.

**Important:** In each project’s Vercel settings → **Root Directory**, use the values below. If all three are `.`, Git deploys for the API will miss rewrites and return `404 NOT_FOUND` (browser shows this as a CORS error).

| Vercel project | Root directory (dashboard) | Config file | Output |
|---------------|---------------------------|-------------|--------|
| API | `.` (repository root) | `vercel.json` at repo root | Serverless `api/index.js` |
| Web | `apps/web` | `apps/web/vercel.json` | `dist/` |
| Admin | `apps/admin` | `apps/admin/vercel.json` | `dist/` |

CLI deploy for the API (from repo root):

```bash
vercel deploy --prod -S karlg03s-projects -A vercel.json
```

`apps/api/vercel.json` is kept in sync with the root file for backward compatibility.

### Neon databases (two Storage resources)

The `loancompass-api` project uses two Vercel Storage → **Neon** resources:

| Storage resource | Vercel environments | Region | Purpose |
|------------------|---------------------|--------|---------|
| **loancompass-db** | **Production** only | `sin1` | Live user data |
| **loancompass-db-dev** | **Preview** + **Development** | `sin1` | PR previews and `vercel dev` (separate empty DB; migrations run on deploy) |

Do not point Preview/Development at the production database. Each resource injects its own `DATABASE_URL` (and related `POSTGRES_*` / `PG*` vars).

**Dashboard:** Vercel → **loancompass-api** → **Storage** — confirm `loancompass-db` is connected only to Production, and `loancompass-db-dev` to Preview and Development.

Optional on **loancompass-db-dev**: enable **Preview branching** so each PR preview gets an isolated Neon branch (see [Neon Vercel integration](https://neon.com/docs/guides/neon-managed-vercel-integration)).

Non-database secrets (`JWT_SECRET`, `CORS_ORIGIN`, etc.) must still exist per environment on the API project (copy from Production or set in the dashboard).

### Install command (all projects)

Use the same install command everywhere:

```bash
corepack enable && corepack prepare pnpm@10.33.0 --activate && pnpm install --frozen-lockfile
```

### Build commands

- Web:

```bash
pnpm --filter web build
```

- Admin:

```bash
pnpm --filter admin build
```

- API:

```bash
bash scripts/vercel-api-build.sh
```

The script uses `DATABASE_URL`, or falls back to `POSTGRES_PRISMA_URL` (Neon on Vercel). If both are missing at build time, the deploy fails with a clear error — link **loancompass-db-dev** to Preview/Development or **loancompass-db** to Production.

## Environment variables

### API (`apps/api`)

Required:

- `NODE_ENV=production`
- `DATABASE_URL` (from Vercel Storage → Postgres link)
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN` (comma-separated browser origins for web + admin; no paths)

Common:

- `GOOGLE_CLIENT_ID`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `WEB_APP_URL`
- `ADMIN_BOOTSTRAP_SECRET`
- `ADMIN_NOTIFICATION_EMAIL`

Cron:

- `CRON_SECRET` (a long random secret)

### Web (`apps/web`)

- `VITE_API_URL` (e.g. `https://api.loancompass.app`)
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_WEB_APP_URL` (if used by the UI)
- `VITE_GA_MEASUREMENT_ID` (optional, Google Analytics 4)

**Vercel Web Analytics** (no env var): only the **web** app ships `@vercel/analytics` for SPA page views. Enable it on [loancompass-web → Analytics](https://vercel.com/karlg03s-projects/loancompass-web/analytics). The **API** project’s Analytics tab is for that Vercel project’s Web Analytics product (page views in a browser); it does **not** auto-track Nest `/api/*` routes. Use web analytics for product usage; use Vercel **Observability / Functions** logs and metrics on `loancompass-api` for API health.

### Admin (`apps/admin`)

- `VITE_API_URL` (e.g. `https://api.loancompass.app`)

## Cron jobs

Vercel Cron hits these endpoints on the API (protected by `CRON_SECRET`):

- `GET /api/internal/cron/interest-accrual`
- `GET /api/internal/cron/due-date-reminders`

## Custom domains (LoanCompass production)

Map the same hostnames you use on Render:

| Service | Domain | Vercel project |
|---------|--------|----------------|
| Web | `https://web.loancompass.app` | Web (`apps/web`) |
| API | `https://api.loancompass.app` | API (`apps/api`) |
| Admin | `https://admin.loancompass.app` (recommended) or keep `*.vercel.app` until you add DNS | Admin (`apps/admin`) |

If admin on Render still uses the default `*.onrender.com` URL, add `admin.loancompass.app` in Vercel → Admin → Domains (CNAME to Vercel) so `CORS_ORIGIN` stays stable.

### Environment values (copy into Vercel)

**API**

```env
CORS_ORIGIN=https://web.loancompass.app,https://admin.loancompass.app
WEB_APP_URL=https://web.loancompass.app
```

(Add `https://<your-admin-vercel-host>.vercel.app` to `CORS_ORIGIN` only while testing before the admin custom domain is live.)

**Web** (redeploy after changing — build-time)

```env
VITE_API_URL=https://api.loancompass.app
VITE_WEB_APP_URL=https://web.loancompass.app
VITE_GOOGLE_CLIENT_ID=<same as API GOOGLE_CLIENT_ID>
```

**Admin** (redeploy after changing)

```env
VITE_API_URL=https://api.loancompass.app
```

### Google OAuth

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → your Web client → **Authorized JavaScript origins**:

- `https://web.loancompass.app`
- `http://localhost:5173` (local dev)

If you use Google sign-in on admin, also add `https://admin.loancompass.app`.

### DNS cutover (Cloudflare or your registrar)

For each custom domain in Vercel → Project → Domains, add the record Vercel shows (usually **CNAME** to `cname.vercel-dns.com`). Point:

- `web` → Web project
- `api` → API project
- `admin` → Admin project (when ready)

After DNS propagates, remove or pause the matching Render services.

