import type { Operator, Stop, Train } from "@/lib/types";

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
  /** Selang antar keberangkatan (menit). */
  headway: number;
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
  dirLabel: string,
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
  return {
    id: `${spec.id}-${dirLabel.toLowerCase()}-${pad(seq)}`,
    number: num,
    name: `${spec.name}${dirLabel ? ` (${dirLabel})` : ""}`,
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

  let seq = 1;
  for (let t = spec.startMin; t <= spec.endMin; t += spec.headway) {
    out.push(buildTrip(spec, spec.stops, t, seq, ""));
    out.push(buildTrip(spec, backward, t, seq, spec.reverseName ?? ""));
    seq++;
  }
  return out;
}

const KRL_LINES: LineSpec[] = [
  {
    id: "krl-bogor",
    line: "bogor",
    name: "KRL Lin Bogor",
    number: "B",
    operator: "KRL",
    serviceClass: "Commuter",
    stops: [
      { code: "JAKK", at: 0 },
      { code: "JAY", at: 3 },
      { code: "MGB", at: 5 },
      { code: "SWB", at: 7 },
      { code: "JUA", at: 9 },
      { code: "GDD", at: 12 },
      { code: "CKI", at: 14 },
      { code: "MRI", at: 17 },
      { code: "TEB", at: 20 },
      { code: "CW", at: 23 },
      { code: "DRN", at: 26 },
      { code: "PSMB", at: 28 },
      { code: "PSM", at: 31 },
      { code: "TNT", at: 34 },
      { code: "LNA", at: 37 },
      { code: "UP", at: 40 },
      { code: "UI", at: 43 },
      { code: "POC", at: 45 },
      { code: "DPB", at: 48 },
      { code: "DPK", at: 51 },
      { code: "CTA", at: 55 },
      { code: "BJD", at: 61 },
      { code: "CLT", at: 65 },
      { code: "BOG", at: 70 },
    ],
    startMin: 5 * 60,
    endMin: 21 * 60,
    headway: 20,
  },
  {
    id: "krl-cikarang",
    line: "cikarang",
    name: "KRL Lin Cikarang",
    number: "C",
    operator: "KRL",
    serviceClass: "Commuter",
    stops: [
      { code: "CKR", at: 0 },
      { code: "MTM", at: 3 },
      { code: "CIT", at: 6 },
      { code: "TBN", at: 10 },
      { code: "BKST", at: 14 },
      { code: "BEK", at: 17 },
      { code: "KRI", at: 20 },
      { code: "CUK", at: 24 },
      { code: "KLDB", at: 27 },
      { code: "BUA", at: 30 },
      { code: "KLD", at: 33 },
      { code: "JNG", at: 36 },
      { code: "PSE", at: 41 },
      { code: "KMO", at: 44 },
      { code: "RJW", at: 47 },
      { code: "KPB", at: 50 },
      { code: "JAKK", at: 54 },
    ],
    startMin: 5 * 60,
    endMin: 21 * 60,
    headway: 20,
  },
  {
    id: "krl-tangerang",
    line: "tangerang",
    name: "KRL Lin Tangerang",
    number: "T",
    operator: "KRL",
    serviceClass: "Commuter",
    stops: [
      { code: "DU", at: 0 },
      { code: "GRG", at: 3 },
      { code: "PSG", at: 5 },
      { code: "TKO", at: 7 },
      { code: "BJI", at: 9 },
      { code: "RWB", at: 12 },
      { code: "KDS", at: 15 },
      { code: "POR", at: 18 },
      { code: "BTP", at: 20 },
      { code: "TTI", at: 22 },
      { code: "TNG", at: 25 },
    ],
    startMin: 5 * 60,
    endMin: 21 * 60,
    headway: 30,
  },
  {
    id: "krl-rangkasbitung",
    line: "rangkasbitung",
    name: "KRL Lin Rangkasbitung",
    number: "R",
    operator: "KRL",
    serviceClass: "Commuter",
    stops: [
      { code: "THB", at: 0 },
      { code: "PLM", at: 3 },
      { code: "KBO", at: 7 },
      { code: "PSR", at: 10 },
      { code: "PDR", at: 13 },
      { code: "SDM", at: 16 },
      { code: "RBT", at: 19 },
      { code: "SERP", at: 22 },
      { code: "CSK", at: 25 },
      { code: "CCY", at: 28 },
      { code: "PRP", at: 33 },
      { code: "CLJ", at: 38 },
      { code: "DRU", at: 41 },
      { code: "TNJ", at: 44 },
      { code: "TGR", at: 47 },
      { code: "CKY", at: 50 },
      { code: "MJA", at: 54 },
      { code: "CTR", at: 58 },
      { code: "RK", at: 63 },
    ],
    startMin: 5 * 60,
    endMin: 21 * 60,
    headway: 30,
  },
  {
    id: "krl-priok",
    line: "priok",
    name: "KRL Lin Tanjung Priok",
    number: "TP",
    operator: "KRL",
    serviceClass: "Commuter",
    stops: [
      { code: "JAKK", at: 0 },
      { code: "KPB", at: 4 },
      { code: "ANC", at: 7 },
      { code: "JIS", at: 10 },
      { code: "TPK", at: 13 },
    ],
    startMin: 5 * 60,
    endMin: 21 * 60,
    headway: 30,
  },
];

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
  ...KRL_LINES.flatMap(generateLine),
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
