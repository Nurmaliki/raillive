import { GapekaProvider } from "@/lib/providers/gapeka";
import { MockProvider } from "@/lib/providers/mock";
import { RajaKaiProvider } from "@/lib/providers/rajakai";
import type { TrainDataProvider } from "@/lib/providers/types";

/**
 * Titik tunggal untuk memilih provider data.
 *
 * Diatur lewat environment variable `DATA_PROVIDER`:
 *   - "gapeka" (default) -> JADWAL NYATA Commuter Line (GAPEKA), tanpa API key
 *   - "mock"             -> data simulasi (khusus demo/uji)
 *   - "rajakai"          -> API RajaKAI (butuh RAJAKAI_API_KEY)
 *
 * Default sengaja "gapeka": aplikasi menampilkan jadwal & nomor KA asli
 * dari jadwal resmi publik, BUKAN data simulasi.
 */
let cached: TrainDataProvider | null = null;

export function getProvider(): TrainDataProvider {
  if (cached) return cached;
  const which = (process.env.DATA_PROVIDER ?? "gapeka").toLowerCase();
  cached =
    which === "mock"
      ? new MockProvider()
      : which === "rajakai"
        ? new RajaKaiProvider()
        : new GapekaProvider();
  return cached;
}

export function providerInfo() {
  const p = getProvider();
  return { name: p.name, isMock: p.isMock };
}

export type { TrainDataProvider };
