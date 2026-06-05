# Promote through environments (PR-first)

Use this when moving work across **dev → staging → preprod → production (`main`)**. Every hop to a shared branch goes through a **pull request**; do **not** merge local branch tip directly into `main` / `staging` / etc. without a reviewed PR unless the user explicitly opts out.

## Agent: what “commit to dev” means

- **Default:** “Commit to dev”, “put this on dev”, “merge into dev”, or “save work on dev” means: keep changes on a **feature branch**, **push that branch**, open a **PR with base `dev`**, and let GitHub (or the user) merge. Do **not** switch to `dev`, commit there, and `git push origin dev` as the primary path.
- **Same rule for `staging` / `preprod` / `main`:** promotion is always **PR into the target branch**, not a local fast-forward push onto the shared branch.
- **Explicit opt-out only:** If the user clearly asks to **skip the PR**, **push directly to dev**, **commit straight on dev**, or **hotfix without PR**, you may push or merge locally; state that you are bypassing PR-first so expectations stay clear.

See also workspace rule **PR workflow** (`.cursor/rules/pr-workflow.mdc`).

## Branch map (adjust names if your remote differs)

| Stage | Typical branch | Purpose |
|-------|----------------|---------|
| Integration | `dev` | Latest integrated work |
| Staging | `staging` | Pre-QA / shared test |
| Pre-prod | `preprod` (or `pre-production`) | Release candidate, prod-like checks |
| Production | `main` | What ships; treat as protected |

## Rules

1. **PR before merge**: For each promotion, open a PR *into* the target branch, wait for checks (and review if required), then merge via GitHub (squash/merge as per team policy).
2. **One logical change-set per PR** when possible; note migration or env follow-up in the PR body.
3. **After merge** to `main`, tag or deploy per your pipeline (e.g. Render auto-deploy from `main`).

## Agent / operator checklist (repeat for each step)

1. Ensure working tree is clean or intentionally committed on the **source** branch.
2. Push source branch: `git push -u origin <source-branch>`
3. Create PR **targeting** the next environment branch (not `main` until preprod → prod).
   - With GitHub CLI: `gh pr create --base <target> --head <source> --title "…" --body "…"`
4. User or reviewer merges on GitHub when ready.
5. Locally refresh: `git fetch origin && git checkout <target> && git pull origin <target>`
6. Repeat until `main` for production.

## Example sequence (feature → prod)

1. Feature branch `feat/xyz` → PR → merge into **`dev`**.
2. **`dev`** → PR → merge into **`staging`**.
3. **`staging`** → PR → merge into **`preprod`**.
4. **`preprod`** → PR → merge into **`main`**.

## If branches do not exist yet

On GitHub, create `dev`, `staging`, `preprod` from `main` (or your canonical branch), set branch protection + required reviews as needed. First-time only:

```bash
git fetch origin main && git checkout -b dev origin/main && git push -u origin dev
# repeat pattern for staging, preprod
```

## Production reminders (this repo)

- **Render / infra**: after promoting to `main`, confirm deploy hooks, env vars (`VITE_API_URL`, `CORS_ORIGIN`, `DATABASE_URL`), and migrations.
- Follow the **spend-confirmation** workspace rule before upgrading paid Render plans.
