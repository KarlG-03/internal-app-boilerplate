import { Navigate, useLocation } from 'react-router-dom';

interface LegacyAuthRedirectProps {
  to: '/signin' | '/signup';
}

/** Preserves query string when redirecting old /login and /register bookmarks. */
export function LegacyAuthRedirect({ to }: LegacyAuthRedirectProps) {
  const location = useLocation();
  const target = location.search ? `${to}${location.search}` : to;
  return <Navigate to={target} replace />;
}
