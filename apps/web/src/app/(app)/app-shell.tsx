'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, LogOut, ChevronDown } from 'lucide-react';
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
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme-toggle';
import { Logo } from '@/components/logo';
import { NewNotificationWatcher } from '@/features/notifications/new-notification-watcher';
import { NotificationBell } from '@/features/notifications/notification-bell';
import { useMyTenant } from '@/features/settings/queries';
import { cn } from '@/lib/utils';
import type { SessionUser } from '@/lib/session';
import { buildNavGroups, type NavGroup } from './nav-config';

function NavLink({
  href,
  label,
  Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  Icon: NavGroup['items'][number]['icon'];
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <a
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </a>
  );
}

function NavGroups({ groups, pathname, onNavigate }: { groups: NavGroup[]; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-3 text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase">
            {group.label}
          </p>
          {group.items.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              Icon={item.icon}
              active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

// Falls back to the default ParotHR mark and name when a tenant hasn't
// uploaded their own logo, or has no tenant at all (PLATFORM_ADMIN).
function BrandMark({ logoUrl, tenantName }: { logoUrl?: string | null; tenantName?: string | null }) {
  return (
    <div className="flex items-center gap-2 px-2">
      <Logo className="size-8 rounded-lg" src={logoUrl} />
      <span className="truncate text-lg font-semibold tracking-tight">{tenantName ?? 'ParotHR'}</span>
    </div>
  );
}

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: tenant } = useMyTenant({ enabled: Boolean(user.tenantId) });

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const initials = user.email.slice(0, 2).toUpperCase();
  const navGroups = buildNavGroups(user);

  return (
    <div className="flex min-h-screen bg-background">
      {user.tenantId && <NewNotificationWatcher tenantId={user.tenantId} />}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card px-3 py-5 lg:flex print:hidden">
        <BrandMark logoUrl={tenant?.logoUrl} tenantName={tenant?.name} />
        <div className="mt-6 flex-1 overflow-y-auto">
          <NavGroups groups={navGroups} pathname={pathname} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card/60 px-4 backdrop-blur-sm supports-backdrop-filter:bg-card/60 lg:px-6 print:hidden">
          <div className="flex items-center gap-2">
            {/* Mobile nav trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                {/* SheetContent is a fixed, viewport-height box (h-full), not
                    part of document flow like the desktop <aside> below - so
                    without an explicit scroll region here, a nav list taller
                    than the screen just gets clipped at the bottom with no
                    way to reach it. min-h-0 is required alongside flex-1:
                    flex items default to min-height:auto, which blocks them
                    from ever shrinking enough to trigger their own
                    overflow-y-auto scrollbar. */}
                <div className="flex h-full min-h-0 flex-col px-3 py-5">
                  <BrandMark logoUrl={tenant?.logoUrl} tenantName={tenant?.name} />
                  <div className="mt-6 min-h-0 flex-1 overflow-y-auto">
                    <NavGroups groups={navGroups} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <span className="text-sm text-muted-foreground">
              {user.tenantId ? (tenant ? `Tenant - ${tenant.name}` : null) : 'Platform Admin'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {user.tenantId && <NotificationBell tenantId={user.tenantId} />}
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline">{user.email}</span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{user.email}</span>
                    <span className="text-xs text-muted-foreground">{user.role.replace(/_/g, ' ')}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} variant="destructive">
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 print:overflow-visible print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
