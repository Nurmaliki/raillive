import { TRAINS, firstStop, lastStop } from "@/lib/data/trains";
import { getStation, haversineKm } from "@/lib/data/stations";
import { absoluteMinutes, jakartaMinutes, shiftDateKey, toHHMM } from "@/lib/time";
import type {
  Departure,
  DepartureStatus,
  JourneyOption,
  LiveStatus,
  LiveStatusKind,
  ServiceAlert,
  Station,
  Train,
} from "@/lib/types";

/**
 * Mesin simulasi deterministik.
 *
 * Delay dihitung sebagai fungsi hash dari (id kereta + tanggal), sehingga
 * sebuah kereta punya delay yang STABIL sepanjang hari tetapi berubah
 * tiap hari. Ini membuat UI terasa "hidup" tanpa perlu backend.
 */

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Delay terjadwal sebuah kereta pada tanggal tertentu (menit, >= 0). */
export function delayForTrain(trainId: string, dateKey: string): number {
  const h = hashString(`${trainId}::${dateKey}`);
  // ~55% tepat waktu, sisanya delay 3..48 menit.
  const bucket = h % 100;
  if (bucket < 55) return 0;
  return 3 + (h % 46);
}

function statusFromDelay(delayMin: number): LiveStatusKind {
  if (delayMin <= 0) return "on-time";
  return "delayed";
}

/** Total jarak rute sebuah kereta (km), dijumlahkan antar perhentian. */
export function routeDistanceKm(train: Train): number {
  let total = 0;
  for (let i = 1; i < train.stops.length; i++) {
    const a = getStation(train.stops[i - 1].stationCode);
    const b = getStation(train.stops[i].stationCode);
    if (a && b) total += haversineKm(a, b);
  }
  return total;
}

/** Harga mulai (Rp) per kelas/operator. */
function basePrice(train: Train, distanceKm: number): number {
  switch (train.operator) {
    case "KAI":
      return train.serviceClass === "Eksekutif"
        ? 250000 + distanceKm * 950
        : 120000 + distanceKm * 520;
    case "KRL":
      return 5000;
    case "MRT":
      return 5000 + Math.round(distanceKm * 300);
    case "LRT":
      return 5000 + Math.round(distanceKm * 250);
  }
}

/** Interpolasi posisi geografis berdasarkan progres 0..1 pada rute. */
function interpolatePosition(train: Train, progress: number) {
  const stops = train.stops;
  const segments = stops.length - 1;
  if (segments <= 0) {
    const only = getStation(stops[0].stationCode);
    return { lat: only?.lat ?? 0, lng: only?.lng ?? 0 };
  }
  const scaled = Math.min(0.9999, Math.max(0, progress)) * segments;
  const idx = Math.floor(scaled);
  const t = scaled - idx;
  const a = getStation(stops[idx].stationCode);
  const b = getStation(stops[idx + 1].stationCode);
  if (!a || !b) return { lat: a?.lat ?? 0, lng: a?.lng ?? 0 };
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };
}

/**
 * Hitung status real-time sebuah kereta pada waktu tertentu.
 * Mengembalikan null jika kereta belum berangkat atau sudah tiba
 * lebih dari 30 menit lalu (dianggap "selesai").
 */
export function computeLiveStatus(
  train: Train,
  now: Date,
  dateKey: string,
  /** 1 = instance keberangkatan kemarin (untuk KA malam yang melewati tengah malam). */
  dayDelta = 0,
): LiveStatus | null {
  const delayMin = delayForTrain(train.id, dateKey);
  // Menit sejak tengah malam hari keberangkatan, menurut WIB. Bisa > 1440
  // untuk perjalanan yang melewati tengah malam.
  const nowMin = jakartaMinutes(now) + dayDelta * 1440;

  const origin = firstStop(train);
  const dest = lastStop(train);
  const departMin = absoluteMinutes(origin.depart!, origin.dayOffset);
  const arriveMin = absoluteMinutes(dest.arrive!, dest.dayOffset);

  const originStation = getStation(origin.stationCode);
  const destStation = getStation(dest.stationCode);
  if (!originStation || !destStation) return null;

  const base = {
    trainId: train.id,
    trainNumber: train.number,
    trainName: train.name,
    operator: train.operator,
    origin: origin.stationCode,
    originName: originStation.name,
    destination: dest.stationCode,
    destinationName: destStation.name,
    updatedAt: now.toISOString(),
  };

  // Belum berangkat.
  if (nowMin < departMin + delayMin) {
    const firstLeg = train.stops[1];
    const nextStation = firstLeg ? getStation(firstLeg.stationCode) : undefined;
    return {
      ...base,
      lastStation: origin.stationCode,
      lastStationName: originStation.name,
      nextStation: firstLeg?.stationCode ?? null,
      nextStationName: nextStation?.name ?? null,
      progress: 0,
      position: { lat: originStation.lat, lng: originStation.lng },
      speedKmh: 0,
      delayMin,
      status: "not-started",
      etaNext: firstLeg?.arrive ?? null,
    };
  }

  // Sudah tiba (lebih dari 30 menit lalu).
  if (nowMin > arriveMin + delayMin + 30) {
    return {
      ...base,
      lastStation: dest.stationCode,
      lastStationName: destStation.name,
      nextStation: null,
      nextStationName: null,
      progress: 1,
      position: { lat: destStation.lat, lng: destStation.lng },
      speedKmh: 0,
      delayMin,
      status: "arrived",
      etaNext: null,
    };
  }

  // Cari segmen yang sedang ditempuh.
  let lastIdx = 0;
  for (let i = 0; i < train.stops.length; i++) {
    const stop = train.stops[i];
    const ref = stop.depart ?? stop.arrive!;
    if (absoluteMinutes(ref, stop.dayOffset) + delayMin <= nowMin) lastIdx = i;
    else break;
  }

  const lastStopDef = train.stops[lastIdx];
  const nextStopDef = train.stops[lastIdx + 1];
  const lastSt = getStation(lastStopDef.stationCode);
  const nextSt = nextStopDef ? getStation(nextStopDef.stationCode) : undefined;

  let progress: number;
  if (nextStopDef && lastSt && nextSt) {
    const fromMin =
      absoluteMinutes(lastStopDef.depart ?? lastStopDef.arrive!, lastStopDef.dayOffset) +
      delayMin;
    const toMin =
      absoluteMinutes(nextStopDef.arrive ?? nextStopDef.depart!, nextStopDef.dayOffset) +
      delayMin;
    const span = Math.max(1, toMin - fromMin);
    const segProgress = Math.min(1, Math.max(0, (nowMin - fromMin) / span));
    progress = (lastIdx + segProgress) / (train.stops.length - 1);
  } else {
    progress = 1;
  }

  const position = interpolatePosition(train, progress);
  // Kecepatan rata-rata wajar, dengan sedikit variasi halus.
  const wobble = Math.sin(nowMin / 3 + hashString(train.id) % 10) * 8;
  const speedKmh =
    nextStopDef && progress < 1
      ? Math.max(0, Math.round(55 + wobble + (train.operator === "KAI" ? 30 : -10)))
      : 0;

  return {
    ...base,
    lastStation: lastStopDef.stationCode,
    lastStationName: lastSt?.name ?? lastStopDef.stationCode,
    nextStation: nextStopDef?.stationCode ?? null,
    nextStationName: nextSt?.name ?? null,
    progress: Math.min(1, progress),
    position,
    speedKmh,
    delayMin,
    status: progress >= 1 ? "arrived" : statusFromDelay(delayMin),
    etaNext: nextStopDef ? toHHMM(absoluteMinutes(nextStopDef.arrive ?? nextStopDef.depart!, nextStopDef.dayOffset) + delayMin) : null,
  };
}

/**
 * Status semua kereta yang sedang berjalan pada waktu tertentu.
 * Memeriksa instance keberangkatan hari ini DAN kemarin, sehingga KA malam
 * yang melewati tengah malam tetap terpantau.
 */
export function computeAllLive(now: Date, dateKey: string): LiveStatus[] {
  const out: LiveStatus[] = [];
  for (const train of TRAINS) {
    const today = computeLiveStatus(train, now, dateKey, 0);
    if (today) {
      out.push(today);
      continue;
    }
    // Coba instance keberangkatan kemarin (perjalanan lintas tengah malam).
    const overnight = computeLiveStatus(train, now, shiftDateKey(dateKey, -1), 1);
    if (overnight && overnight.status !== "arrived") out.push(overnight);
  }
  return out;
}

/**
 * Papan keberangkatan sebuah stasiun pada waktu tertentu.
 * Mengembalikan kereta yang berangkat dari stasiun tsb (bukan yang tiba).
 * `dayDelta` > 0 memeriksa keberangkatan dari hari sebelumnya (KA malam).
 */
export function departuresAt(
  stationCode: string,
  now: Date,
  dateKey: string,
  windowMinutes = 240,
): Departure[] {
  const code = stationCode.toUpperCase();
  const nowMin = jakartaMinutes(now);
  const out: Departure[] = [];

  for (let dayDelta = 0; dayDelta <= 1; dayDelta++) {
    const key = shiftDateKey(dateKey, -dayDelta);
    for (const train of TRAINS) {
      const idx = train.stops.findIndex((st) => st.stationCode === code);
      if (idx === -1 || idx === train.stops.length - 1) continue; // stasiun terakhir tidak "berangkat"
      const stop = train.stops[idx];
      if (!stop.depart) continue;

      const delayMin = delayForTrain(train.id, key);
      const schedMin = absoluteMinutes(stop.depart, stop.dayOffset) + dayDelta * 1440;
      const actualMin = schedMin + delayMin;

      // Hanya tampilkan yang berangkat dalam rentang jendela waktu.
      if (actualMin < nowMin - 30 || actualMin > nowMin + windowMinutes) continue;

      const destDef = lastStop(train);
      const destStation = getStation(destDef.stationCode);

      let status: DepartureStatus;
      if (delayMin > 15) status = "delayed";
      else if (actualMin <= nowMin) status = "departed";
      else if (actualMin - nowMin <= 10) status = "boarding";
      else status = delayMin > 0 ? "delayed" : "on-time";

      const hash = hashString(`${train.id}${code}${key}`);
      const platform = `${1 + (hash % 6)}`;

      out.push({
        trainId: train.id,
        trainNumber: train.number,
        trainName: train.name,
        operator: train.operator,
        destination: destDef.stationCode,
        destinationName: destStation?.name ?? destDef.stationCode,
        scheduled: stop.depart,
        actual: toHHMM(actualMin),
        delayMin,
        platform,
        status,
      });
    }
  }

  return out.sort((a, b) => a.actual.localeCompare(b.actual));
}

/**
 * Cari perjalanan langsung (tanpa transit) dari stasiun asal ke tujuan.
 * `dateKey` dipakai untuk menghitung delay; jam dihitung dari waktu berangkat.
 */
export function searchJourneys(
  originCode: string,
  destCode: string,
  now: Date,
  dateKey: string,
): JourneyOption[] {
  const origin = getStation(originCode);
  const destination = getStation(destCode);
  if (!origin || !destination || originCode === destCode) return [];

  const results: JourneyOption[] = [];

  for (const train of TRAINS) {
    const fromIdx = train.stops.findIndex((st) => st.stationCode === origin.code);
    const toIdx = train.stops.findIndex((st) => st.stationCode === destination.code);
    if (fromIdx === -1 || toIdx === -1 || toIdx <= fromIdx) continue;

    const fromStop = train.stops[fromIdx];
    const toStop = train.stops[toIdx];
    if (!fromStop.depart || !toStop.arrive) continue;

    const departAbs = absoluteMinutes(fromStop.depart, fromStop.dayOffset);
    const arriveAbs = absoluteMinutes(toStop.arrive, toStop.dayOffset);
    const durationMin = arriveAbs - departAbs;
    if (durationMin <= 0) continue;

    // Jarak ruas yang ditempuh.
    let distanceKm = 0;
    for (let i = fromIdx + 1; i <= toIdx; i++) {
      const a = getStation(train.stops[i - 1].stationCode);
      const b = getStation(train.stops[i].stationCode);
      if (a && b) distanceKm += haversineKm(a, b);
    }

    const delayMin = delayForTrain(train.id, dateKey);
    const live = computeLiveStatus(train, now, dateKey);

    results.push({
      train,
      origin,
      destination,
      departTime: fromStop.depart,
      arriveTime: toStop.arrive,
      durationMin,
      distanceKm: Math.round(distanceKm),
      priceFrom: Math.round(basePrice(train, distanceKm) / 1000) * 1000,
      delayMin,
      live,
    });
  }

  return results.sort((a, b) => a.departTime.localeCompare(b.departTime));
}

/** Semua stasiun yang dilayani sebuah kereta, sebagai objek Station. */
export function trainStations(train: Train): Station[] {
  return train.stops
    .map((st) => getStation(st.stationCode))
    .filter((x): x is Station => Boolean(x));
}

/** Peringatan/gangguan layanan aktif pada tanggal tertentu. */
export function activeAlerts(dateKey: string): ServiceAlert[] {
  const all: ServiceAlert[] = [
    {
      id: "alert-krl-1",
      operator: "KRL",
      severity: "warning",
      title: "Perawatan jalur Bogor Line",
      description:
        "Perawatan prasarana di antara Manggarai–Depok. Perjalanan berpotensi terlambat hingga 15 menit.",
      affectedTrains: ["krl-bogor-line-1", "krl-bogor-line-2"],
      createdAt: `${dateKey}T04:00:00`,
    },
    {
      id: "alert-kai-1",
      operator: "KAI",
      severity: "info",
      title: "Penambahan kereta akhir pekan",
      description:
        "KA tambahan Argo Parahyangan beroperasi pada akhir pekan untuk mengakomodasi lonjakan penumpang.",
      affectedTrains: ["kai-argo-parahyangan"],
      createdAt: `${dateKey}T06:00:00`,
    },
    {
      id: "alert-lrt-1",
      operator: "LRT",
      severity: "info",
      title: "Operasional normal",
      description:
        "LRT Jabodebek beroperasi normal dengan headway 10 menit pada jam sibuk.",
      affectedTrains: [],
      createdAt: `${dateKey}T05:00:00`,
    },
  ];

  // Satu alert "critical" hanya muncul pada sebagian hari (deterministik).
  if (hashString(`critical::${dateKey}`) % 4 === 0) {
    all.unshift({
      id: "alert-kai-critical",
      operator: "KAI",
      severity: "critical",
      title: "Gangguan sinyal di Cirebon",
      description:
        "Gangguan sistem persinyalan mengakibatkan keterlambatan signifikan pada KA lintas utara.",
      affectedTrains: ["kai-argo-bromo-anggrek", "kai-kertajaya"],
      createdAt: `${dateKey}T07:30:00`,
    });
  }

  return all;
}
