'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Megaphone } from 'lucide-react';
import { useSendPlatformBroadcast } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const broadcastFormSchema = z.object({
  subject: z.string().trim().min(1, 'Required').max(300),
  body: z.string().trim().min(1, 'Required').max(5000),
});

type BroadcastFormValues = z.infer<typeof broadcastFormSchema>;

/**
 * A one-off platform-wide send (e.g. "the Terms changed") - deliberately
 * no draft/history list, unlike SendNotificationForm's tenant-scoped
 * equivalent, since a platform admin broadcast is rare enough that the
 * audit log (platform.notification_broadcast_sent) is the record of it,
 * not a UI of its own.
 */
export function BroadcastForm() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const send = useSendPlatformBroadcast();

  const form = useForm<BroadcastFormValues>({
    resolver: zodResolver(broadcastFormSchema),
    defaultValues: { subject: '', body: '' },
  });

  function openConfirm(values: BroadcastFormValues) {
    void values;
    setConfirmOpen(true);
  }

  async function handleConfirmedSend() {
    const values = form.getValues();
    try {
      const result = await send.mutateAsync(values);
      setConfirmOpen(false);
      form.reset();
      toast.success(
        result
          ? `Sent to ${result.recipientCount} tenant admin${result.recipientCount === 1 ? '' : 's'}${
              result.failureCount ? ` (${result.failureCount} delivery failed)` : ''
            }`
          : 'Broadcast sent',
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to send broadcast'));
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="size-5" />
            Broadcast to every tenant
          </CardTitle>
          <CardDescription>
            Sends one email and in-app notice to the admin of every active tenant - use this for platform-wide
            announcements like a Terms of Service change, not routine support.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(openConfirm)} noValidate className="space-y-4">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Updated Terms of Service" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea rows={6} placeholder="We've updated our Terms of Service to..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit">Review &amp; send</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send to every tenant?</DialogTitle>
            <DialogDescription>
              This emails and sends an in-app notice to the admin of every active tenant on the platform. This
              can&apos;t be recalled once sent.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
            <p className="font-medium">{form.getValues('subject')}</p>
            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{form.getValues('body')}</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirmedSend} disabled={send.isPending}>
              {send.isPending ? 'Sending…' : 'Send broadcast'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
