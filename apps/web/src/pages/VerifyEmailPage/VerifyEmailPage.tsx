import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { defaultHomePath, useAuth } from '@/contexts/AuthContext';
import { publicJson } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { applyVerifiedSession } = useAuth();
  const token = searchParams.get('token');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    if (!token) {
      setError('This link is missing the verification token.');
      setPending(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await publicJson<{
          access_token: string;
          emailVerified: boolean;
        }>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        if (cancelled) {
          return;
        }
        applyVerifiedSession(data);
      navigate(defaultHomePath(), { replace: true });
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : 'Could not verify your email',
          );
        }
      } finally {
        if (!cancelled) {
          setPending(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, navigate, applyVerifiedSession]);

  return (
    <div className="flex min-h-dvh flex-col justify-center bg-background px-4 py-10 sm:py-12">
      <div className="mx-auto w-full max-w-[min(100%,22rem)]">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl tracking-tight sm:text-2xl">
              Email verification
            </CardTitle>
            <CardDescription className="text-sm">
              {pending
                ? 'Confirming your email address…'
                : error
                  ? 'Something went wrong.'
                  : 'Redirecting…'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Verification failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {!pending && error ? (
              <Button asChild className="w-full min-h-11 sm:min-h-10">
                <Link to="/signin">Back to sign in</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
