'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useSetClockInPin } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PIN_PATTERN = /^\d{4,6}$/;

export function SetKioskPinControl({ tenantId, employeeId }: { tenantId: string; employeeId: string }) {
  const [pin, setPin] = useState('');
  const setClockInPin = useSetClockInPin(tenantId, employeeId);

  const isValid = PIN_PATTERN.test(pin);

  async function handleSave() {
    if (!isValid) {
      return;
    }
    try {
      await setClockInPin.mutateAsync({ pin });
      toast.success('Kiosk PIN set');
      setPin('');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to set kiosk PIN'));
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="kiosk-pin">New PIN</Label>
        <Input
          id="kiosk-pin"
          inputMode="numeric"
          autoComplete="off"
          placeholder="4-6 digits"
          className="w-40"
          value={pin}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
        />
      </div>
      <Button onClick={handleSave} disabled={!isValid || setClockInPin.isPending}>
        {setClockInPin.isPending ? 'Saving…' : 'Set PIN'}
      </Button>
      <p className="w-full text-xs text-muted-foreground">
        The employee enters this PIN at the kiosk after tapping their name - it's not used anywhere else.
      </p>
    </div>
  );
}
