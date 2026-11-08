import type { GoalPerspective } from './types';

export const GOAL_PERSPECTIVES: GoalPerspective[] = ['FINANCIAL', 'CUSTOMER', 'PEOPLE', 'RISK_CONTROL'];

export const GOAL_PERSPECTIVE_LABEL: Record<GoalPerspective, string> = {
  FINANCIAL: 'Financial',
  CUSTOMER: 'Customer',
  PEOPLE: 'People',
  RISK_CONTROL: 'Risk & Control',
};
