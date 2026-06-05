import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Ban } from 'lucide-react';
import { Badge } from '@repo/ui';
import { Button } from '@repo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Skeleton } from '@repo/ui';
import { adminFetch } from '@/lib/api';
import type { AdminSession, AdminUser } from '@/lib/types';

export function UserSessionsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    if (!id) return;
    setLoading(true);
    Promise.all([
      adminFetch<AdminUser>(`/api/admin/users/${id}`),
      adminFetch<AdminSession[]>(`/api/admin/users/${id}/sessions`),
    ])
      .then(([u, s]) => {
        setUser(u);
        setSessions(s);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function revokeSession(tokenId: string) {
    try {
      await adminFetch(`/api/admin/sessions/${tokenId}`, { method: 'DELETE' });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to revoke session');
    }
  }

  async function revokeAll() {
    if (!id) return;
    if (!confirm('Revoke all active sessions for this user?')) return;
    try {
      await adminFetch(`/api/admin/users/${id}/sessions`, { method: 'DELETE' });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to revoke sessions');
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate('/users')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Sessions</h1>
          {user && <p className="text-muted-foreground text-sm">{user.email}</p>}
        </div>
        {sessions.length > 0 && (
          <Button
            size="sm"
            variant="destructive"
            className="ml-auto"
            onClick={() => void revokeAll()}
          >
            <Ban className="size-3.5 mr-1.5" />
            Revoke all
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Active sessions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No active sessions.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-4 py-2 font-medium text-muted-foreground">User agent</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground">Created</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground">Expires</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const isExpiring =
                    new Date(s.expiresAt).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
                  return (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="px-4 py-2.5 text-muted-foreground max-w-xs truncate">
                        {s.userAgent ?? <span className="italic">Unknown</span>}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {new Date(s.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={isExpiring ? 'destructive' : 'success'} className="text-xs">
                          {new Date(s.expiresAt).toLocaleDateString()}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          title="Revoke session"
                          onClick={() => void revokeSession(s.id)}
                        >
                          <Ban className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
