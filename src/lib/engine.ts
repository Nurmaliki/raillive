import { TRAINS, firstStop, lastStop } from "@/lib/data/trains";
import { getStation, haversineKm } from "@/lib/data/stations";
import { absoluteMinutes, jakartaMinutes, shiftDateKey, toHHMM } from "@/lib/time";
import { isUpcomingDeparture } from "@/lib/departureWindow";
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
 * Mesin status.
 *
 * PENTING — sumber data NYATA:
 * Jadwal, nomor KA, dan jam tiap perhentian berasal dari jadwal RESMI publik
 * (GAPEKA Commuter Line) — lihat `data/krlRealTimetable.ts` &
 * `data/tangerangTimetable.ts`. Tidak ada jadwal buatan.
 *
 * Karena tidak tersedia feed gangguan/delay KRL gratis tanpa kunci,
 * aplikasi TIDAK mengarang keterlambatan: delay selalu 0 dan posisi kereta
 * diestimasi dari jam terjadwal + waktu WIB saat ini. Bila kelak ada feed
 * delay resmi, cukup isi nilai di sini.
 */

/** Delay terjadwal sebuah kereta (menit). Selalu 0: tidak ada delay karangan. */
export function delayForTrain(_trainId: string, _dateKey: string): number {
  return 0;
}

/** Hash deterministik (FNV-1a) — dipakai untuk penomoran peron & variasi halus. */
function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function statusFromDelay(delayMin: number): LiveStatusKind {
  if (delayMin <= 0) return "on-time";
  return "delayed";
}

/**
 * Nama kereta lengkap untuk daftar/UI: "<nama lin> · <Asal> → <Tujuan>"
 * memakai NAMA STASIUN penuh (bukan kode) supaya mudah dibaca pengguna.
 */
export function fullTrainName(train: Train): string {
  const lineName = train.name.split(" · ")[0];
  const o = getStation(firstStop(train).stationCode);
  const d = getStation(lastStop(train).stationCode);
  const oName = o?.name ?? firstStop(train).stationCode;
  const dName = d?.name ?? lastStop(train).stationCode;
  return `${lineName} · ${oName} → ${dName}`;
}

/** Salinan kereta dengan `name` sudah memakai nama stasiun lengkap. */
function withFullName(train: Train): Train {
  return { ...train, name: fullTrainName(train) };
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
    trainName: fullTrainName(train),
    operator: train.operator,
    line: train.line,
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
  // Kecepatan rata-rata NYATA ruas ini = jarak rel (km) ÷ waktu terjadwal (jam).
  // Dihitung dari data GAPEKA + koordinat stasiun, bukan angka karangan.
  let speedKmh = 0;
  if (nextStopDef && lastSt && nextSt && progress < 1) {
    const fromMin =
      absoluteMinutes(lastStopDef.depart ?? lastStopDef.arrive!, lastStopDef.dayOffset) +
      delayMin;
    const toMin =
      absoluteMinutes(nextStopDef.arrive ?? nextStopDef.depart!, nextStopDef.dayOffset) +
      delayMin;
    const spanMin = Math.max(1, toMin - fromMin);
    const segKm = haversineKm(lastSt, nextSt);
    speedKmh = Math.round(segKm / (spanMin / 60));
  }

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

      // "Ke depan": jangan sertakan kereta yang sudah berangkat.
      if (!isUpcomingDeparture(actualMin, nowMin, windowMinutes)) continue;

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
        trainName: fullTrainName(train),
        operator: train.operator,
        line: train.line,
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

/** Waktu minimum untuk berpindah kereta di stasiun transit (menit). */
const MIN_TRANSFER_MIN = 5;

/** Jarak (km) ruas dari indeks `fromIdx` ke `toIdx` pada rute sebuah kereta. */
function legDistanceKm(train: Train, fromIdx: number, toIdx: number): number {
  let d = 0;
  for (let i = fromIdx + 1; i <= toIdx; i++) {
    const a = getStation(train.stops[i - 1].stationCode);
    const b = getStation(train.stops[i].stationCode);
    if (a && b) d += haversineKm(a, b);
  }
  return d;
}

/**
 * Perjalanan LANGSUNG (tanpa transit) dari stasiun asal ke tujuan.
 * `dateKey` dipakai untuk menghitung delay; jam dihitung dari waktu berangkat.
 */
function directJourneys(
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

    const distanceKm = legDistanceKm(train, fromIdx, toIdx);
    const delayMin = delayForTrain(train.id, dateKey);
    const live = computeLiveStatus(train, now, dateKey);

    results.push({
      train: withFullName(train),
      origin,
      destination,
      departTime: fromStop.depart,
      arriveTime: toStop.arrive,
      durationMin,
      distanceKm: Math.round(distanceKm),
      priceFrom: Math.round(basePrice(train, distanceKm) / 1000) * 1000,
      delayMin,
      live,
      stopsCount: toIdx - fromIdx + 1,
      transfers: 0,
    });
  }

  return results.sort((a, b) => a.departTime.localeCompare(b.departTime));
}

/**
 * Perjalanan dengan SATU kali transit (ganti kereta di stasiun persinggungan).
 * Dipakai sebagai cadangan saat tidak ada perjalanan langsung, sehingga rute
 * lintas-lin (mis. Tangerang → Cikarang via Duri) tetap menghasilkan opsi.
 */
function transferJourneys(
  originCode: string,
  destCode: string,
  now: Date,
  dateKey: string,
): JourneyOption[] {
  const origin = getStation(originCode);
  const destination = getStation(destCode);
  if (!origin || !destination || origin.code === destination.code) return [];

  interface Leg2 {
    train: Train;
    fromIdx: number;
    toIdx: number;
    departAbs: number;
    arriveAbs: number;
    depart: string;
    arrive: string;
    distanceKm: number;
  }

  // Peta: stasiun transit -> daftar ruas kedua (stasiun itu -> tujuan).
  const leg2ByStation = new Map<string, Leg2[]>();
  for (const t of TRAINS) {
    const di = t.stops.findIndex((st) => st.stationCode === destination.code);
    if (di <= 0) continue;
    const toStop = t.stops[di];
    if (!toStop.arrive) continue;
    const arriveAbs = absoluteMinutes(toStop.arrive, toStop.dayOffset);
    for (let i = 0; i < di; i++) {
      const st = t.stops[i];
      if (!st.depart) continue;
      const list = leg2ByStation.get(st.stationCode) ?? [];
      list.push({
        train: t,
        fromIdx: i,
        toIdx: di,
        departAbs: absoluteMinutes(st.depart, st.dayOffset),
        arriveAbs,
        depart: st.depart,
        arrive: toStop.arrive,
        distanceKm: legDistanceKm(t, i, di),
      });
      leg2ByStation.set(st.stationCode, list);
    }
  }

  const results: JourneyOption[] = [];
  const seen = new Set<string>();

  for (const t1 of TRAINS) {
    const fromIdx = t1.stops.findIndex((st) => st.stationCode === origin.code);
    if (fromIdx === -1 || fromIdx === t1.stops.length - 1) continue;
    const fromStop = t1.stops[fromIdx];
    if (!fromStop.depart) continue;
    const leg1DepartAbs = absoluteMinutes(fromStop.depart, fromStop.dayOffset);

    for (let i = fromIdx + 1; i < t1.stops.length; i++) {
      const transferStop = t1.stops[i];
      const transferCode = transferStop.stationCode;
      if (transferCode === destination.code || !transferStop.arrive) continue;
      const leg1ArriveAbs = absoluteMinutes(transferStop.arrive, transferStop.dayOffset);
      const candidates = leg2ByStation.get(transferCode);
      if (!candidates) continue;

      const transferStation = getStation(transferCode);
      if (!transferStation) continue;
      const leg1Distance = legDistanceKm(t1, fromIdx, i);

      for (const leg2 of candidates) {
        if (leg2.train.id === t1.id) continue;
        if (leg2.departAbs < leg1ArriveAbs + MIN_TRANSFER_MIN) continue;
        const durationMin = leg2.arriveAbs - leg1DepartAbs;
        if (durationMin <= 0) continue;

        const key = `${t1.id}|${leg2.train.id}|${transferCode}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const distanceKm = leg1Distance + leg2.distanceKm;
        const delayMin = delayForTrain(t1.id, dateKey);

        results.push({
          train: withFullName(t1),
          origin,
          destination,
          departTime: fromStop.depart,
          arriveTime: leg2.arrive,
          durationMin,
          distanceKm: Math.round(distanceKm),
          priceFrom:
            Math.round(
              (basePrice(t1, leg1Distance) + basePrice(leg2.train, leg2.distanceKm)) / 1000,
            ) * 1000,
          delayMin,
          live: computeLiveStatus(t1, now, dateKey),
          stopsCount: (i - fromIdx + 1) + (leg2.toIdx - leg2.fromIdx + 1) - 1,
          transfers: 1,
          legs: [
            {
              train: withFullName(t1),
              origin,
              destination: transferStation,
              departTime: fromStop.depart,
              arriveTime: transferStop.arrive,
              durationMin: leg1ArriveAbs - leg1DepartAbs,
              distanceKm: Math.round(leg1Distance),
              delayMin,
            },
            {
              train: withFullName(leg2.train),
              origin: transferStation,
              destination,
              departTime: leg2.depart,
              arriveTime: leg2.arrive,
              durationMin: leg2.arriveAbs - leg2.departAbs,
              distanceKm: Math.round(leg2.distanceKm),
              delayMin: delayForTrain(leg2.train.id, dateKey),
            },
          ],
        });
      }
    }
  }

  return results
    .sort((a, b) => a.departTime.localeCompare(b.departTime))
    .slice(0, 40);
}

/**
 * Cari perjalanan dari stasiun asal ke tujuan.
 * Utamakan perjalanan langsung; bila tidak ada, tawarkan opsi 1x transit.
 */
export function searchJourneys(
  originCode: string,
  destCode: string,
  now: Date,
  dateKey: string,
): JourneyOption[] {
  const direct = directJourneys(originCode, destCode, now, dateKey);
  if (direct.length > 0) return direct;
  return transferJourneys(originCode, destCode, now, dateKey);
}

/** Semua stasiun yang dilayani sebuah kereta, sebagai objek Station. */
export function trainStations(train: Train): Station[] {
  return train.stops
    .map((st) => getStation(st.stationCode))
    .filter((x): x is Station => Boolean(x));
}

/**
 * Peringatan/gangguan layanan aktif.
 *
 * TIDAK ADA feed gangguan KRL resmi yang gratis tanpa kunci, sehingga fungsi
 * ini mengembalikan daftar KOSONG: aplikasi tidak boleh MENGARANG gangguan.
 * Bila kelak tersedia feed resmi, isi di sini.
 */
export function activeAlerts(_dateKey: string): ServiceAlert[] {
  return [];
}
