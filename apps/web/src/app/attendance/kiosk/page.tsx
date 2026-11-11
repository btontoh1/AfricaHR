import type { Metadata } from 'next';
import { getSession } from '@/lib/session';
import { KioskApp } from '@/features/attendance/kiosk-app';

export const metadata: Metadata = {
  title: 'Kiosk clock-in',
  robots: { index: false, follow: false },
};

/**
 * Deliberately outside the (app) route group - a sibling top-level route,
 * not a child of apps/web/src/app/(app)/layout.tsx, so it never gets that
 * layout's admin AppShell (sidebar nav, account menu, etc.). This is the
 * only thing a shared physical device should ever show.
 *
 * Middleware still requires a session to reach this path - a device signs
 * in once with its own SystemRole.KIOSK account (see
 * team-members-form-schema.ts) via /login?from=/attendance/kiosk, and the
 * browser session then stays on the device indefinitely.
 */
export default async function KioskPage() {
  const session = await getSession();

  if (session?.role !== 'KIOSK' || !session.tenantId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background p-8 text-center">
        <h1 className="text-xl font-semibold">Kiosk device sign-in required</h1>
        <p className="text-muted-foreground">
          Sign in with this device&apos;s own kiosk account to use this page.
        </p>
      </div>
    );
  }

  return <KioskApp tenantId={session.tenantId} />;
}
