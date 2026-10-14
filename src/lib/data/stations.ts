import type { Station } from "@/lib/types";
import { TRAINS } from "@/lib/data/trains";

/**
 * Dataset stasiun. Pada mode produksi ini bisa diganti dengan hasil
 * panggilan API (lihat `src/lib/providers/rajakai.ts`).
 *
 * Cakupan: KAI Antarkota (Jawa), KRL Commuter Jabodetabek (5 lin resmi),
 * MRT Jakarta, dan LRT Jabodebek.
 *
 * Daftar lin tiap stasiun (`lines`) diturunkan otomatis dari `TRAINS`
 * sehingga selalu konsisten dengan rute yang benar-benar dilayani.
 */
const RAW_STATIONS: Station[] = [
  // --- KAI Antarkota: Jawa ---
  { code: "GMR", name: "Gambir", city: "Jakarta", operators: ["KAI"], lat: -6.1766, lng: 106.8306 },
  { code: "PSE", name: "Pasar Senen", city: "Jakarta", operators: ["KAI", "KRL"], lat: -6.1748, lng: 106.8449 },
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

  // ===================== KRL COMMUTER JABODETABEK =====================
  // --- Lin Bogor (Merah): Jakarta Kota – Manggarai – Bogor ---
  { code: "JAY", name: "Jayakarta", city: "Jakarta", operators: ["KRL"], lat: -6.1403, lng: 106.8222 },
  { code: "MGB", name: "Mangga Besar", city: "Jakarta", operators: ["KRL"], lat: -6.1476, lng: 106.8267 },
  { code: "SWB", name: "Sawah Besar", city: "Jakarta", operators: ["KRL"], lat: -6.156, lng: 106.8285 },
  { code: "JUA", name: "Juanda", city: "Jakarta", operators: ["KRL"], lat: -6.1663, lng: 106.83 },
  { code: "GDD", name: "Gondangdia", city: "Jakarta", operators: ["KRL"], lat: -6.1856, lng: 106.833 },
  { code: "CKI", name: "Cikini", city: "Jakarta", operators: ["KRL"], lat: -6.1919, lng: 106.841 },
  { code: "MRI", name: "Manggarai", city: "Jakarta", operators: ["KRL"], lat: -6.21, lng: 106.85 },
  { code: "TEB", name: "Tebet", city: "Jakarta", operators: ["KRL"], lat: -6.2261, lng: 106.8583 },
  { code: "CW", name: "Cawang", city: "Jakarta", operators: ["KRL"], lat: -6.2436, lng: 106.8694 },
  { code: "DRN", name: "Duren Kalibata", city: "Jakarta", operators: ["KRL"], lat: -6.2562, lng: 106.8689 },
  { code: "PSMB", name: "Pasar Minggu Baru", city: "Jakarta", operators: ["KRL"], lat: -6.2694, lng: 106.8647 },
  { code: "PSM", name: "Pasar Minggu", city: "Jakarta", operators: ["KRL"], lat: -6.2842, lng: 106.8447 },
  { code: "TNT", name: "Tanjung Barat", city: "Jakarta", operators: ["KRL"], lat: -6.2964, lng: 106.832 },
  { code: "LNA", name: "Lenteng Agung", city: "Jakarta", operators: ["KRL"], lat: -6.3108, lng: 106.834 },
  { code: "UP", name: "Universitas Pancasila", city: "Jakarta", operators: ["KRL"], lat: -6.3352, lng: 106.8322 },
  { code: "UI", name: "Universitas Indonesia", city: "Depok", operators: ["KRL"], lat: -6.3603, lng: 106.8317 },
  { code: "POC", name: "Pondok Cina", city: "Depok", operators: ["KRL"], lat: -6.3778, lng: 106.83 },
  { code: "DPB", name: "Depok Baru", city: "Depok", operators: ["KRL"], lat: -6.395, lng: 106.826 },
  { code: "DPK", name: "Depok", city: "Depok", operators: ["KRL"], lat: -6.4044, lng: 106.8189 },
  { code: "CTA", name: "Citayam", city: "Depok", operators: ["KRL"], lat: -6.4407, lng: 106.8097 },
  { code: "BJD", name: "Bojonggede", city: "Bogor", operators: ["KRL"], lat: -6.4833, lng: 106.7983 },
  { code: "CLT", name: "Cilebut", city: "Bogor", operators: ["KRL"], lat: -6.53, lng: 106.8 },
  { code: "BOG", name: "Bogor", city: "Bogor", operators: ["KRL"], lat: -6.5944, lng: 106.7906 },

  // --- Lin Cikarang (Biru): Cikarang – Jatinegara – Pasar Senen – Jakarta Kota ---
  { code: "CKR", name: "Cikarang", city: "Bekasi", operators: ["KAI", "KRL"], lat: -6.2611, lng: 107.1489 },
  { code: "MTM", name: "Metland Telagamurni", city: "Bekasi", operators: ["KRL"], lat: -6.256, lng: 107.129 },
  { code: "CIT", name: "Cibitung", city: "Bekasi", operators: ["KRL"], lat: -6.254, lng: 107.106 },
  { code: "TBN", name: "Tambun", city: "Bekasi", operators: ["KRL"], lat: -6.253, lng: 107.07 },
  { code: "BKST", name: "Bekasi Timur", city: "Bekasi", operators: ["KRL"], lat: -6.24, lng: 107.015 },
  { code: "BEK", name: "Bekasi", city: "Bekasi", operators: ["KRL"], lat: -6.2367, lng: 106.9989 },
  { code: "KRI", name: "Kranji", city: "Bekasi", operators: ["KRL"], lat: -6.228, lng: 106.979 },
  { code: "CUK", name: "Cakung", city: "Jakarta", operators: ["KRL"], lat: -6.21, lng: 106.95 },
  { code: "KLDB", name: "Klender Baru", city: "Jakarta", operators: ["KRL"], lat: -6.213, lng: 106.93 },
  { code: "BUA", name: "Buaran", city: "Jakarta", operators: ["KRL"], lat: -6.218, lng: 106.915 },
  { code: "KLD", name: "Klender", city: "Jakarta", operators: ["KRL"], lat: -6.224, lng: 106.899 },
  { code: "JNG", name: "Jatinegara", city: "Jakarta", operators: ["KAI", "KRL"], lat: -6.215, lng: 106.87 },
  { code: "KMO", name: "Kemayoran", city: "Jakarta", operators: ["KRL"], lat: -6.164, lng: 106.845 },
  { code: "RJW", name: "Rajawali", city: "Jakarta", operators: ["KRL"], lat: -6.151, lng: 106.833 },
  { code: "KPB", name: "Kampung Bandan", city: "Jakarta", operators: ["KRL"], lat: -6.145, lng: 106.82 },

  // --- Lin Tangerang (Coklat): Duri – Tangerang ---
  { code: "DU", name: "Duri", city: "Jakarta", operators: ["KRL"], lat: -6.152, lng: 106.797 },
  { code: "GRG", name: "Grogol", city: "Jakarta", operators: ["KRL"], lat: -6.161, lng: 106.788 },
  { code: "PSG", name: "Pesing", city: "Jakarta", operators: ["KRL"], lat: -6.166, lng: 106.77 },
  { code: "TKO", name: "Taman Kota", city: "Jakarta", operators: ["KRL"], lat: -6.169, lng: 106.75 },
  { code: "BJI", name: "Bojong Indah", city: "Jakarta", operators: ["KRL"], lat: -6.17, lng: 106.73 },
  { code: "RWB", name: "Rawa Buaya", city: "Jakarta", operators: ["KRL"], lat: -6.172, lng: 106.71 },
  { code: "KDS", name: "Kalideres", city: "Jakarta", operators: ["KRL"], lat: -6.165, lng: 106.695 },
  { code: "POR", name: "Poris", city: "Tangerang", operators: ["KRL"], lat: -6.17, lng: 106.68 },
  { code: "BTP", name: "Batu Ceper", city: "Tangerang", operators: ["KRL"], lat: -6.175, lng: 106.665 },
  { code: "TTI", name: "Tanah Tinggi", city: "Tangerang", operators: ["KRL"], lat: -6.178, lng: 106.65 },
  { code: "TNG", name: "Tangerang", city: "Tangerang", operators: ["KRL"], lat: -6.1778, lng: 106.6306 },

  // --- Lin Rangkasbitung (Hijau): Tanah Abang – Rangkasbitung ---
  { code: "THB", name: "Tanah Abang", city: "Jakarta", operators: ["KRL"], lat: -6.1856, lng: 106.8106 },
  { code: "PLM", name: "Palmerah", city: "Jakarta", operators: ["KRL"], lat: -6.193, lng: 106.792 },
  { code: "KBO", name: "Kebayoran", city: "Jakarta", operators: ["KRL"], lat: -6.225, lng: 106.783 },
  { code: "PSR", name: "Pesanggrahan", city: "Jakarta", operators: ["KRL"], lat: -6.247, lng: 106.76 },
  { code: "PDR", name: "Pondok Ranji", city: "Tangerang Selatan", operators: ["KRL"], lat: -6.27, lng: 106.74 },
  { code: "SDM", name: "Sudimara", city: "Tangerang Selatan", operators: ["KRL"], lat: -6.29, lng: 106.72 },
  { code: "RBT", name: "Rawa Buntu", city: "Tangerang Selatan", operators: ["KRL"], lat: -6.305, lng: 106.685 },
  { code: "SERP", name: "Serpong", city: "Tangerang Selatan", operators: ["KRL"], lat: -6.3206, lng: 106.665 },
  { code: "CSK", name: "Cisauk", city: "Tangerang", operators: ["KRL"], lat: -6.335, lng: 106.64 },
  { code: "CCY", name: "Cicayur", city: "Tangerang", operators: ["KRL"], lat: -6.35, lng: 106.62 },
  { code: "PRP", name: "Parung Panjang", city: "Bogor", operators: ["KRL"], lat: -6.38, lng: 106.59 },
  { code: "CLJ", name: "Cilejit", city: "Tangerang", operators: ["KRL"], lat: -6.41, lng: 106.57 },
  { code: "DRU", name: "Daru", city: "Tangerang", operators: ["KRL"], lat: -6.43, lng: 106.56 },
  { code: "TNJ", name: "Tenjo", city: "Bogor", operators: ["KRL"], lat: -6.45, lng: 106.55 },
  { code: "TGR", name: "Tigaraksa", city: "Tangerang", operators: ["KRL"], lat: -6.48, lng: 106.53 },
  { code: "CKY", name: "Cikoya", city: "Tangerang", operators: ["KRL"], lat: -6.5, lng: 106.53 },
  { code: "MJA", name: "Maja", city: "Lebak", operators: ["KRL"], lat: -6.52, lng: 106.53 },
  { code: "CTR", name: "Citeras", city: "Lebak", operators: ["KRL"], lat: -6.56, lng: 106.54 },
  { code: "RK", name: "Rangkasbitung", city: "Lebak", operators: ["KRL"], lat: -6.6, lng: 106.55 },

  // --- Lin Tanjung Priok (Pink): Jakarta Kota – Tanjung Priok ---
  { code: "ANC", name: "Ancol", city: "Jakarta", operators: ["KRL"], lat: -6.128, lng: 106.835 },
  { code: "JIS", name: "Jakarta International Stadium", city: "Jakarta", operators: ["KRL"], lat: -6.118, lng: 106.86 },
  { code: "TPK", name: "Tanjung Priok", city: "Jakarta", operators: ["KRL"], lat: -6.108, lng: 106.88 },

  // ===================== MRT JAKARTA =====================
  { code: "BHI", name: "Bundaran HI", city: "Jakarta", operators: ["MRT"], lat: -6.1944, lng: 106.8231 },
  { code: "DKA", name: "Dukuh Atas", city: "Jakarta", operators: ["MRT", "LRT"], lat: -6.2006, lng: 106.8228 },
  { code: "BLO", name: "Blok M", city: "Jakarta", operators: ["MRT"], lat: -6.2444, lng: 106.7989 },
  { code: "LBB", name: "Lebak Bulus", city: "Jakarta", operators: ["MRT"], lat: -6.2894, lng: 106.7747 },

  // ===================== LRT JABODEBEK =====================
  { code: "HJM", name: "Harjamukti", city: "Depok", operators: ["LRT"], lat: -6.3739, lng: 106.8942 },
  { code: "CWG", name: "Cawang", city: "Jakarta", operators: ["LRT"], lat: -6.2436, lng: 106.8694 },
  { code: "BKS", name: "Bekasi Barat", city: "Bekasi", operators: ["LRT"], lat: -6.2444, lng: 106.9917 },
];

/** Peta kode stasiun -> daftar kode lin yang benar-benar melewatinya. */
const LINES_BY_STATION = (() => {
  const map = new Map<string, Set<string>>();
  for (const train of TRAINS) {
    if (!train.line) continue;
    for (const stop of train.stops) {
      if (!map.has(stop.stationCode)) map.set(stop.stationCode, new Set());
      map.get(stop.stationCode)!.add(train.line);
    }
  }
  return map;
})();

export const STATIONS: Station[] = RAW_STATIONS.map((s) => {
  const lines = LINES_BY_STATION.get(s.code);
  return lines && lines.size > 0 ? { ...s, lines: Array.from(lines) } : s;
});

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
