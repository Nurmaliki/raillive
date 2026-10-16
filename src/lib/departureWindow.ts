/** Benar bila keberangkatan berada dari sekarang hingga akhir rentang. */
export function isUpcomingDeparture(
  departureMinute: number,
  nowMinute: number,
  windowMinutes: number,
): boolean {
  return departureMinute >= nowMinute && departureMinute <= nowMinute + windowMinutes;
}
