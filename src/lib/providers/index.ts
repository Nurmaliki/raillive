import { MockProvider } from "@/lib/providers/mock";
import { RajaKaiProvider } from "@/lib/providers/rajakai";
import type { TrainDataProvider } from "@/lib/providers/types";

/**
 * Titik tunggal untuk memilih provider data.
 *
 * Diatur lewat environment variable `DATA_PROVIDER`:
 *   - "mock"    (default) -> data simulasi, selalu jalan tanpa API key
 *   - "rajakai"           -> API RajaKAI (butuh RAJAKAI_API_KEY)
 */
let cached: TrainDataProvider | null = null;

export function getProvider(): TrainDataProvider {
  if (cached) return cached;
  const which = (process.env.DATA_PROVIDER ?? "mock").toLowerCase();
  cached = which === "rajakai" ? new RajaKaiProvider() : new MockProvider();
  return cached;
}

export function providerInfo() {
  const p = getProvider();
  return { name: p.name, isMock: p.isMock };
}

export type { TrainDataProvider };
