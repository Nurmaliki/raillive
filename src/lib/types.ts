/**
 * Tipe data inti aplikasi jadwal kereta real-time.
 *
 * Semua adapter penyedia data (mock, RajaKAI, dst.) WAJIB mengembalikan
 * bentuk data sesuai tipe di file ini, sehingga UI tidak perlu tahu
 * dari mana datanya berasal.
 */

export type Operator = "KAI" | "KRL" | "MRT" | "LRT";

/** Label tampilan + warna aksen untuk tiap operator. */
export const OPERATOR_META: Record<
  Operator,
  { label: string; short: string; color: string }
> = {
  KAI: { label: "KAI Antarkota", short: "KAI", color: "#f97316" },
  KRL: { label: "KRL Commuter", short: "KRL", color: "#ef4444" },
  MRT: { label: "MRT Jakarta", short: "MRT", color: "#0ea5e9" },
  LRT: { label: "LRT Jabodebek", short: "LRT", color: "#8b5cf6" },
};

/** Metadata sebuah lin layanan (KRL/MRT/LRT), untuk label & warna. */
export interface LineInfo {
  name: string;
  short: string;
  color: string;
  operator: Operator;
}

/**
 * Peta lin -> metadata. Kode lin dipakai di `Station.lines` dan `Train.line`.
 * Warna mengikuti peta resmi KAI Commuter / MRT / LRT.
 */
export const LINE_META: Record<string, LineInfo> = {
  bogor: { name: "Lin Bogor", short: "B", color: "#ec2329", operator: "KRL" },
  cikarang: { name: "Lin Cikarang", short: "C", color: "#26baed", operator: "KRL" },
  rangkasbitung: { name: "Lin Rangkasbitung", short: "R", color: "#99ca3e", operator: "KRL" },
  tangerang: { name: "Lin Tangerang", short: "T", color: "#c25f28", operator: "KRL" },
  priok: { name: "Lin Tanjung Priok", short: "TP", color: "#ef509a", operator: "KRL" },
  mrt: { name: "MRT Jakarta", short: "M", color: "#0ea5e9", operator: "MRT" },
  "lrt-bekasi": { name: "LRT Lin Bekasi", short: "L1", color: "#8b5cf6", operator: "LRT" },
  "lrt-cibubur": { name: "LRT Lin Cibubur", short: "L2", color: "#a855f7", operator: "LRT" },
};

/** Urutan tampil lin KRL (untuk legenda & filter). */
export const KRL_LINE_ORDER = ["bogor", "cikarang", "tangerang", "rangkasbitung", "priok"];

export interface Station {
  /** Kode stasiun, mis. "GMR". */
  code: string;
  name: string;
  city: string;
  /** Operator yang melayani stasiun ini. */
  operators: Operator[];
  /** Kode lin yang melewati stasiun ini (mis. ["bogor"]). */
  lines?: string[];
  lat: number;
  lng: number;
}

/** Satu titik perhentian dalam rute kereta. */
export interface Stop {
  stationCode: string;
  /** Jam kedatangan "HH:mm" (null untuk stasiun asal). */
  arrive: string | null;
  /** Jam keberangkatan "HH:mm" (null untuk stasiun tujuan akhir). */
  depart: string | null;
  /** Offset hari (0 = hari keberangkatan). */
  dayOffset: number;
}

export interface Train {
  id: string;
  /** Nomor KA, mis. "1" untuk Argo Bromo Anggrek. */
  number: string;
  name: string;
  operator: Operator;
  serviceClass: string;
  /** Kode lin (mis. "bogor") untuk KRL/MRT/LRT. */
  line?: string;
  stops: Stop[];
}

export type DepartureStatus =
  | "on-time"
  | "delayed"
  | "boarding"
  | "departed"
  | "cancelled";

/** Baris papan keberangkatan di sebuah stasiun. */
export interface Departure {
  trainId: string;
  trainNumber: string;
  trainName: string;
  operator: Operator;
  /** Kode lin (mis. "bogor") untuk KRL/MRT/LRT. */
  line?: string;
  destination: string;
  destinationName: string;
  /** Jam terjadwal "HH:mm". */
  scheduled: string;
  /** Jam aktual (terjadwal + delay) "HH:mm". */
  actual: string;
  delayMin: number;
  platform: string;
  status: DepartureStatus;
}

export type LiveStatusKind =
  | "not-started"
  | "on-time"
  | "delayed"
  | "arrived"
  | "cancelled";

/** Status real-time sebuah kereta yang sedang berjalan. */
export interface LiveStatus {
  trainId: string;
  trainNumber: string;
  trainName: string;
  operator: Operator;
  /** Kode lin (mis. "bogor") untuk KRL/MRT/LRT. */
  line?: string;
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  lastStation: string;
  lastStationName: string;
  nextStation: string | null;
  nextStationName: string | null;
  /** Progres perjalanan 0..1 dari total rute. */
  progress: number;
  position: { lat: number; lng: number };
  speedKmh: number;
  delayMin: number;
  status: LiveStatusKind;
  /** ETA ke stasiun berikutnya "HH:mm", null jika sudah tiba. */
  etaNext: string | null;
  updatedAt: string;
}

/** Hasil pencarian jadwal antar dua stasiun. */
export interface JourneyOption {
  train: Train;
  origin: Station;
  destination: Station;
  /** Jam berangkat terjadwal dari stasiun asal "HH:mm". */
  departTime: string;
  /** Jam tiba terjadwal di stasiun tujuan "HH:mm". */
  arriveTime: string;
  durationMin: number;
  distanceKm: number;
  priceFrom: number;
  delayMin: number;
  live: LiveStatus | null;
}

/** Peringatan / gangguan perjalanan. */
export interface ServiceAlert {
  id: string;
  operator: Operator;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  affectedTrains: string[];
  createdAt: string;
}

/** Rute favorit yang disimpan pengguna. */
export interface FavoriteRoute {
  id: string;
  origin: string;
  destination: string;
  createdAt: string;
  /** Aktifkan notifikasi saat delay melewati ambang ini. */
  notifyDelayOver: number;
}
