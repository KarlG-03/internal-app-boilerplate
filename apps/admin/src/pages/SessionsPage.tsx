import { useEffect, useState } from 'react';
import { Ban } from 'lucide-react';
import { Badge } from '@repo/ui';
import { Button } from '@repo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Skeleton } from '@repo/ui';
import { adminFetch } from '@/lib/api';
import type { AdminSession, AdminUser } from '@/lib/types';

type SessionRow = AdminSession & { userEmail: string; userId: string };

export function SessionsPage() {
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    adminFetch<AdminUser[]>('/api/admin/users')
      .then(async (users) => {
        const active = users.filter((u) => u.activeSessionCount > 0);
        const perUser = await Promise.all(
          active.map((u) =>
            adminFetch<AdminSession[]>(`/api/admin/users/${u.id}/sessions`).then((sessions) =>
              sessions.map((s) => ({ ...s, userEmail: u.email, userId: u.id })),
            ),
          ),
        );
        setRows(perUser.flat().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function revokeSession(tokenId: string) {
    try {
      await adminFetch(`/api/admin/sessions/${tokenId}`, { method: 'DELETE' });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to revoke session');
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Active Sessions</h1>
        <p className="text-muted-foreground text-sm">{rows.length} active refresh tokens</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">All sessions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No active sessions.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-4 py-2 font-medium text-muted-foreground">User</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground">User agent</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground">Created</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground">Expires</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const isExpiring =
                    new Date(s.expiresAt).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
                  return (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="px-4 py-2.5 font-medium">{s.userEmail}</td>
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
