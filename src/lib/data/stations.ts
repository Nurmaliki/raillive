import type { Station } from "@/lib/types";

/**
 * Dataset stasiun. Pada mode produksi ini bisa diganti dengan hasil
 * panggilan API (lihat `src/lib/providers/rajakai.ts`).
 */
export const STATIONS: Station[] = [
  // --- KAI Antarkota: Jawa ---
  { code: "GMR", name: "Gambir", city: "Jakarta", operators: ["KAI"], lat: -6.1766, lng: 106.8306 },
  { code: "PSE", name: "Pasar Senen", city: "Jakarta", operators: ["KAI"], lat: -6.1748, lng: 106.8449 },
  { code: "JAKK", name: "Jakarta Kota", city: "Jakarta", operators: ["KAI", "KRL"], lat: -6.1376, lng: 106.8147 },
  { code: "KRW", name: "Karawang", city: "Karawang", operators: ["KAI"], lat: -6.3053, lng: 107.2933 },
  { code: "CKP", name: "Cikampek", city: "Karawang", operators: ["KAI"], lat: -6.4022, lng: 107.4578 },
  { code: "PWK", name: "Purwakarta", city: "Purwakarta", operators: ["KAI"], lat: -6.5562, lng: 107.4433 },
  { code: "CN", name: "Cirebon", city: "Cirebon", operators: ["KAI"], lat: -6.7044, lng: 108.5542 },
  { code: "TGL", name: "Tegal", city: "Tegal", operators: ["KAI"], lat: -6.8706, lng: 109.1372 },
  { code: "PK", name: "Pekalongan", city: "Pekalongan", operators: ["KAI"], lat: -6.8886, lng: 109.6653 },
  { code: "SMC", name: "Semarang Tawang", city: "Semarang", operators: ["KAI"], lat: -6.9647, lng: 110.4281 },
  { code: "SMT", name: "Semarang Poncol", city: "Semarang", operators: ["KAI"], lat: -6.9728, lng: 110.4158 },
  { code: "KTA", name: "Kutoarjo", city: "Purworejo", operators: ["KAI"], lat: -7.7228, lng: 109.9067 },
  { code: "PWT", name: "Purwokerto", city: "Purwokerto", operators: ["KAI"], lat: -7.4244, lng: 109.2342 },
  { code: "YK", name: "Yogyakarta Tugu", city: "Yogyakarta", operators: ["KAI"], lat: -7.7892, lng: 110.3636 },
  { code: "LPN", name: "Lempuyangan", city: "Yogyakarta", operators: ["KAI"], lat: -7.7906, lng: 110.3797 },
  { code: "SLO", name: "Solo Balapan", city: "Surakarta", operators: ["KAI"], lat: -7.5567, lng: 110.8178 },
  { code: "TSM", name: "Tasikmalaya", city: "Tasikmalaya", operators: ["KAI"], lat: -7.3247, lng: 108.2242 },
  { code: "BD", name: "Bandung", city: "Bandung", operators: ["KAI"], lat: -6.9144, lng: 107.6025 },
  { code: "ML", name: "Malang", city: "Malang", operators: ["KAI"], lat: -7.9772, lng: 112.6375 },
  { code: "SB", name: "Surabaya Gubeng", city: "Surabaya", operators: ["KAI"], lat: -7.2653, lng: 112.7519 },
  { code: "SBI", name: "Surabaya Pasar Turi", city: "Surabaya", operators: ["KAI"], lat: -7.2333, lng: 112.7311 },

  // --- KRL Commuter Jabodetabek ---
  { code: "BOG", name: "Bogor", city: "Bogor", operators: ["KRL"], lat: -6.5944, lng: 106.7906 },
  { code: "DPK", name: "Depok", city: "Depok", operators: ["KRL"], lat: -6.4044, lng: 106.8189 },
  { code: "THB", name: "Tanah Abang", city: "Jakarta", operators: ["KRL"], lat: -6.1856, lng: 106.8106 },
  { code: "MRI", name: "Manggarai", city: "Jakarta", operators: ["KRL"], lat: -6.2100, lng: 106.8500 },
  { code: "SUD", name: "Sudirman", city: "Jakarta", operators: ["KRL"], lat: -6.2025, lng: 106.8231 },
  { code: "TNG", name: "Tangerang", city: "Tangerang", operators: ["KRL"], lat: -6.1778, lng: 106.6306 },
  { code: "SERP", name: "Serpong", city: "Tangerang Selatan", operators: ["KRL"], lat: -6.3206, lng: 106.6650 },
  { code: "BEK", name: "Bekasi", city: "Bekasi", operators: ["KRL"], lat: -6.2367, lng: 106.9989 },
  { code: "CKR", name: "Cikarang", city: "Bekasi", operators: ["KRL"], lat: -6.2611, lng: 107.1489 },

  // --- MRT Jakarta ---
  { code: "BHI", name: "Bundaran HI", city: "Jakarta", operators: ["MRT"], lat: -6.1944, lng: 106.8231 },
  { code: "DKA", name: "Dukuh Atas", city: "Jakarta", operators: ["MRT", "LRT"], lat: -6.2006, lng: 106.8228 },
  { code: "BLO", name: "Blok M", city: "Jakarta", operators: ["MRT"], lat: -6.2444, lng: 106.7989 },
  { code: "LBB", name: "Lebak Bulus", city: "Jakarta", operators: ["MRT"], lat: -6.2894, lng: 106.7747 },

  // --- LRT Jabodebek ---
  { code: "HJM", name: "Harjamukti", city: "Depok", operators: ["LRT"], lat: -6.3739, lng: 106.8942 },
  { code: "CWG", name: "Cawang", city: "Jakarta", operators: ["LRT"], lat: -6.2436, lng: 106.8694 },
  { code: "BKS", name: "Bekasi Barat", city: "Bekasi", operators: ["LRT"], lat: -6.2444, lng: 106.9917 },
];

const BY_CODE = new Map(STATIONS.map((s) => [s.code, s]));

export function getStation(code: string): Station | undefined {
  return BY_CODE.get(code.toUpperCase());
}

export function stationName(code: string): string {
  return BY_CODE.get(code.toUpperCase())?.name ?? code;
}

/** Pencarian stasiun berdasarkan nama/kota/kode (case-insensitive). */
export function searchStations(query: string, limit = 10): Station[] {
  const q = query.trim().toLowerCase();
  if (!q) return STATIONS.slice(0, limit);
  const scored = STATIONS.map((s) => {
    const name = s.name.toLowerCase();
    const city = s.city.toLowerCase();
    const code = s.code.toLowerCase();
    let score = -1;
    if (code === q || name === q) score = 100;
    else if (name.startsWith(q) || city.startsWith(q)) score = 80;
    else if (code.startsWith(q)) score = 70;
    else if (name.includes(q) || city.includes(q)) score = 50;
    return { s, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.s);
}

/** Jarak lingkaran besar antara dua koordinat (km). */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
