export function remainingDays(entitledDays: number, usedDays: number): number {
  return entitledDays - usedDays;
}

export function hasSufficientBalance(
  entitledDays: number,
  usedDays: number,
  daysRequested: number,
): boolean {
  return remainingDays(entitledDays, usedDays) >= daysRequested;
}
