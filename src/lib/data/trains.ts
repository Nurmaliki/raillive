import type { Operator, Stop, Train } from "@/lib/types";
import { TANGERANG_TRIPS } from "@/lib/data/tangerangTimetable";
import { KRL_REAL_TRIPS } from "@/lib/data/krlRealTimetable";

/**
 * Definisi rute kereta. Jam dalam format "HH:mm" waktu lokal (WIB).
 * `dayOffset` menandai perjalanan yang melewati tengah malam.
 *
 * KAI Antarkota ditulis manual (jumlah rute sedikit, jam khas).
 * KRL/MRT/LRT dibangkitkan otomatis dari spesifikasi lin supaya padat,
 * konsisten, dan mencakup seluruh stasiun di setiap lin.
 */

function s(
  stationCode: string,
  arrive: string | null,
  depart: string | null,
  dayOffset = 0,
): Stop {
  return { stationCode, arrive, depart, dayOffset };
}

/* ==================================================================== */
/* KAI ANTARKOTA (manual)                                               */
/* ==================================================================== */

const KAI_TRAINS: Train[] = [
  {
    id: "kai-argo-bromo-anggrek",
    number: "1",
    name: "Argo Bromo Anggrek",
    operator: "KAI",
    serviceClass: "Eksekutif",
    stops: [
      s("GMR", null, "08:20"),
      s("CN", "11:05", "11:08"),
      s("SMC", "13:35", "13:40"),
      s("SB", "16:35", null),
    ],
  },
  {
    id: "kai-argo-parahyangan",
    number: "17",
    name: "Argo Parahyangan",
    operator: "KAI",
    serviceClass: "Eksekutif",
    stops: [
      s("GMR", null, "06:00"),
      s("PWK", "07:30", "07:32"),
      s("BD", "09:15", null),
    ],
  },
  {
    id: "kai-taksaka",
    number: "69",
    name: "Taksaka",
    operator: "KAI",
    serviceClass: "Eksekutif",
    stops: [
      s("GMR", null, "09:15"),
      s("CN", "12:05", "12:08"),
      s("PWT", "14:20", "14:24"),
      s("YK", "16:30", null),
    ],
  },
  {
    id: "kai-gajayana",
    number: "87",
    name: "Gajayana",
    operator: "KAI",
    serviceClass: "Eksekutif",
    stops: [
      s("GMR", null, "18:40"),
      s("CN", "21:35", "21:40"),
      s("YK", "23:55", "00:05", 0),
      s("SLO", "01:05", "01:10", 1),
      s("ML", "03:20", null, 1),
    ],
  },
  {
    id: "kai-argo-wilis",
    number: "3",
    name: "Argo Wilis",
    operator: "KAI",
    serviceClass: "Eksekutif",
    stops: [
      s("BD", null, "07:00"),
      s("TSM", "08:45", "08:48"),
      s("YK", "14:20", "14:25"),
      s("SLO", "15:50", "15:55"),
      s("SB", "19:30", null),
    ],
  },
  {
    id: "kai-bima",
    number: "45",
    name: "Bima",
    operator: "KAI",
    serviceClass: "Eksekutif",
    stops: [
      s("GMR", null, "17:00"),
      s("CN", "20:10", "20:15"),
      s("YK", "01:15", "01:25", 1),
      s("SLO", "02:45", "02:50", 1),
      s("SB", "06:30", null, 1),
    ],
  },
  {
    id: "kai-argo-semeru",
    number: "5",
    name: "Argo Semeru",
    operator: "KAI",
    serviceClass: "Eksekutif",
    stops: [
      s("SB", null, "07:30"),
      s("SLO", "11:15", "11:20"),
      s("YK", "12:45", "12:50"),
      s("PWT", "15:00", "15:05"),
      s("CN", "17:20", "17:25"),
      s("GMR", "20:30", null),
    ],
  },
  {
    id: "kai-bengawan",
    number: "119",
    name: "Bengawan",
    operator: "KAI",
    serviceClass: "Ekonomi",
    stops: [
      s("PSE", null, "06:15"),
      s("CN", "09:45", "09:50"),
      s("PWT", "12:30", "12:35"),
      s("YK", "15:00", "15:05"),
      s("SLO", "15:45", null),
    ],
  },
  {
    id: "kai-kertajaya",
    number: "137",
    name: "Kertajaya",
    operator: "KAI",
    serviceClass: "Ekonomi",
    stops: [
      s("PSE", null, "14:20"),
      s("CN", "17:50", "17:55"),
      s("SMC", "20:40", "20:45"),
      s("SB", "23:40", null),
    ],
  },
  {
    id: "kai-turangga",
    number: "101",
    name: "Turangga",
    operator: "KAI",
    serviceClass: "Eksekutif",
    stops: [
      s("BD", null, "18:10"),
      s("TSM", "20:00", "20:03"),
      s("YK", "01:30", "01:35", 1),
      s("SB", "05:30", null, 1),
    ],
  },
];

/* ==================================================================== */
/* GENERATOR LIN KOMUTER (KRL / MRT / LRT)                              */
/* ==================================================================== */

interface LineStop {
  /** Kode stasiun. */
  code: string;
  /** Waktu tempuh (menit) dari stasiun asal. */
  at: number;
}

interface LineSpec {
  id: string;
  /** Kode lin untuk `Train.line` (mis. "bogor"). */
  line: string;
  name: string;
  /** Awalan nomor KA, mis. "B" untuk Lin Bogor. */
  number: string;
  operator: Operator;
  serviceClass: string;
  /** Nama arah balik (opsional; default nama yang sama). */
  reverseName?: string;
  stops: LineStop[];
  /** Jam keberangkatan pertama & terakhir dari stasiun asal (menit). */
  startMin: number;
  endMin: number;
  /**
   * Selang antar keberangkatan (menit).
   */
  headway: number;
  /** Offset nomor KA (agar dua pola lin tidak menghasilkan nomor kembar). */
  seqOffset?: number;
}

const DWELL = 1; // menit berhenti di stasiun antara

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Menit absolut -> { "HH:mm", dayOffset }. */
function splitAbs(absMin: number): { time: string; dayOffset: number } {
  const dayOffset = Math.floor(absMin / 1440);
  const wrapped = ((absMin % 1440) + 1440) % 1440;
  return {
    time: `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`,
    dayOffset,
  };
}

/** Bangun satu perjalanan dari spesifikasi lin + jam keberangkatan asal. */
function buildTrip(
  spec: LineSpec,
  stops: LineStop[],
  departMin: number,
  seq: number,
  /** Penanda arah unik ("a" = maju, "b" = balik) agar ID tidak bertabrakan. */
  dirTag: string,
): Train {
  const trainStops: Stop[] = stops.map((st, i) => {
    const isFirst = i === 0;
    const isLast = i === stops.length - 1;
    const arriveAbs = departMin + st.at;
    const departAbs = isFirst ? arriveAbs : arriveAbs + DWELL;
    const arr = isFirst ? null : splitAbs(arriveAbs);
    const dep = isLast ? null : splitAbs(departAbs);
    return {
      stationCode: st.code,
      arrive: arr?.time ?? null,
      depart: dep?.time ?? null,
      dayOffset: arr?.dayOffset ?? dep?.dayOffset ?? 0,
    };
  });

  const num = `${spec.number}${pad(seq)}`;
  const firstCode = stops[0].code;
  const lastCode = stops[stops.length - 1].code;
  // Nama lengkap: "<nama lin> — <asal> → <tujuan>" (arah ditulis eksplisit
  // memakai kode stasiun) supaya tiap kereta mudah dibedakan di daftar.
  const direction = `${firstCode} → ${lastCode}`;
  return {
    id: `${spec.id}-${dirTag}-${pad(seq)}`,
    number: num,
    name: `${spec.name} · ${direction}`,
    operator: spec.operator,
    serviceClass: spec.serviceClass,
    line: spec.line,
    stops: trainStops,
  };
}

/** Bangkitkan seluruh perjalanan (dua arah) untuk sebuah lin. */
function generateLine(spec: LineSpec): Train[] {
  const out: Train[] = [];
  const maxAt = spec.stops[spec.stops.length - 1].at;
  const backward: LineStop[] = [...spec.stops]
    .reverse()
    .map((st) => ({ code: st.code, at: maxAt - st.at }));

  let seq = 1 + (spec.seqOffset ?? 0);
  for (let t = spec.startMin; t <= spec.endMin; t += spec.headway) {
    out.push(buildTrip(spec, spec.stops, t, seq, "a"));
    out.push(buildTrip(spec, backward, t, seq, "b"));
    seq++;
  }
  return out;
}

/* ==================================================================== */
/* LIN KRL COMMUTER — DATA NYATA (GAPEKA)                               */
/* ==================================================================== */
/*
 * Seluruh perjalanan KRL Commuter (Lin Bogor, Cikarang, Rangkasbitung,
 * Tanjung Priok) diambil dari jadwal RESMI publik: nomor KA asli + jam
 * perhentian nyata per papan GAPEKA, lihat `krlRealTimetable.ts`.
 * Lin Tangerang memakai `tangerangTimetable.ts`. Tidak ada lagi pola
 * headway seragam buatan.
 */

const MRT_LINES: LineSpec[] = [
  {
    id: "mrt",
    line: "mrt",
    name: "MRT Jakarta",
    number: "M",
    operator: "MRT",
    serviceClass: "Reguler",
    stops: [
      { code: "LBB", at: 0 },
      { code: "BLO", at: 6 },
      { code: "DKA", at: 13 },
      { code: "BHI", at: 17 },
    ],
    startMin: 5 * 60,
    endMin: 23 * 60,
    headway: 20,
  },
];

const LRT_LINES: LineSpec[] = [
  {
    id: "lrt-bekasi",
    line: "lrt-bekasi",
    name: "LRT Lin Bekasi",
    number: "L1",
    operator: "LRT",
    serviceClass: "Reguler",
    stops: [
      { code: "DKA", at: 0 },
      { code: "CWG", at: 9 },
      { code: "BKS", at: 27 },
    ],
    startMin: 5 * 60,
    endMin: 23 * 60,
    headway: 20,
  },
  {
    id: "lrt-cibubur",
    line: "lrt-cibubur",
    name: "LRT Lin Cibubur",
    number: "L2",
    operator: "LRT",
    serviceClass: "Reguler",
    stops: [
      { code: "DKA", at: 0 },
      { code: "CWG", at: 9 },
      { code: "HJM", at: 34 },
    ],
    startMin: 5 * 60,
    endMin: 23 * 60,
    headway: 20,
  },
];

/* ==================================================================== */

export const TRAINS: Train[] = [
  ...KAI_TRAINS,
  // KRL Commuter: jadwal NYATA GAPEKA (nomor KA + jam peron asli).
  // Lin Bogor, Cikarang, Rangkasbitung, Tanjung Priok dari `krlRealTimetable.ts`,
  // Lin Tangerang dari `tangerangTimetable.ts`.
  ...KRL_REAL_TRIPS,
  ...TANGERANG_TRIPS,
  ...MRT_LINES.flatMap(generateLine),
  ...LRT_LINES.flatMap(generateLine),
];

export function getTrain(id: string): Train | undefined {
  return TRAINS.find((t) => t.id === id);
}

/** Titik perhentian pertama (stasiun asal) sebuah kereta. */
export function firstStop(train: Train): Stop {
  return train.stops[0];
}

/** Titik perhentian terakhir (stasiun tujuan) sebuah kereta. */
export function lastStop(train: Train): Stop {
  return train.stops[train.stops.length - 1];
}

/** Daftar operator unik yang tersedia di dataset. */
export function operatorsInData(): string[] {
  return Array.from(new Set(TRAINS.map((t) => t.operator)));
}

/** Nama lin unik (mis. "KRL Lin Bogor") beserta operatornya. */
export function routeNames(): { name: string; operator: Operator }[] {
  const seen = new Map<string, Operator>();
  for (const t of TRAINS) {
    if (!seen.has(t.name)) seen.set(t.name, t.operator);
  }
  return Array.from(seen.entries()).map(([name, operator]) => ({ name, operator }));
}
