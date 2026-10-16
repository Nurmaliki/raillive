export interface TimedStop {
  arriveMinute: number | null;
  departMinute: number | null;
}

/** Stasiun terakhir yang sudah dicapai berdasarkan waktu tiba terjadwal. */
export function currentStopIndex(stops: TimedStop[], nowMinute: number): number {
  let index = 0;
  for (let i = 0; i < stops.length; i++) {
    const reachedAt = stops[i].arriveMinute ?? stops[i].departMinute;
    if (reachedAt !== null && reachedAt <= nowMinute) index = i;
    else break;
  }
  return index;
}
