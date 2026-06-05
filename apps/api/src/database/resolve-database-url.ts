/**
 * Matches `docker-compose.yml` defaults for local Postgres.
 * Production (e.g. Render) must set DATABASE_URL explicitly.
 */
const DEFAULT_LOCAL_DATABASE_URL =
  'postgresql://postgres:postgres@localhost:5432/personal_loan_ledger?schema=public';

export function resolveDatabaseUrl(databaseUrl?: string | null): string {
  const trimmed = databaseUrl?.trim();
  if (trimmed) {
    return trimmed;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL must be set when NODE_ENV=production');
  }
  return DEFAULT_LOCAL_DATABASE_URL;
}
