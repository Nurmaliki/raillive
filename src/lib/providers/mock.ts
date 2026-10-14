import { STATIONS } from "@/lib/data/stations";
import {
  activeAlerts,
  computeAllLive,
  computeLiveStatus,
  departuresAt,
  searchJourneys,
} from "@/lib/engine";
import { getTrain } from "@/lib/data/trains";
import { toDateKey } from "@/lib/time";
import type { TrainDataProvider } from "@/lib/providers/types";
import type {
  Departure,
  JourneyOption,
  LiveStatus,
  ServiceAlert,
  Station,
} from "@/lib/types";

/** Membangun objek Date dari dateKey "YYYY-MM-DD" (waktu lokal). */
function dateFromKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/**
 * Provider simulasi. Delay deterministik per (kereta, tanggal) sehingga
 * data konsisten sepanjang hari namun tetap terasa "real-time" karena
 * posisi kereta dihitung dari jam saat ini.
 */
export class MockProvider implements TrainDataProvider {
  readonly name = "Simulasi";
  readonly isMock = true;

  async getStations(): Promise<Station[]> {
    return STATIONS;
  }

  async getDepartures(
    stationCode: string,
    dateKey: string,
    windowMinutes = 240,
  ): Promise<Departure[]> {
    const day = dateFromKey(dateKey);
    const now = new Date(day);
    now.setHours(new Date().getHours(), new Date().getMinutes(), 0, 0);
    return departuresAt(stationCode, now, dateKey, windowMinutes);
  }

  async getLiveTrains(dateKey: string): Promise<LiveStatus[]> {
    const now = new Date();
    return computeAllLive(now, dateKey || toDateKey(now));
  }

  async getLiveTrain(trainId: string, dateKey: string): Promise<LiveStatus | null> {
    const train = getTrain(trainId);
    if (!train) return null;
    const now = new Date();
    return computeLiveStatus(train, now, dateKey || toDateKey(now));
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
