import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, CheckCircle, Lock, ArrowRight } from 'lucide-react';
import { apiJson } from '@/lib/api';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@repo/ui';
import { Input } from '@repo/ui';
import { Label } from '@repo/ui';
import { Alert, AlertDescription } from '@repo/ui';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordTooShort = password.length > 0 && password.length < 8;
  const passwordMismatch = confirm.length > 0 && password !== confirm;

  if (!token) {
    return (
      <AuthLayout
        title="Invalid reset link"
        subtitle="This password reset link is missing or invalid."
        backLink={{ to: '/forgot-password', label: 'Request new link' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
        >
          <div className="flex items-center justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
              <Lock className="size-8 text-destructive" />
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            The link you used may have expired or been used already.
          </p>

          <Button asChild className="w-full">
            <Link to="/forgot-password" className="flex items-center justify-center gap-2">
              Request a new reset link
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </motion.div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout
        title="Password updated"
        subtitle="Your password has been successfully reset."
        backLink={{ to: '/signin', label: 'Back to sign in' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6"
        >
          <div className="flex items-center justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="size-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4 text-center dark:border-green-900 dark:bg-green-900/20">
            <p className="text-sm text-green-800 dark:text-green-200">
              Your password has been updated. You can now sign in with your new password.
            </p>
          </div>

          <Button asChild className="w-full">
            <Link to="/signin?reset=1" className="flex items-center justify-center gap-2">
              Sign in with new password
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </motion.div>
      </AuthLayout>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    setPending(true);
    try {
      await apiJson('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password. The link may have expired.');
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Choose new password"
      subtitle="Enter a new password for your account. Make it strong and memorable."
      backLink={{ to: '/signin', label: 'Back to sign in' }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="reset-password">New password</Label>
          <div className="relative">
            <Input
              id="reset-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="min-h-11 pr-10"
              placeholder="Enter your new password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 size-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>
          {passwordTooShort ? (
            <p className="text-xs text-destructive">Password must be at least 8 characters.</p>
          ) : password.length >= 8 ? (
            <p className="text-xs text-green-600 dark:text-green-400">Password looks good!</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reset-confirm">Confirm new password</Label>
          <div className="relative">
            <Input
              id="reset-confirm"
              name="confirm"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="min-h-11 pr-10"
              placeholder="Re-enter your new password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 size-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>
          {passwordMismatch ? (
            <p className="text-xs text-destructive">Passwords do not match.</p>
          ) : confirm.length > 0 && password === confirm ? (
            <p className="text-xs text-green-600 dark:text-green-400">Passwords match!</p>
          ) : null}
        </div>

        <Button
          type="submit"
          className="mt-2 min-h-11 w-full"
          disabled={
            pending ||
            !password ||
            !confirm ||
            password.length < 8 ||
            passwordMismatch
          }
        >
          {pending ? (
            'Updating password…'
          ) : (
            <>
              Set new password
              <ArrowRight className="ml-2 size-4" />
            </>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Remember your old password?{' '}
          <Link
            to="/signin"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
