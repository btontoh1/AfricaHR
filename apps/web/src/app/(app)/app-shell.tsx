'use client';

import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { SessionUser } from '@/lib/session';

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const initials = user.email.slice(0, 2).toUpperCase();

  // EMPLOYEE holds no Employee permission at all, and PLATFORM_ADMIN has
  // no tenant context (tenantId is always null for that role) — showing
  // the link to either would just lead to a 403 or a broken /tenants/null
  // request, so this stays a simple client-side visibility check, not a
  // duplicate of the backend's full permission matrix (see project notes
  // on Module 2 scope: the backend remains the real enforcement point).
  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    ...(user.tenantId && user.role !== 'EMPLOYEE' ? [{ label: 'Employees', href: '/employees' }] : []),
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-muted/20 p-4">
        <div className="mb-6 text-lg font-semibold">AfricaHR</div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-6 py-3">
          <div className="text-sm text-muted-foreground">
            {user.tenantId ? `Tenant: ${user.tenantId}` : 'Platform Admin'}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{user.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.role}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
