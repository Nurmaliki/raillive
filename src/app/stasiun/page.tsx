import { getProvider } from "@/lib/providers";
import { StationBoard } from "@/components/StationBoard";

export const dynamic = "force-dynamic";

export default async function StasiunPage() {
  const stations = await getProvider().getStations();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Papan Keberangkatan Stasiun</h1>
        <p className="mt-1 text-sm text-muted">
          Papan digital real-time untuk setiap stasiun: jam keberangkatan, peron, dan status.
        </p>
      </header>
      <StationBoard stations={stations} />
    </div>
  );
}
