import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, CircleCheck, ArrowRight, Shield, Mail, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { defaultHomePath, useAuth } from '@/contexts/AuthContext';
import { signUpHref } from '@/lib/auth-routes';
import { AuthDivider } from '@/components/AuthDivider';
import { AuthLayout } from '@/components/AuthLayout';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { getGoogleClientId } from '@/lib/google-gis';
import { Button } from '@repo/ui';
import { Input } from '@repo/ui';
import { Alert, AlertDescription } from '@repo/ui';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const signInSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type SignInValues = z.infer<typeof signInSchema>;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export function SignInPage() {
  const { signIn, signInWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from =
    (location.state as { from?: string } | undefined)?.from ??
    defaultHomePath();
  const invitedEmail = searchParams.get('email');
  const justReset = searchParams.get('reset') === '1';

  const [showPassword, setShowPassword] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const showGoogle = !!getGoogleClientId();

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: searchParams.get('email') ?? '',
      password: '',
    },
  });

  const email = form.watch('email');

  if (isAuthenticated) {
    return <Navigate to={defaultHomePath()} replace />;
  }

  const navigateAfterAuth = () => {
    if (location.state) {
      navigate(from, { replace: true });
    } else {
      navigate(defaultHomePath(), { replace: true });
    }
  };

  const onSubmit = async (values: SignInValues) => {
    try {
      await signIn(values.email, values.password);
      navigateAfterAuth();
    } catch (err) {
      form.setError('root', {
        message: err instanceof Error ? err.message : 'Sign-in failed',
      });
    }
  };

  const onGoogleCredential = async (credential: string) => {
    setGoogleBusy(true);
    form.clearErrors('root');
    try {
      await signInWithGoogle(credential);
      navigateAfterAuth();
    } catch (err) {
      form.setError('root', {
        message: err instanceof Error ? err.message : 'Sign-in failed',
      });
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your dashboard and manage your loans."
      backLink={{ to: '/', label: 'Back to home' }}
    >
      <Form {...form}>
        <motion.form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {justReset ? (
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50/80 px-4 py-3 backdrop-blur-sm dark:border-green-900 dark:bg-green-900/20"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                <CircleCheck className="size-4 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm text-green-800 dark:text-green-200">
                Password updated. Sign in with your new password.
              </p>
            </motion.div>
          ) : null}

          {form.formState.errors.root ? (
            <motion.div variants={itemVariants}>
              <Alert variant="destructive" className="rounded-xl">
                <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
              </Alert>
            </motion.div>
          ) : null}

          <motion.div variants={itemVariants}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80">Email address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        className="min-h-11 rounded-xl border-border/50 pl-10 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  {invitedEmail ? (
                    <p className="text-xs text-muted-foreground">
                      Invited email detected. You can still edit this if needed.
                    </p>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-foreground/80">Password</FormLabel>
                    <Link
                      to={
                        email.trim()
                          ? `/forgot-password?email=${encodeURIComponent(email.trim())}`
                          : '/forgot-password'
                      }
                      className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                    <FormControl>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        className="min-h-11 rounded-xl border-border/50 pl-10 pr-10 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 size-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <Button
              type="submit"
              className="mt-2 min-h-11 w-full rounded-xl shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
              disabled={form.formState.isSubmitting || googleBusy}
            >
              {form.formState.isSubmitting || googleBusy ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Signing in…
                </span>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </Button>
          </motion.div>

          {showGoogle ? (
            <motion.div variants={itemVariants} className="space-y-3">
              <AuthDivider />
              <GoogleSignInButton
                disabled={googleBusy || form.formState.isSubmitting}
                onCredential={(credential) => void onGoogleCredential(credential)}
                onError={(message) => form.setError('root', { message })}
              />
            </motion.div>
          ) : null}

          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 rounded-xl border border-border/30 bg-muted/30 px-3 py-2">
              <Shield className="size-4 text-primary" />
              <span className="text-xs text-muted-foreground">
                Secure, encrypted connection
              </span>
            </div>
          </motion.div>

          <motion.p variants={itemVariants} className="text-center text-sm text-muted-foreground">
            No account?{' '}
            <Link
              to={signUpHref(email)}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Create one
            </Link>
          </motion.p>
        </motion.form>
      </Form>
    </AuthLayout>
  );
}
