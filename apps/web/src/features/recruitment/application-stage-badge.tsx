import { Badge } from '@/components/ui/badge';
import type { ApplicationStage } from './types';

const STAGE_VARIANT: Record<ApplicationStage, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  APPLIED: 'outline',
  SCREENING: 'outline',
  INTERVIEW: 'default',
  OFFER: 'default',
  HIRED: 'secondary',
  REJECTED: 'destructive',
  WITHDRAWN: 'destructive',
};

export function ApplicationStageBadge({ stage }: { stage: ApplicationStage }) {
  return <Badge variant={STAGE_VARIANT[stage]}>{stage}</Badge>;
}
