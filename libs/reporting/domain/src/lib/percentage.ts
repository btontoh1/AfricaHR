// Shared by every report that expresses a rate (leave utilization,
// attendance rate, pipeline conversion): a plain part-over-whole
// percentage, rounded to 2 decimal places, with divide-by-zero defined as
// 0 rather than NaN/Infinity so report responses never need a null check
// downstream.
export function calculatePercentage(part: number, whole: number): number {
  if (whole <= 0) {
    return 0;
  }
  return Math.round((part / whole) * 10000) / 100;
}
