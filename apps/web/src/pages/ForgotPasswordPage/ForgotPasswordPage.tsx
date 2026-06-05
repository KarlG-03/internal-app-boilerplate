import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CircleCheck, Mail, ArrowRight } from 'lucide-react';
import { apiJson } from '@/lib/api';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@repo/ui';
import { Input } from '@repo/ui';
import { Label } from '@repo/ui';
import { Alert, AlertDescription } from '@repo/ui';

export function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await apiJson('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch {
      // Show generic error but still show "check email" to avoid enumeration
      setSubmitted(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title={submitted ? 'Check your email' : 'Reset password'}
      subtitle={
        submitted
          ? "We've sent a password reset link to your email address."
          : "Enter your email address and we'll send you a link to reset your password."
      }
      backLink={{ to: '/signin', label: 'Back to sign in' }}
    >
      {submitted ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6"
        >
          <div className="flex items-center justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Mail className="size-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-4 dark:border-green-900 dark:bg-green-900/20">
            <CircleCheck className="size-5 shrink-0 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-800 dark:text-green-200">
              Reset link sent to <span className="font-medium">{email}</span>. The link will expire in 1 hour.
            </p>
          </div>

          <div className="space-y-3 text-center text-sm text-muted-foreground">
            <p>
              Didn&apos;t receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setSubmitted(false)}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                try again
              </button>
              .
            </p>
          </div>

          <Button variant="outline" className="w-full" asChild>
            <Link to="/signin" className="flex items-center justify-center gap-2">
              <ArrowLeft className="size-4" />
              Back to sign in
            </Link>
          </Button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="forgot-email">Email address</Label>
            <Input
              id="forgot-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="min-h-11"
              placeholder="you@example.com"
            />
          </div>

          <Button
            type="submit"
            className="mt-2 min-h-11 w-full"
            disabled={pending || !email.trim()}
          >
            {pending ? (
              'Sending…'
            ) : (
              <>
                Send reset link
                <ArrowRight className="ml-2 size-4" />
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link
              to="/signin"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
