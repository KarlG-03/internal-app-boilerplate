import { useEffect, useState } from 'react';
import { Users, Wifi } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Skeleton } from '@repo/ui';
import { adminFetch } from '@/lib/api';
import type { AdminStats } from '@/lib/types';

type StatCardProps = {
  title: string;
  value: number | null;
  icon: React.ReactNode;
};

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        {value === null ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <p className="text-3xl font-bold">{value.toLocaleString()}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminFetch<AdminStats>('/api/admin/stats')
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load stats'));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">System overview</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard title="Total Users" value={stats?.userCount ?? null} icon={<Users className="size-4" />} />
        <StatCard title="Active Sessions" value={stats?.activeSessionCount ?? null} icon={<Wifi className="size-4" />} />
      </div>
    </div>
  );
}
