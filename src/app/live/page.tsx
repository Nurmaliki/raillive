import { getProvider } from "@/lib/providers";
import { TRAINS } from "@/lib/data/trains";
import { LiveMap } from "@/components/LiveMap";

export const dynamic = "force-dynamic";

export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const trainParam = typeof sp.train === "string" ? sp.train : undefined;
  const stations = await getProvider().getStations();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Peta Kereta Live</h1>
          <p className="mt-1 text-sm text-muted">
            Posisi, progres, dan status keterlambatan diperbarui otomatis tiap 15 detik.
          </p>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
          <span className="pulse-dot" /> Live
        </span>
      </header>
      <LiveMap stations={stations} trains={TRAINS} initialTrain={trainParam} />
    </div>
  );
}
