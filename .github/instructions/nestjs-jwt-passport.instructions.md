---
applyTo: "apps/api/**"
---

# NestJS JWT + Passport

## Packages

```bash
pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt --filter api
pnpm add -D @types/passport-jwt @types/bcrypt --filter api
```

Ensure native **`bcrypt`** can run install scripts (e.g. pnpm `onlyBuiltDependencies` includes `bcrypt`).

## Environment

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | **Required** to sign and verify tokens (strong random in prod). |
| `JWT_EXPIRES_IN` | Optional, e.g. `7d`. |

Do **not** use `AUTH_USERNAME` / `AUTH_PASSWORD` for multi-user flows — store **users in the database** with **bcrypt**-hashed passwords. Optional **`API_KEY`** remains for scripts (`X-API-Key`) alongside Bearer JWT.

## Data model

- Prisma **`User`**: at least `email` (unique), `passwordHash`, `id` for JWT `sub`.
- **`POST /auth/register`**: validate DTO (`IsEmail`, password `MinLength(8)`, max 72 chars for bcrypt), **`ConflictException`** on duplicate email, **hash** with `bcrypt.hash(..., rounds)` (e.g. 12), then return **`{ access_token }`** (same as login) for a smooth client flow.
- **`POST /auth/login`**: find user by email, **`bcrypt.compare`**, issue JWT with payload `{ sub: user.id, email }`.

## Modules

- **`PassportModule.register({ defaultStrategy: 'jwt' })`**
- **`JwtModule.registerAsync`**: `secret` and `signOptions.expiresIn` from `ConfigService`; **throw** if `JWT_SECRET` is missing at bootstrap in production.

## Files (suggested layout)

| File | Role |
|------|------|
| `jwt.strategy.ts` | `PassportStrategy(Strategy, 'jwt')`, `ExtractJwt.fromAuthHeaderAsBearerToken()`, `validate()` returns `{ userId, email }`. |
| `jwt-auth.guard.ts` | Extends `AuthGuard('jwt')`; `@PublicRoute()` bypass; optional **`X-API-Key`** when `API_KEY` is set (timing-safe). |
| `auth.controller.ts` | `@PublicRoute()` **POST `/auth/register`**, **POST `/auth/login`**. |
| `auth.service.ts` | Prisma + bcrypt; `signAsync` for issued tokens. |

## Global guard

```typescript
providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
```

## Public routes

`@PublicRoute()` on **health**, **register**, **login**, and any unauthenticated route.

## Security

- Never store plain passwords. Use **bcrypt** (or Argon2) only.
- Bearer + **sessionStorage** is XSS-sensitive; prefer **httpOnly cookies** for high-risk apps.
- Add rate limiting / CAPTCHA for **register** and **login** in production.

## Render / Docker

- Set **`JWT_SECRET`** via generated value or secret manager.
- **Remove** obsolete `AUTH_USERNAME` / `AUTH_PASSWORD` from infra when using DB registration.
