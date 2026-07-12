import { Badge } from '@/components/ui/badge';
import type { ApplicationStage } from './types';

const STAGE_VARIANT: Record<
  ApplicationStage,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  APPLIED: 'outline',
  SCREENING: 'outline',
  INTERVIEW: 'default',
  OFFER: 'warning',
  HIRED: 'success',
  REJECTED: 'destructive',
  WITHDRAWN: 'secondary',
};

export function ApplicationStageBadge({ stage }: { stage: ApplicationStage }) {
  return <Badge variant={STAGE_VARIANT[stage]}>{stage}</Badge>;
}
