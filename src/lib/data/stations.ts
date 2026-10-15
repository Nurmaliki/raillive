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
  { code: "PSE", name: "Pasar Senen", city: "Jakarta", operators: ["KAI", "KRL"], lat: -6.1728, lng: 106.84399 },
  { code: "JAKK", name: "Jakarta Kota", city: "Jakarta", operators: ["KAI", "KRL"], lat: -6.13786, lng: 106.81485 },
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
  { code: "JAY", name: "Jayakarta", city: "Jakarta", operators: ["KRL"], lat: -6.1421, lng: 106.82352 },
  { code: "MGB", name: "Mangga Besar", city: "Jakarta", operators: ["KRL"], lat: -6.15128, lng: 106.82718 },
  { code: "SWB", name: "Sawah Besar", city: "Jakarta", operators: ["KRL"], lat: -6.16179, lng: 106.82804 },
  { code: "JUA", name: "Juanda", city: "Jakarta", operators: ["KRL"], lat: -6.16756, lng: 106.83041 },
  { code: "GDD", name: "Gondangdia", city: "Jakarta", operators: ["KRL"], lat: -6.18691, lng: 106.83296 },
  { code: "CKI", name: "Cikini", city: "Jakarta", operators: ["KRL"], lat: -6.19937, lng: 106.84187 },
  { code: "MRI", name: "Manggarai", city: "Jakarta", operators: ["KRL"], lat: -6.21053, lng: 106.85024 },
  { code: "TEB", name: "Tebet", city: "Jakarta", operators: ["KRL"], lat: -6.22753, lng: 106.85843 },
  { code: "CW", name: "Cawang", city: "Jakarta", operators: ["KRL"], lat: -6.24255, lng: 106.85863 },
  { code: "DRN", name: "Duren Kalibata", city: "Jakarta", operators: ["KRL"], lat: -6.25547, lng: 106.85508 },
  { code: "PSMB", name: "Pasar Minggu Baru", city: "Jakarta", operators: ["KRL"], lat: -6.26433, lng: 106.85117 },
  { code: "PSM", name: "Pasar Minggu", city: "Jakarta", operators: ["KRL"], lat: -6.28376, lng: 106.84471 },
  { code: "TNT", name: "Tanjung Barat", city: "Jakarta", operators: ["KRL"], lat: -6.30969, lng: 106.83863 },
  { code: "LNA", name: "Lenteng Agung", city: "Jakarta", operators: ["KRL"], lat: -6.33062, lng: 106.83482 },
  { code: "UP", name: "Universitas Pancasila", city: "Jakarta", operators: ["KRL"], lat: -6.34066, lng: 106.83392 },
  { code: "UI", name: "Universitas Indonesia", city: "Depok", operators: ["KRL"], lat: -6.36053, lng: 106.83179 },
  { code: "POC", name: "Pondok Cina", city: "Depok", operators: ["KRL"], lat: -6.36895, lng: 106.83208 },
  { code: "DPB", name: "Depok Baru", city: "Depok", operators: ["KRL"], lat: -6.39212, lng: 106.82132 },
  { code: "DPK", name: "Depok", city: "Depok", operators: ["KRL"], lat: -6.40502, lng: 106.81695 },
  { code: "CTA", name: "Citayam", city: "Depok", operators: ["KRL"], lat: -6.45005, lng: 106.80214 },
  { code: "BJD", name: "Bojonggede", city: "Bogor", operators: ["KRL"], lat: -6.49402, lng: 106.79497 },
  { code: "CLT", name: "Cilebut", city: "Bogor", operators: ["KRL"], lat: -6.5321, lng: 106.8005 },
  { code: "BOG", name: "Bogor", city: "Bogor", operators: ["KRL"], lat: -6.59428, lng: 106.79072 },
  // Cabang Nambo (Lin Bogor): Citayam – Pondok Rajeg – Cibinong – Nambo
  { code: "PDRG", name: "Pondok Rajeg", city: "Bogor", operators: ["KRL"], lat: -6.460783, lng: 106.824296 },
  { code: "CBN", name: "Cibinong", city: "Bogor", operators: ["KRL"], lat: -6.464248, lng: 106.85252 },
  { code: "NMO", name: "Nambo", city: "Bogor", operators: ["KRL"], lat: -6.466282, lng: 106.906269 },

  // --- Lin Cikarang (Biru): Cikarang – Jatinegara – Pasar Senen – Jakarta Kota ---
  { code: "CKR", name: "Cikarang", city: "Bekasi", operators: ["KAI", "KRL"], lat: -6.25555, lng: 107.14576 },
  { code: "MTM", name: "Metland Telagamurni", city: "Bekasi", operators: ["KRL"], lat: -6.25731, lng: 107.11236 },
  { code: "CIT", name: "Cibitung", city: "Bekasi", operators: ["KRL"], lat: -6.26153, lng: 107.08565 },
  { code: "TBN", name: "Tambun", city: "Bekasi", operators: ["KRL"], lat: -6.25874, lng: 107.05646 },
  { code: "BKST", name: "Bekasi Timur", city: "Bekasi", operators: ["KRL"], lat: -6.24633, lng: 107.01697 },
  { code: "BEK", name: "Bekasi", city: "Bekasi", operators: ["KRL"], lat: -6.23694, lng: 106.99979 },
  { code: "KRI", name: "Kranji", city: "Bekasi", operators: ["KRL"], lat: -6.22507, lng: 106.98079 },
  { code: "CUK", name: "Cakung", city: "Jakarta", operators: ["KRL"], lat: -6.21906, lng: 106.95206 },
  { code: "KLDB", name: "Klender Baru", city: "Jakarta", operators: ["KRL"], lat: -6.21751, lng: 106.93926 },
  { code: "BUA", name: "Buaran", city: "Jakarta", operators: ["KRL"], lat: -6.21538, lng: 106.9214 },
  { code: "KLD", name: "Klender", city: "Jakarta", operators: ["KRL"], lat: -6.21335, lng: 106.90064 },
  { code: "JNG", name: "Jatinegara", city: "Jakarta", operators: ["KAI", "KRL"], lat: -6.21472, lng: 106.86953 },
  { code: "KMO", name: "Kemayoran", city: "Jakarta", operators: ["KRL"], lat: -6.16256, lng: 106.84172 },
  { code: "RJW", name: "Rajawali", city: "Jakarta", operators: ["KRL"], lat: -6.14632, lng: 106.83716 },
  { code: "KPB", name: "Kampung Bandan", city: "Jakarta", operators: ["KRL"], lat: -6.13316, lng: 106.82777 },
  { code: "AK", name: "Angke", city: "Jakarta", operators: ["KRL"], lat: -6.14583, lng: 106.80083 },
  // Stasiun jalur layang Cikarang Loop (Manggarai–Duri & Jatinegara–Pasar Senen)
  { code: "MTR", name: "Matraman", city: "Jakarta", operators: ["KRL"], lat: -6.212567, lng: 106.859753 },
  { code: "SUD", name: "Sudirman", city: "Jakarta", operators: ["KRL"], lat: -6.202408, lng: 106.823449 },
  { code: "SUDB", name: "Sudirman Baru (BNI City)", city: "Jakarta", operators: ["KRL"], lat: -6.201594, lng: 106.819717 },
  { code: "KAT", name: "Karet", city: "Jakarta", operators: ["KRL"], lat: -6.200817, lng: 106.8159 },
  { code: "POK", name: "Pondok Jati", city: "Jakarta", operators: ["KRL"], lat: -6.209124, lng: 106.862342 },
  { code: "KMT", name: "Kramat", city: "Jakarta", operators: ["KRL"], lat: -6.19362, lng: 106.856512 },
  { code: "GST", name: "Gang Sentiong", city: "Jakarta", operators: ["KRL"], lat: -6.186153, lng: 106.850871 },

  // --- Lin Tangerang (Coklat): Duri – Tangerang ---
  { code: "DU", name: "Duri", city: "Jakarta", operators: ["KRL"], lat: -6.15444, lng: 106.80133 },
  { code: "GRG", name: "Grogol", city: "Jakarta", operators: ["KRL"], lat: -6.16197, lng: 106.78727 },
  { code: "PSG", name: "Pesing", city: "Jakarta", operators: ["KRL"], lat: -6.16121, lng: 106.77158 },
  { code: "TKO", name: "Taman Kota", city: "Jakarta", operators: ["KRL"], lat: -6.15821, lng: 106.75456 },
  { code: "BJI", name: "Bojong Indah", city: "Jakarta", operators: ["KRL"], lat: -6.16056, lng: 106.73504 },
  { code: "RWB", name: "Rawa Buaya", city: "Jakarta", operators: ["KRL"], lat: -6.1627, lng: 106.72277 },
  { code: "KDS", name: "Kalideres", city: "Jakarta", operators: ["KRL"], lat: -6.16611, lng: 106.7025 },
  { code: "POR", name: "Poris", city: "Tangerang", operators: ["KRL"], lat: -6.16981, lng: 106.68028 },
  { code: "BTP", name: "Batu Ceper", city: "Tangerang", operators: ["KRL"], lat: -6.17241, lng: 106.66394 },
  { code: "TTI", name: "Tanah Tinggi", city: "Tangerang", operators: ["KRL"], lat: -6.17498, lng: 106.64785 },
  { code: "TNG", name: "Tangerang", city: "Tangerang", operators: ["KRL"], lat: -6.1769, lng: 106.63201 },

  // --- Lin Rangkasbitung (Hijau): Tanah Abang – Rangkasbitung ---
  { code: "THB", name: "Tanah Abang", city: "Jakarta", operators: ["KRL"], lat: -6.1848, lng: 106.8109 },
  { code: "PLM", name: "Palmerah", city: "Jakarta", operators: ["KRL"], lat: -6.20624, lng: 106.79808 },
  { code: "KBO", name: "Kebayoran", city: "Jakarta", operators: ["KRL"], lat: -6.23599, lng: 106.78294 },
  { code: "PSR", name: "Pesanggrahan", city: "Jakarta", operators: ["KRL"], lat: -6.25542, lng: 106.76501 },
  { code: "PDR", name: "Pondok Ranji", city: "Tangerang Selatan", operators: ["KRL"], lat: -6.27631, lng: 106.74519 },
  { code: "SDM", name: "Sudimara", city: "Tangerang Selatan", operators: ["KRL"], lat: -6.29623, lng: 106.71372 },
  { code: "JMU", name: "Jurangmangu", city: "Tangerang Selatan", operators: ["KRL"], lat: -6.288582, lng: 106.729146 },
  { code: "RBT", name: "Rawa Buntu", city: "Tangerang Selatan", operators: ["KRL"], lat: -6.3145, lng: 106.67675 },
  { code: "SERP", name: "Serpong", city: "Tangerang Selatan", operators: ["KRL"], lat: -6.3201, lng: 106.66474 },
  { code: "CSK", name: "Cisauk", city: "Tangerang", operators: ["KRL"], lat: -6.32491, lng: 106.64057 },
  { code: "CCY", name: "Cicayur", city: "Tangerang", operators: ["KRL"], lat: -6.32999, lng: 106.61817 },
  { code: "PRP", name: "Parung Panjang", city: "Bogor", operators: ["KRL"], lat: -6.34435, lng: 106.5703 },
  { code: "CLJ", name: "Cilejit", city: "Tangerang", operators: ["KRL"], lat: -6.3548, lng: 106.51053 },
  { code: "DRU", name: "Daru", city: "Tangerang", operators: ["KRL"], lat: -6.33878, lng: 106.49299 },
  { code: "TNJ", name: "Tenjo", city: "Bogor", operators: ["KRL"], lat: -6.32748, lng: 106.46207 },
  { code: "TGR", name: "Tigaraksa", city: "Tangerang", operators: ["KRL"], lat: -6.32843, lng: 106.43508 },
  { code: "CKY", name: "Cikoya", city: "Tangerang", operators: ["KRL"], lat: -6.33565, lng: 106.41164 },
  { code: "MJA", name: "Maja", city: "Lebak", operators: ["KRL"], lat: -6.33267, lng: 106.39693 },
  { code: "CTR", name: "Citeras", city: "Lebak", operators: ["KRL"], lat: -6.33484, lng: 106.33393 },
  { code: "RK", name: "Rangkasbitung", city: "Lebak", operators: ["KRL"], lat: -6.35268, lng: 106.25154 },

  // --- Lin Tanjung Priok (Pink): Jakarta Kota – Tanjung Priok ---
  { code: "ANC", name: "Ancol", city: "Jakarta", operators: ["KRL"], lat: -6.12819, lng: 106.84463 },
  { code: "JIS", name: "Jakarta International Stadium", city: "Jakarta", operators: ["KRL"], lat: -6.12293, lng: 106.86106 },
  { code: "TPK", name: "Tanjung Priok", city: "Jakarta", operators: ["KRL"], lat: -6.11061, lng: 106.88144 },

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
