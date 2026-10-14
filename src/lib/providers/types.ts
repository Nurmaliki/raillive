import type {
  Departure,
  JourneyOption,
  LiveStatus,
  ServiceAlert,
  Station,
} from "@/lib/types";

/**
 * Kontrak penyedia data jadwal.
 *
 * UI & API route HANYA berbicara lewat interface ini. Untuk beralih dari
 * data mock ke RajaKAI, cukup implementasikan interface ini (lihat
 * `rajakai.ts`) lalu ubah `DATA_PROVIDER` di `.env`.
 */
export interface TrainDataProvider {
  /** Nama provider, untuk ditampilkan di UI. */
  readonly name: string;
  /** True bila memakai data simulasi. */
  readonly isMock: boolean;

  getStations(): Promise<Station[]>;
  getDepartures(
    stationCode: string,
    dateKey: string,
    windowMinutes?: number,
  ): Promise<Departure[]>;
  getLiveTrains(dateKey: string): Promise<LiveStatus[]>;
  getLiveTrain(trainId: string, dateKey: string): Promise<LiveStatus | null>;
  searchJourneys(
    originCode: string,
    destCode: string,
    dateKey: string,
  ): Promise<JourneyOption[]>;
  getAlerts(dateKey: string): Promise<ServiceAlert[]>;
}
