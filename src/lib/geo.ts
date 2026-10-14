import type { Station } from "@/lib/types";

export interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/** Hitung bounding box dari daftar stasiun, dengan padding. */
export function computeBounds(stations: Station[], pad = 0.15): Bounds {
  const lats = stations.map((s) => s.lat);
  const lngs = stations.map((s) => s.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const dLat = Math.max(0.1, maxLat - minLat) * pad;
  const dLng = Math.max(0.1, maxLng - minLng) * pad;
  return {
    minLat: minLat - dLat,
    maxLat: maxLat + dLat,
    minLng: minLng - dLng,
    maxLng: maxLng + dLng,
  };
}

/**
 * Proyeksi equirectangular sederhana dari koordinat -> piksel dalam viewBox.
 * Catatan: lintang dibalik (utara di atas).
 */
export function project(
  lat: number,
  lng: number,
  b: Bounds,
  width: number,
  height: number,
): { x: number; y: number } {
  const x = ((lng - b.minLng) / (b.maxLng - b.minLng)) * width;
  const y = ((b.maxLat - lat) / (b.maxLat - b.minLat)) * height;
  return { x, y };
}
