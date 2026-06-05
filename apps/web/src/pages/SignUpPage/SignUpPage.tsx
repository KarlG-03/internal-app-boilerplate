import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, CheckCircle, Mail, Lock, Shield, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { defaultHomePath, useAuth } from '@/contexts/AuthContext';
import { signInHref } from '@/lib/auth-routes';
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

const signUpSchema = z
  .object({
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

type SignUpValues = z.infer<typeof signUpSchema>;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: 'Enter password', color: 'bg-muted' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 4) return { score, label: 'Good', color: 'bg-yellow-500' };
  return { score, label: 'Strong', color: 'bg-green-500' };
}

export function SignUpPage() {
  const { signUp, signInWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invitedEmail = searchParams.get('email');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accountExists, setAccountExists] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const showGoogle = !!getGoogleClientId();

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: searchParams.get('email') ?? '',
      password: '',
      confirm: '',
    },
  });

  const email = form.watch('email');
  const password = form.watch('password');
  const passwordStrength = getPasswordStrength(password);

  if (isAuthenticated) {
    return <Navigate to={defaultHomePath()} replace />;
  }

  const onSubmit = async (values: SignUpValues) => {
    setAccountExists(false);
    try {
      await signUp(values.email, values.password);
      navigate(defaultHomePath(), { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create account';
      if (message.toLowerCase().includes('already exists')) {
        setAccountExists(true);
      } else {
        form.setError('root', { message });
      }
    }
  };

  const onGoogleCredential = async (credential: string) => {
    setGoogleBusy(true);
    setAccountExists(false);
    form.clearErrors('root');
    try {
      await signInWithGoogle(credential);
      navigate(defaultHomePath(), { replace: true });
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
      title="Create your account"
      subtitle="Create an account to get started."
      backLink={{ to: '/', label: 'Back to home' }}
    >
      {/* Benefits Pills */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6 flex flex-wrap gap-2"
      >
        {[
          { icon: Sparkles, text: 'Early Access - All features free' },
          { icon: Shield, text: 'Secure & private' },
        ].map((benefit) => (
          <div
            key={benefit.text}
            className="flex items-center gap-1.5 rounded-full bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary"
          >
            <benefit.icon className="size-3.5" />
            {benefit.text}
          </div>
        ))}
      </motion.div>

      <Form {...form}>
        <motion.form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {form.formState.errors.root ? (
            <motion.div variants={itemVariants}>
              <Alert variant="destructive" className="rounded-xl">
                <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
              </Alert>
            </motion.div>
          ) : null}

          <AnimatePresence mode="wait">
            {accountExists ? (
              <motion.div
                key="account-exists"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Alert className="rounded-xl border-primary/20 bg-primary/5">
                  <AlertDescription className="flex flex-col gap-2">
                    <span>An account with this email already exists.</span>
                    <Link
                      to={signInHref(email)}
                      className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Sign in instead <ArrowRight className="size-3" />
                    </Link>
                  </AlertDescription>
                </Alert>
              </motion.div>
            ) : null}
          </AnimatePresence>

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
                  <FormLabel className="text-foreground/80">Password</FormLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                    <FormControl>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Create a strong password"
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
                  {password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <motion.div
                            className={`h-full ${passwordStrength.color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <span className={`text-xs ${passwordStrength.color.replace('bg-', 'text-')}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Use at least 8 characters with mix of letters, numbers & symbols
                      </p>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <FormField
              control={form.control}
              name="confirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80">Confirm password</FormLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                    <FormControl>
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Re-enter your password"
                        className="min-h-11 rounded-xl border-border/50 pl-10 pr-10 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 size-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? (
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
                  {googleBusy ? 'Signing in…' : 'Creating account…'}
                </span>
              ) : (
                <>
                  Create account
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
              <CheckCircle className="size-4 text-green-500" />
              <span className="text-xs text-muted-foreground">
                By signing up, you get full access during Early Access
              </span>
            </div>
          </motion.div>

          <motion.p variants={itemVariants} className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              to={signInHref(email)}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </motion.p>

          <motion.p variants={itemVariants} className="text-center text-xs text-muted-foreground">
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="underline underline-offset-2 hover:text-foreground">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">
              Privacy Policy
            </Link>
          </motion.p>
        </motion.form>
      </Form>
    </AuthLayout>
  );
}
