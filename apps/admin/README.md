# LoanCompass Admin

Superadmin SPA for LoanCompass — manage users, loans, and active sessions.

Built with Vite + React + Tailwind + shadcn/ui. Runs on port **5174** in development.

---

## Getting started

### 1. Install dependencies

From the **repo root**:

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local   # or create .env.local manually
```

`apps/admin/.env.local`:

```
VITE_API_URL=http://127.0.0.1:2005
```

In production, `VITE_API_URL` must point to your deployed API (e.g. `https://api.loancompass.app`). It is **baked in at build time** by Vite. If unset, login posts to the admin site itself (`/api/auth/login` on the static host) and fails.

On Render: **personal-loan-admin** → Environment → `VITE_API_URL` → **Save** → **Manual Deploy**. Also add the admin site URL to the API’s `CORS_ORIGIN` (comma-separated with the web app).

### 3. Start the dev server

```bash
# From repo root
pnpm dev:admin

# Or directly
pnpm --filter admin dev
```

Open [http://localhost:5174](http://localhost:5174).

> The API (`pnpm dev:api`) must also be running for login to work.

---

## Bootstrap your superadmin account

The admin app only accepts accounts with `isSuperAdmin = true`. You need to elevate your account once using the bootstrap endpoint.

### Step 1 — Get the bootstrap secret

**Local dev** — it's in `apps/api/.env`:

```
ADMIN_BOOTSTRAP_SECRET=<value>
```

**Production (Render)** — find it in the API service's **Environment** tab in the Render dashboard.

### Step 2 — Call the bootstrap endpoint

```bash
curl -X POST http://localhost:3000/api/admin/bootstrap \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com", "secret": "<ADMIN_BOOTSTRAP_SECRET>"}'
```

Replace the host with your production API URL when bootstrapping in production.

A `200 OK` response means your account is now superadmin. This endpoint can only be called once per account and requires the correct secret.

### Step 3 — Log in

Go to [http://localhost:5174](http://localhost:5174) and log in with the same email/password you use on the main LoanCompass app.

---

## Pages

| Page | Path | Description |
|------|------|-------------|
| Login | `/login` | Superadmin-only login |
| Dashboard | `/` | Stats: users, loans, active sessions |
| Users | `/users` | List users; toggle superadmin, revoke sessions, delete |
| User Sessions | `/users/:id/sessions` | Active sessions for a specific user |
| Sessions | `/sessions` | All active sessions across all users |

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server on port 5174 |
| `pnpm build` | Type-check + build to `dist/` |
| `pnpm preview` | Preview the production build locally |
