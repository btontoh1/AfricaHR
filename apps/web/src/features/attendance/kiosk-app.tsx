'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Delete, Clock, Search, LogIn, LogOut } from 'lucide-react';
import { useKioskClock, useKioskEmployees } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { KioskClockResult, KioskEmployee } from './types';

const MAX_PIN_LENGTH = 6;
const KEYPAD_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];
// The one message the kiosk's own clock endpoint deliberately returns as a
// 401 for an everyday, expected reason (a mistyped PIN) - see
// AttendanceKioskService.clock's doc comment. Any *other* 401 on this
// device (an expired/revoked session, most likely) isn't something a toast
// can fix, so it gets the same hard-reload treatment as a dead employees
// list below - safe either way: if the session is actually still fine,
// /login just bounces straight back to this same screen.
const INCORRECT_PIN_MESSAGE = 'Incorrect PIN';

function getStatusCode(error: unknown): number | undefined {
  return (error as { statusCode?: number } | null)?.statusCode;
}

function isDeadSessionError(error: unknown): boolean {
  return getStatusCode(error) === 401 && getApiErrorMessage(error) !== INCORRECT_PIN_MESSAGE;
}

/**
 * Full-screen, standalone kiosk UI for a shared physical clock-in device -
 * no admin nav, no typing an employeeId. Built for workers who may have
 * limited literacy and no smartphone: tap your name from a big scrollable
 * list (searchable in case the tenant has many employees), then enter your
 * own numeric PIN on an on-screen keypad. Whether that's a clock-in or
 * clock-out is decided by the server from the employee's current open
 * record - there's no separate button to choose.
 */
export function KioskApp({ tenantId }: { tenantId: string }) {
  const { data: employees, isLoading, isError, error } = useKioskEmployees(tenantId);
  const clock = useKioskClock(tenantId);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<KioskEmployee | null>(null);
  const [pin, setPin] = useState('');
  const [result, setResult] = useState<KioskClockResult | null>(null);

  // A hard navigation, not a client-side route change - this device's
  // session may genuinely be gone, and /login re-establishes everything
  // (cookies, the actual login form if needed) from a clean slate. If the
  // session turns out to still be fine, /login's own redirect bounces
  // straight back to this exact screen.
  useEffect(() => {
    if (isDeadSessionError(error)) {
      window.location.href = '/login';
    }
  }, [error]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query || !employees) {
      return employees ?? [];
    }
    return employees.filter((employee) =>
      `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(query),
    );
  }, [employees, search]);

  function reset() {
    setSelected(null);
    setPin('');
    setSearch('');
  }

  function pressDigit(digit: string) {
    if (digit === 'back') {
      setPin((current) => current.slice(0, -1));
      return;
    }
    if (!digit || pin.length >= MAX_PIN_LENGTH) {
      return;
    }
    setPin((current) => current + digit);
  }

  async function handleConfirm() {
    if (!selected || pin.length < 4) {
      return;
    }
    try {
      const outcome = await clock.mutateAsync({ employeeId: selected.id, pin });
      if (outcome) {
        setResult(outcome);
        setTimeout(() => {
          setResult(null);
          reset();
        }, 3000);
      }
    } catch (submitError) {
      if (isDeadSessionError(submitError)) {
        window.location.href = '/login';
        return;
      }
      toast.error(getApiErrorMessage(submitError, 'Incorrect PIN'));
      setPin('');
    }
  }

  if (result) {
    const isIn = result.action === 'CLOCKED_IN';
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8 text-center">
        <div
          className={`flex size-24 items-center justify-center rounded-full ${isIn ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
        >
          {isIn ? <LogIn className="size-12" /> : <LogOut className="size-12" />}
        </div>
        <h1 className="text-3xl font-semibold">{isIn ? 'Clocked in' : 'Clocked out'}</h1>
        <p className="text-xl text-muted-foreground">{result.employeeName}</p>
        <p className="text-sm text-muted-foreground">{new Date(result.at).toLocaleTimeString()}</p>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-8">
        <div className="text-center">
          <Clock className="mx-auto mb-2 size-8 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">{selected.firstName} {selected.lastName}</h1>
          <p className="text-muted-foreground">Enter your PIN</p>
        </div>

        <div className="flex gap-3" aria-label="PIN entered">
          {Array.from({ length: MAX_PIN_LENGTH }).map((_, index) => (
            <div
              key={index}
              className={`size-4 rounded-full border-2 ${index < pin.length ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {KEYPAD_DIGITS.map((digit, index) =>
            digit ? (
              <Button
                key={digit === 'back' ? 'back' : `${digit}-${index}`}
                type="button"
                variant="outline"
                className="size-20 text-2xl"
                onClick={() => pressDigit(digit)}
                aria-label={digit === 'back' ? 'Backspace' : digit}
              >
                {digit === 'back' ? <Delete className="size-6" /> : digit}
              </Button>
            ) : (
              <div key={`empty-${index}`} />
            ),
          )}
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="ghost" size="lg" onClick={reset} disabled={clock.isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            size="lg"
            className="px-10"
            onClick={handleConfirm}
            disabled={pin.length < 4 || clock.isPending}
          >
            {clock.isPending ? 'Checking…' : 'Confirm'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background p-8">
      <div className="mx-auto w-full max-w-xl space-y-6">
        <div className="text-center">
          <Clock className="mx-auto mb-2 size-10 text-primary" />
          <h1 className="text-3xl font-semibold">Tap your name</h1>
          <p className="text-muted-foreground">to clock in or out</p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search your name"
            className="h-14 pl-11 text-lg"
          />
        </div>

        {isLoading && <p className="text-center text-muted-foreground">Loading employees…</p>}
        {isError && (
          <p className="text-center text-destructive">{getApiErrorMessage(error, 'Failed to load employees')}</p>
        )}

        {!isLoading && !isError && (
          <div className="themed-scrollbar max-h-[55vh] space-y-2 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">No matching names</p>
            )}
            {filtered.map((employee) => (
              <button
                key={employee.id}
                type="button"
                onClick={() => setSelected(employee)}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-5 py-4 text-left text-lg transition-colors hover:bg-accent/50"
              >
                <span>
                  {employee.firstName} {employee.lastName}
                </span>
                <span className="text-sm text-muted-foreground">{employee.employeeNumber}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
