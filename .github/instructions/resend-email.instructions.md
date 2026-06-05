---
applyTo: "apps/api/**"
---

# Outbound email with Resend

- **Transport**: Use the `resend` package and a dedicated `EmailService` in the API. Do not add alternative SMTP providers in parallel unless product explicitly requires it.

- **Secrets**: `RESEND_API_KEY` — never log or return it. On Render, set via dashboard or `render.yaml` (`sync: false` for secrets).

- **From address**: `EMAIL_FROM` must be a sender/domain verified in the Resend dashboard (e.g. `LoanCompass <onboarding@resend.dev>` in sandbox, your domain in production).

- **Links in email**: Build URLs with `WEB_APP_URL` (or `PUBLIC_WEB_APP_URL` as fallback in code). No trailing slash. Used for verification links (`/verify-email?token=…`) and **borrower portal invites** (`/view/{portalToken}`) so invitees can see loan status without signing in.

- **Dev without Resend**: If `RESEND_API_KEY` or `EMAIL_FROM` is missing, the API should **skip sending** and log a warning — local dev still works; use Resend dashboard or `resend.dev` for real sends.

- **Failures**: Registration and resend flows should not leave the user in an inconsistent state. If send fails after persisting a verification token, log the error; callers may still retry via resend.

- **Content**: Keep HTML minimal (link + short copy). Prefer verification and safety wording ("If you did not create an account…").
