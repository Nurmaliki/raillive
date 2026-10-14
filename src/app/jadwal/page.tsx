import { getProvider } from "@/lib/providers";
import { SearchClient } from "@/components/SearchClient";

export const dynamic = "force-dynamic";

export default async function JadwalPage() {
  const stations = await getProvider().getStations();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Cari Jadwal Kereta</h1>
        <p className="mt-1 text-sm text-muted">
          Pilih stasiun asal dan tujuan untuk melihat jadwal, durasi, dan estimasi harga.
        </p>
      </header>
      <SearchClient stations={stations} />
    </div>
  );
}
