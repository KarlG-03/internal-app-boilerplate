import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@repo/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import { apiJson } from '@/lib/api';

export function ProfilePage() {
  const navigate = useNavigate();
  const {
    accountEmail,
    emailVerified,
    canDeleteAccount,
    logout,
    resendVerificationEmail,
  } = useAuth();
  const [resendState, setResendState] = useState<
    'idle' | 'sending' | 'sent' | 'error'
  >('idle');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function onResend() {
    setResendState('sending');
    try {
      await resendVerificationEmail();
      setResendState('sent');
    } catch {
      setResendState('error');
    }
  }

  async function onDeleteAccount() {
    try {
      setDeleting(true);
      setDeleteError(null);
      await apiJson('/api/auth/me', { method: 'DELETE' });
      logout();
      navigate('/', { replace: true });
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Could not delete account');
      setDeleting(false);
    }
  }

  return (
    <section className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
          <CardDescription>{accountEmail}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {emailVerified ? (
            <p className="text-sm text-muted-foreground">Email verified</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Email not verified yet.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={resendState === 'sending'}
                onClick={onResend}
              >
                {resendState === 'sending' ? 'Sending…' : 'Resend verification email'}
              </Button>
              {resendState === 'sent' && (
                <p className="text-sm text-muted-foreground">Verification email sent.</p>
              )}
              {resendState === 'error' && (
                <p className="text-sm text-destructive">Could not send email. Try again later.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {canDeleteAccount && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Delete account</CardTitle>
            <CardDescription>Permanently remove your account and data.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setConfirmDeleteOpen(true)}>
              Delete account
            </Button>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void onDeleteAccount();
              }}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
