import { Outlet, useLocation } from 'react-router-dom';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';

function headerTitle(pathname: string): string {
  if (pathname.startsWith('/profile')) {
    return 'Profile';
  }
  if (pathname.startsWith('/dashboard')) {
    return 'Dashboard';
  }
  return 'Overview';
}

export function AppShell() {
  const { pathname } = useLocation();
  const title = headerTitle(pathname);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex min-h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:px-4">
          <SidebarTrigger className="-ml-0.5" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold tracking-tight sm:text-base">
              {title}
            </span>
          </div>
          <ThemeToggle className="shrink-0" />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
