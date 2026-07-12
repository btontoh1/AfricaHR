import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export function ErrorState({ message, className }: { message: string; className?: string }) {
  return (
    <Alert variant="destructive" className={cn(className)}>
      <AlertCircle className="size-4" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
