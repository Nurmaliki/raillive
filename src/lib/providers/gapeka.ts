import { STATIONS } from "@/lib/data/stations";
import {
  activeAlerts,
  computeAllLive,
  computeLiveStatus,
  departuresAt,
  searchJourneys,
} from "@/lib/engine";
import { getTrain } from "@/lib/data/trains";
import { shiftDateKey, toDateKey } from "@/lib/time";
import type { TrainDataProvider } from "@/lib/providers/types";
import type {
  Departure,
  JourneyOption,
  LiveStatus,
  ServiceAlert,
  Station,
} from "@/lib/types";

/**
 * Provider JADWAL NYATA (GAPEKA) — sumber default aplikasi.
 *
 * Jadwal, nomor KA, dan jam tiap perhentian diambil dari jadwal RESMI publik
 * Commuter Line (GAPEKA), lihat `data/krlRealTimetable.ts` (Lin Bogor,
 * Cikarang, Rangkasbitung, Tanjung Priok) dan `data/tangerangTimetable.ts`
 * (Lin Tangerang). Bukan data buatan/simulasi.
 *
 * CATATAN POSISI: tidak ada feed posisi/delay KRL real-time gratis tanpa
 * kunci, sehingga posisi kereta diESTIMASI dari jam terjadwal + waktu WIB
 * saat ini, dan TIDAK ada keterlambatan yang dikarang (delay selalu 0).
 * Bila kelak ada feed resmi, cukup isi `delayForTrain()` di `engine.ts`.
 */
export class GapekaProvider implements TrainDataProvider {
  readonly name = "Jadwal GAPEKA KRL";
  readonly isMock = false;

  async getStations(): Promise<Station[]> {
    return STATIONS;
  }

  async getDepartures(
    stationCode: string,
    dateKey: string,
    windowMinutes = 240,
  ): Promise<Departure[]> {
    // Papan keberangkatan selalu relatif terhadap waktu sekarang (WIB).
    return departuresAt(
      stationCode,
      new Date(),
      dateKey || toDateKey(new Date()),
      windowMinutes,
    );
  }

  async getLiveTrains(dateKey: string): Promise<LiveStatus[]> {
    const now = new Date();
    return computeAllLive(now, dateKey || toDateKey(now));
  }

  async getLiveTrain(trainId: string, dateKey: string): Promise<LiveStatus | null> {
    const train = getTrain(trainId);
    if (!train) return null;
    const now = new Date();
    const key = dateKey || toDateKey(now);
    // Coba instance hari ini, lalu instance kemarin (KA malam lintas tengah malam).
    return (
      computeLiveStatus(train, now, key, 0) ??
      computeLiveStatus(train, now, shiftDateKey(key, -1), 1)
    );
  }

  async searchJourneys(
    originCode: string,
    destCode: string,
    dateKey: string,
  ): Promise<JourneyOption[]> {
    const now = new Date();
    return searchJourneys(originCode, destCode, now, dateKey || toDateKey(now));
  }

  async getAlerts(dateKey: string): Promise<ServiceAlert[]> {
    return activeAlerts(dateKey || toDateKey(new Date()));
  }
}
