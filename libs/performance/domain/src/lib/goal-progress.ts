export function isValidProgressPercent(progressPercent: number): boolean {
  return Number.isInteger(progressPercent) && progressPercent >= 0 && progressPercent <= 100;
}
