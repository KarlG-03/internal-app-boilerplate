import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ban, ChevronRight, ShieldCheck, Trash2 } from 'lucide-react';
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
import { Badge } from '@repo/ui';
import { Button } from '@repo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Skeleton } from '@repo/ui';
import { adminFetch } from '@/lib/api';
import type { AdminUser } from '@/lib/types';

export function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);
  const navigate = useNavigate();

  function load() {
    setLoading(true);
    adminFetch<AdminUser[]>('/api/admin/users')
      .then(setUsers)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load users'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function revokeTokens(userId: string) {
    try {
      await adminFetch(`/api/admin/users/${userId}/sessions`, { method: 'DELETE' });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to revoke sessions');
    }
  }

  async function toggleSuperAdmin(userId: string) {
    try {
      await adminFetch(`/api/admin/users/${userId}/toggle-superadmin`, { method: 'PATCH' });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to toggle superadmin');
    }
  }

  async function deleteUser(userId: string) {
    try {
      await adminFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      setPendingDelete(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete user');
      setPendingDelete(null);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground text-sm">{users.length} registered users</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">All users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-4 py-2 font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground">Sessions</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground">Joined</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {u.email}
                        {u.isSuperAdmin && (
                          <Badge variant="default" className="text-xs">
                            <ShieldCheck className="size-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                        {!u.emailVerified && (
                          <Badge variant="secondary" className="text-xs">Unverified</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={u.emailVerified ? 'success' : 'outline'}>
                        {u.emailVerified ? 'Verified' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{u.activeSessionCount}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title="Revoke all sessions"
                          onClick={() => void revokeTokens(u.id)}
                        >
                          <Ban className="size-3.5" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title={u.isSuperAdmin ? 'Remove superadmin' : 'Make superadmin'}
                          onClick={() => void toggleSuperAdmin(u.id)}
                        >
                          <ShieldCheck className="size-3.5" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          title="Delete user"
                          onClick={() => setPendingDelete(u)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title="View sessions"
                          onClick={() => navigate(`/users/${u.id}/sessions`)}
                        >
                          <ChevronRight className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{pendingDelete?.email}</span>
              {' '}will be permanently deleted along with all their loans and repayments. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => pendingDelete && void deleteUser(pendingDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
