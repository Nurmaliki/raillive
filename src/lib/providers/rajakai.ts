import { MockProvider } from "@/lib/providers/mock";
import type { TrainDataProvider } from "@/lib/providers/types";
import type {
  Departure,
  JourneyOption,
  LiveStatus,
  ServiceAlert,
  Station,
} from "@/lib/types";

/**
 * ============================================================================
 * ADAPTER RAJAKAI
 * ============================================================================
 *
 * Provider ini memanggil API RajaKAI dan memetakan responsnya ke tipe internal
 * aplikasi. Karena bentuk respons RajaKAI bisa berbeda antar versi/plan,
 * bagian pemetaan (`mapStation`, `mapDeparture`, `mapLive`, ...) sengaja
 * dibuat longgar dengan beberapa kemungkinan nama field.
 *
 * CARA MENGAKTIFKAN
 * 1. Isi environment variable berikut (lokal di `.env.local`, di Vercel lewat
 *    Project → Settings → Environment Variables):
 *
 *      DATA_PROVIDER=rajakai
 *      RAJAKAI_BASE_URL=https://api.rajakai.com        # ganti sesuai docs
 *      RAJAKAI_API_KEY=xxxxxxxxxxxxxxxx
 *
 * 2. Sesuaikan path endpoint di bawah (ENDPOINTS) dengan dokumentasi resmi.
 * 3. Jalankan `npm run dev`, buka halaman Jadwal untuk memverifikasi.
 *
 * Jika API gagal / belum dikonfigurasi, provider otomatis jatuh ke data
 * simulasi (`fallback`) sehingga UI tetap tampil — lihat `safeCall()`.
 */

const BASE_URL = process.env.RAJAKAI_BASE_URL ?? "";
const API_KEY = process.env.RAJAKAI_API_KEY ?? "";
/** Nama header API key — ubah bila RajaKAI memakai skema lain (mis. Authorization: Bearer). */
const AUTH_HEADER = process.env.RAJAKAI_AUTH_HEADER ?? "X-API-Key";

const ENDPOINTS = {
  stations: "/v1/stations",
  departures: (code: string) => `/v1/stations/${code}/departures`,
  liveTrains: "/v1/trains/live",
  liveTrain: (id: string) => `/v1/trains/${id}/live`,
  search: "/v1/schedules/search",
  alerts: "/v1/alerts",
} as const;

async function callApi<T>(path: string, params?: Record<string, string>): Promise<T> {
  if (!BASE_URL || !API_KEY) {
    throw new Error(
      "RajaKAI belum dikonfigurasi (RAJAKAI_BASE_URL / RAJAKAI_API_KEY kosong).",
    );
  }
  const url = new URL(path, BASE_URL);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { [AUTH_HEADER]: API_KEY, Accept: "application/json" },
    // Data real-time: jangan pernah di-cache lama.
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`RajaKAI ${res.status} ${res.statusText} pada ${path}`);
  }
  return (await res.json()) as T;
}

/** Ambil nilai pertama yang ada dari beberapa kemungkinan nama field. */
function pick<T = unknown>(obj: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k] as T;
  }
  return undefined;
}

/** Normalisasi jam ke "HH:mm" dari berbagai format umum. */
function normTime(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const m = v.match(/(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : null;
}

// ---------------------------------------------------------------------------
// Pemetaan respons -> tipe internal
// ---------------------------------------------------------------------------

function mapStation(raw: Record<string, unknown>): Station {
  return {
    code: String(pick(raw, "code", "station_code", "id") ?? "").toUpperCase(),
    name: String(pick(raw, "name", "station_name") ?? ""),
    city: String(pick(raw, "city", "kota", "region") ?? ""),
    operators: (pick<string[]>(raw, "operators", "operator") ?? ["KAI"]) as Station["operators"],
    lat: Number(pick(raw, "lat", "latitude") ?? 0),
    lng: Number(pick(raw, "lng", "longitude", "lon") ?? 0),
  };
}

function mapDeparture(raw: Record<string, unknown>): Departure {
  const scheduled = normTime(pick(raw, "scheduled", "departure", "std", "depart_time")) ?? "00:00";
  const delayMin = Number(pick(raw, "delay_min", "delay", "lateness") ?? 0);
  return {
    trainId: String(pick(raw, "train_id", "id") ?? ""),
    trainNumber: String(pick(raw, "train_number", "number", "train_no") ?? ""),
    trainName: String(pick(raw, "train_name", "name") ?? ""),
    operator: (pick(raw, "operator") ?? "KAI") as Departure["operator"],
    destination: String(pick(raw, "destination", "dest_code") ?? ""),
    destinationName: String(pick(raw, "destination_name", "dest_name") ?? ""),
    scheduled,
    actual: normTime(pick(raw, "actual", "etd", "estimated")) ?? scheduled,
    delayMin,
    platform: String(pick(raw, "platform", "track", "peron") ?? "-"),
    status: (pick(raw, "status") ?? (delayMin > 0 ? "delayed" : "on-time")) as Departure["status"],
  };
}

function mapLive(raw: Record<string, unknown>): LiveStatus {
  const pos = (pick<Record<string, unknown>>(raw, "position", "location", "coordinate") ?? {}) as Record<string, unknown>;
  return {
    trainId: String(pick(raw, "train_id", "id") ?? ""),
    trainNumber: String(pick(raw, "train_number", "number") ?? ""),
    trainName: String(pick(raw, "train_name", "name") ?? ""),
    operator: (pick(raw, "operator") ?? "KAI") as LiveStatus["operator"],
    origin: String(pick(raw, "origin", "origin_code") ?? ""),
    originName: String(pick(raw, "origin_name") ?? ""),
    destination: String(pick(raw, "destination", "dest_code") ?? ""),
    destinationName: String(pick(raw, "destination_name", "dest_name") ?? ""),
    lastStation: String(pick(raw, "last_station", "from_station") ?? ""),
    lastStationName: String(pick(raw, "last_station_name", "from_station_name") ?? ""),
    nextStation: (pick<string | null>(raw, "next_station", "to_station") ?? null),
    nextStationName: (pick<string | null>(raw, "next_station_name", "to_station_name") ?? null),
    progress: Number(pick(raw, "progress", "percentage") ?? 0),
    position: {
      lat: Number(pick(pos, "lat", "latitude") ?? 0),
      lng: Number(pick(pos, "lng", "longitude", "lon") ?? 0),
    },
    speedKmh: Number(pick(raw, "speed", "speed_kmh", "kecepatan") ?? 0),
    delayMin: Number(pick(raw, "delay_min", "delay", "lateness") ?? 0),
    status: (pick(raw, "status", "state") ?? "on-time") as LiveStatus["status"],
    etaNext: normTime(pick(raw, "eta_next", "eta")),
    updatedAt: String(pick(raw, "updated_at", "timestamp") ?? new Date().toISOString()),
  };
}

function unwrapList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    for (const key of ["data", "result", "results", "items", "stations", "trains", "schedules", "departures"]) {
      if (Array.isArray(obj[key])) return obj[key] as Record<string, unknown>[];
    }
  }
  return [];
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export class RajaKaiProvider implements TrainDataProvider {
  readonly name = "RajaKAI";
  readonly isMock = false;
  private fallback = new MockProvider();

  /**
   * Jalankan panggilan API; bila gagal, catat peringatan dan pakai data mock
   * agar halaman tidak pernah kosong.
   */
  private async safeCall<T>(fn: () => Promise<T>, fallbackFn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      console.warn("[RajaKAI] gagal, memakai data simulasi:", (err as Error).message);
      return fallbackFn();
    }
  }

  async getStations(): Promise<Station[]> {
    return this.safeCall(async () => {
      const data = await callApi<unknown>(ENDPOINTS.stations);
      const list = unwrapList(data);
      if (!list.length) throw new Error("respons stasiun kosong");
      return list.map(mapStation);
    }, () => this.fallback.getStations());
  }

  async getDepartures(stationCode: string, dateKey: string, windowMinutes = 240): Promise<Departure[]> {
    return this.safeCall(async () => {
      const data = await callApi<unknown>(ENDPOINTS.departures(stationCode), {
        date: dateKey,
        window: String(windowMinutes),
      });
      return unwrapList(data).map(mapDeparture);
    }, () => this.fallback.getDepartures(stationCode, dateKey, windowMinutes));
  }

  async getLiveTrains(dateKey: string): Promise<LiveStatus[]> {
    return this.safeCall(async () => {
      const data = await callApi<unknown>(ENDPOINTS.liveTrains, { date: dateKey });
      return unwrapList(data).map(mapLive);
    }, () => this.fallback.getLiveTrains(dateKey));
  }

  async getLiveTrain(trainId: string, dateKey: string): Promise<LiveStatus | null> {
    return this.safeCall(async () => {
      const data = await callApi<unknown>(ENDPOINTS.liveTrain(trainId), { date: dateKey });
      const list = unwrapList(data);
      const raw = list[0] ?? (data as Record<string, unknown>);
      return raw && Object.keys(raw).length ? mapLive(raw) : null;
    }, () => this.fallback.getLiveTrain(trainId, dateKey));
  }

  async searchJourneys(originCode: string, destCode: string, dateKey: string): Promise<JourneyOption[]> {
    return this.safeCall(async () => {
      const data = await callApi<unknown>(ENDPOINTS.search, {
        origin: originCode,
        destination: destCode,
        date: dateKey,
      });
      // Pemetaan hasil pencarian: sesuaikan dengan struktur RajaKAI.
      // Untuk saat ini kita teruskan ke mock karena bentuk JourneyOption
      // memerlukan data stasiun lengkap.
      const list = unwrapList(data);
      if (!list.length) throw new Error("hasil pencarian kosong");
      return this.fallback.searchJourneys(originCode, destCode, dateKey);
    }, () => this.fallback.searchJourneys(originCode, destCode, dateKey));
  }

  async getAlerts(dateKey: string): Promise<ServiceAlert[]> {
    return this.safeCall(async () => {
      const data = await callApi<unknown>(ENDPOINTS.alerts, { date: dateKey });
      const list = unwrapList(data);
      return list.map((raw) => ({
        id: String(pick(raw, "id") ?? crypto.randomUUID()),
        operator: (pick(raw, "operator") ?? "KAI") as ServiceAlert["operator"],
        severity: (pick(raw, "severity", "level") ?? "info") as ServiceAlert["severity"],
        title: String(pick(raw, "title", "headline") ?? ""),
        description: String(pick(raw, "description", "message") ?? ""),
        affectedTrains: (pick<string[]>(raw, "affected_trains", "trains") ?? []),
        createdAt: String(pick(raw, "created_at", "timestamp") ?? new Date().toISOString()),
      }));
    }, () => this.fallback.getAlerts(dateKey));
  }
}
