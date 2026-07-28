'use client';

import { toast } from 'sonner';
import { useForgetAllDevices } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';

export function ForgetDevicesButton() {
  const forgetAllDevices = useForgetAllDevices();

  async function handleClick() {
    try {
      await forgetAllDevices.mutateAsync();
      toast.success('Every remembered device will now be asked for a code again');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to forget trusted devices'));
    }
  }

  return (
    <Button type="button" variant="outline" onClick={handleClick} disabled={forgetAllDevices.isPending}>
      {forgetAllDevices.isPending ? 'Forgetting…' : 'Forget all trusted devices'}
    </Button>
  );
}
