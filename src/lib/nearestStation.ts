import type { Station } from "@/lib/types";

/** Cari kode stasiun terdekat dari koordinat perangkat. */
export function nearestStationCode(
  stations: Station[],
  lat: number,
  lng: number,
): string | null {
  let nearest: Station | null = null;
  let shortest = Infinity;
  const lngScale = Math.cos((lat * Math.PI) / 180);

  for (const station of stations) {
    const latDelta = station.lat - lat;
    const lngDelta = (station.lng - lng) * lngScale;
    const distance = latDelta * latDelta + lngDelta * lngDelta;
    if (distance < shortest) {
      shortest = distance;
      nearest = station;
    }
  }

  return nearest?.code ?? null;
}
