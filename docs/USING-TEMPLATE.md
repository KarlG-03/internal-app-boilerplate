# Using this template

## Recommended flow: **Use this template** (not fork)

| Approach | Verdict |
|----------|---------|
| **GitHub “Use this template”** | ✅ Clean history, no loan/product commits, correct mental model |
| **Fork** | ❌ Carries full git history, wrong upstream, awkward for client repos |
| **Copy files manually** | OK once; template button is easier |

### Create a new client project

1. Open https://github.com/KarlG-03/internal-app-boilerplate
2. Click **Use this template** → **Create a new repository**
3. Name it for the client (e.g. `acme-food-service`)
4. Clone and customize:

```bash
git clone git@github.com:KarlG-03/acme-food-service.git
cd acme-food-service
pnpm install
```

5. Update branding env vars:
   - API: `APP_NAME`, `WEB_APP_URL`, `CORS_ORIGIN`
   - Web: `VITE_APP_NAME`, `VITE_API_URL`
6. Replace the blank dashboard and add your domain schema/modules
7. Create a **new** Postgres database per client (Render blueprint or Vercel Neon)

## What to customize first

| Area | Action |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add your domain models |
| `apps/web/src/pages/DashboardPage` | Your app home |
| `apps/web/src/components/AppSidebar` | Navigation for your features |
| `README.md` | Client name, deploy URLs, runbook |
| `render.yaml` / Vercel project names | Per-client infra names |

## What to keep

- Auth module and admin panel (unless client doesn't need admin)
- `.cursor/rules/` and `.github/` instructions — update paths if needed, don't delete security rules
- `apps/web/src/lib/api.ts` / `apps/admin/src/lib/api.ts` — token refresh pattern
- Deploy scripts and env validation patterns

## Per-client infrastructure (model B)

Each client repo → its own deploy stack:

- Postgres (isolated)
- API service
- Web static site
- Admin static site (optional)

Do **not** share production `DATABASE_URL` across clients.

## Syncing template improvements

When you improve the boilerplate:

1. Merge/cherry-pick into client repos as needed, or
2. Re-run diff against template for shared infra (auth, deploy scripts)

Client-specific domain code stays in the client repo only.
