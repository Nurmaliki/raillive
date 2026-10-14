import { haversineKm } from "@/lib/data/stations";

/** Titik [lat, lng]. */
export type LatLng = [number, number];

/** Jalur rel yang sudah disiapkan: titik + jarak kumulatif + total panjang. */
export interface RailPath {
  points: LatLng[];
  /** Jarak kumulatif (km) dari titik awal ke titik ke-i. */
  cumKm: number[];
  /** Panjang total jalur (km). */
  totalKm: number;
}

/** Bangun RailPath (hitung jarak kumulatif) dari daftar titik rel. */
export function buildRailPath(points: LatLng[]): RailPath {
  const cumKm: number[] = [0];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineKm(
      { lat: points[i - 1][0], lng: points[i - 1][1] },
      { lat: points[i][0], lng: points[i][1] },
    );
    cumKm.push(total);
  }
  return { points, cumKm, totalKm: total };
}

/**
 * Proyeksikan sebuah titik ke jalur rel terdekat; kembalikan jarak (km)
 * sepanjang jalur pada titik proyeksi tersebut.
 */
export function projectToRailKm(rail: RailPath, lat: number, lng: number): number {
  let bestKm = 0;
  let bestDist = Infinity;
  const { points, cumKm } = rail;
  for (let i = 1; i < points.length; i++) {
    const [y1, x1] = points[i - 1];
    const [y2, x2] = points[i];
    const dy = y2 - y1;
    const dx = x2 - x1;
    const len2 = dy * dy + dx * dx;
    let t = len2 === 0 ? 0 : ((lat - y1) * dy + (lng - x1) * dx) / len2;
    t = Math.max(0, Math.min(1, t));
    const py = y1 + t * dy;
    const px = x1 + t * dx;
    const d = (lat - py) ** 2 + (lng - px) ** 2;
    if (d < bestDist) {
      bestDist = d;
      bestKm = cumKm[i - 1] + t * (cumKm[i] - cumKm[i - 1]);
    }
  }
  return bestKm;
}

/** Titik [lat, lng] pada jalur rel sejauh `km` dari titik awal. */
export function pointAtRailKm(rail: RailPath, km: number): LatLng {
  const { points, cumKm, totalKm } = rail;
  const target = Math.max(0, Math.min(totalKm, km));
  // Cari segmen yang memuat jarak target.
  let lo = 0;
  let hi = cumKm.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (cumKm[mid] <= target) lo = mid;
    else hi = mid;
  }
  const segKm = cumKm[hi] - cumKm[lo];
  const t = segKm === 0 ? 0 : (target - cumKm[lo]) / segKm;
  const [y1, x1] = points[lo];
  const [y2, x2] = points[hi];
  return [y1 + (y2 - y1) * t, x1 + (x2 - x1) * t];
}

/**
 * Petakan progres berbasis indeks stasiun (0..n-1) ke titik di jalur rel.
 * `stopKms[i]` = jarak rel (km) proyeksi stasiun ke-i.
 */
export function railPointForProgress(
  rail: RailPath,
  stopKms: number[],
  progressIndex: number,
): LatLng {
  const n = stopKms.length;
  const clamped = Math.max(0, Math.min(n - 1, progressIndex));
  const i = Math.min(n - 2, Math.floor(clamped));
  const t = clamped - i;
  const km = stopKms[i] + (stopKms[i + 1] - stopKms[i]) * t;
  return pointAtRailKm(rail, km);
}

/** Titik rel terdekat (koordinat) untuk sebuah titik. */
export function nearestPointOnPath(
  rail: RailPath,
  lat: number,
  lng: number,
): LatLng {
  let best: LatLng = rail.points[0] ?? [lat, lng];
  let bestDist = Infinity;
  const { points } = rail;
  for (let i = 1; i < points.length; i++) {
    const [y1, x1] = points[i - 1];
    const [y2, x2] = points[i];
    const dy = y2 - y1;
    const dx = x2 - x1;
    const len2 = dy * dy + dx * dx;
    let t = len2 === 0 ? 0 : ((lat - y1) * dy + (lng - x1) * dx) / len2;
    t = Math.max(0, Math.min(1, t));
    const py = y1 + t * dy;
    const px = x1 + t * dx;
    const d = (lat - py) ** 2 + (lng - px) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = [py, px];
    }
  }
  return best;
}

/** Potong jalur rel agar hanya mencakup rentang km [fromKm, toKm]. */
export function sliceRail(rail: RailPath, fromKm: number, toKm: number): LatLng[] {
  const a = Math.min(fromKm, toKm);
  const b = Math.max(fromKm, toKm);
  const out: LatLng[] = [pointAtRailKm(rail, a)];
  for (let i = 0; i < rail.points.length; i++) {
    if (rail.cumKm[i] > a && rail.cumKm[i] < b) out.push(rail.points[i]);
  }
  out.push(pointAtRailKm(rail, b));
  return out;
}
