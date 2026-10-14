import type { Stop, Train } from "@/lib/types";

/**
 * Definisi rute kereta. Jam dalam format "HH:mm" waktu lokal (WIB).
 * `dayOffset` menandai perjalanan yang melewati tengah malam.
 */

function s(
  stationCode: string,
  arrive: string | null,
  depart: string | null,
  dayOffset = 0,
): Stop {
  return { stationCode, arrive, depart, dayOffset };
}

export const TRAINS: Train[] = [
  // ===================== KAI ANTARKOTA =====================
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

  // ===================== KRL COMMUTER =====================
  {
    id: "krl-bogor-line-1",
    number: "BOG-1",
    name: "KRL Bogor Line",
    operator: "KRL",
    serviceClass: "Commuter",
    stops: [
      s("JAKK", null, "05:10"),
      s("MRI", "05:28", "05:30"),
      s("DPK", "05:48", "05:50"),
      s("BOG", "06:12", null),
    ],
  },
  {
    id: "krl-bogor-line-2",
    number: "BOG-2",
    name: "KRL Bogor Line",
    operator: "KRL",
    serviceClass: "Commuter",
    stops: [
      s("BOG", null, "06:00"),
      s("DPK", "06:22", "06:24"),
      s("MRI", "06:42", "06:44"),
      s("JAKK", "07:02", null),
    ],
  },
  {
    id: "krl-bekasi-line-1",
    number: "BEK-1",
    name: "KRL Bekasi Line",
    operator: "KRL",
    serviceClass: "Commuter",
    stops: [
      s("JAKK", null, "05:20"),
      s("MRI", "05:38", "05:40"),
      s("BEK", "06:05", "06:07"),
      s("CKR", "06:22", null),
    ],
  },
  {
    id: "krl-serpong-line-1",
    number: "SRP-1",
    name: "KRL Serpong Line",
    operator: "KRL",
    serviceClass: "Commuter",
    stops: [
      s("THB", null, "05:15"),
      s("SUD", "05:24", "05:26"),
      s("SERP", "05:50", null),
    ],
  },
  {
    id: "krl-tangerang-line-1",
    number: "TNG-1",
    name: "KRL Tangerang Line",
    operator: "KRL",
    serviceClass: "Commuter",
    stops: [
      s("THB", null, "05:30"),
      s("SUD", "05:39", "05:41"),
      s("TNG", "06:05", null),
    ],
  },

  // ===================== MRT JAKARTA =====================
  {
    id: "mrt-nb-1",
    number: "MRT-1",
    name: "MRT Northbound",
    operator: "MRT",
    serviceClass: "Reguler",
    stops: [
      s("LBB", null, "05:00"),
      s("BLO", "05:06", "05:07"),
      s("DKA", "05:14", "05:15"),
      s("BHI", "05:18", null),
    ],
  },
  {
    id: "mrt-sb-1",
    number: "MRT-2",
    name: "MRT Southbound",
    operator: "MRT",
    serviceClass: "Reguler",
    stops: [
      s("BHI", null, "05:20"),
      s("DKA", "05:23", "05:24"),
      s("BLO", "05:31", "05:32"),
      s("LBB", "05:38", null),
    ],
  },

  // ===================== LRT JABODEBEK =====================
  {
    id: "lrt-bekasi-1",
    number: "LRT-1",
    name: "LRT Bekasi Line",
    operator: "LRT",
    serviceClass: "Reguler",
    stops: [
      s("DKA", null, "05:00"),
      s("CWG", "05:09", "05:10"),
      s("BKS", "05:28", null),
    ],
  },
  {
    id: "lrt-harjamukti-1",
    number: "LRT-2",
    name: "LRT Harjamukti Line",
    operator: "LRT",
    serviceClass: "Reguler",
    stops: [
      s("DKA", null, "05:05"),
      s("CWG", "05:14", "05:15"),
      s("HJM", "05:40", null),
    ],
  },
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
