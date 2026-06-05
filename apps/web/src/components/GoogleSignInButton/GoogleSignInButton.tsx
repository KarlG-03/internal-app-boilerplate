import { useEffect, useRef, useState } from 'react';
import {
  getGoogleClientId,
  GOOGLE_SIGN_IN_LOCALE,
  loadGoogleIdentityScript,
} from '@/lib/google-gis';

export interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}

export function GoogleSignInButton({
  onCredential,
  onError,
  disabled = false,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const clientId = getGoogleClientId();

  useEffect(() => {
    if (!clientId || disabled) {
      return;
    }

    let cancelled = false;

    void loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google?.accounts?.id) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          locale: GOOGLE_SIGN_IN_LOCALE,
          callback: (response) => {
            if (response.credential) {
              onCredential(response.credential);
            } else {
              onError?.('Google sign-in did not return a credential');
            }
          },
        });

        containerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          locale: GOOGLE_SIGN_IN_LOCALE,
          width: Math.min(containerRef.current.offsetWidth || 320, 400),
        });
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          onError?.('Google sign-in is not available right now');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, disabled, onCredential, onError]);

  if (!clientId) {
    return null;
  }

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="flex min-h-11 w-full justify-center [&>div]:w-full"
        aria-hidden={!ready}
      />
    </div>
  );
}
