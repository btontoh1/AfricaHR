import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
        {Icon && (
          <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
        )}
      </CardHeader>
      <CardContent className="text-2xl font-semibold tracking-tight">{value}</CardContent>
    </Card>
  );
}
