import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  backLink?: {
    to: string;
    label: string;
  };
}

const appName = import.meta.env.VITE_APP_NAME?.trim() || 'App';

export function AuthLayout({ children, title, subtitle, backLink }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <header className="flex h-16 items-center justify-between border-b border-border/40 px-4 sm:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {backLink ? (
            <Link
              to={backLink.to}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="size-4 shrink-0" />
              <span className="truncate">{backLink.label}</span>
            </Link>
          ) : (
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt={appName}
                className="size-8 rounded-lg object-cover"
              />
              <span className="font-bold tracking-tight">{appName}</span>
            </Link>
          )}
        </div>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </motion.div>
      </div>

      <footer className="border-t border-border/40 px-4 py-4 text-center text-xs text-muted-foreground sm:px-8">
        <p>© {new Date().getFullYear()} {appName}</p>
      </footer>
    </div>
  );
}
