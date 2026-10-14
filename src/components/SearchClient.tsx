"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StationPicker } from "@/components/StationPicker";
import { OperatorBadge, DelayChip, LineBadge } from "@/components/Badges";
import { addFavorite, useFavorites } from "@/lib/favorites";
import { formatDuration } from "@/lib/time";
import { useToday } from "@/lib/useLivePolling";
import type { JourneyOption, Station } from "@/lib/types";

interface SearchResponse {
  origin: string;
  destination: string;
  date: string;
  count: number;
  journeys: JourneyOption[];
}

export function SearchClient({ stations }: { stations: Station[] }) {
  // Default rute KRL yang populer (Manggarai → Bogor).
  const [origin, setOrigin] = useState("MRI");
  const [destination, setDestination] = useState("BOG");
  const [dateInput, setDateInput] = useState("");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tanggal default = hari ini (dihitung di klien, tanpa setState di effect).
  const today = useToday();
  const date = dateInput || today;

  // Status favorit diturunkan dari store, bukan disalin ke state.
  const favorites = useFavorites();
  const saved = favorites.some((f) => f.origin === origin && f.destination === destination);

  async function runSearch() {
    if (origin === destination) {
      setError("Stasiun asal dan tujuan tidak boleh sama.");
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = `/api/search?origin=${origin}&destination=${destination}&date=${date}`;
      const res = await fetch(url, { cache: "no-store" });
      const json = (await res.json()) as SearchResponse;
      setData(json);
    } catch {
      setError("Gagal mengambil data jadwal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const hasResults = useMemo(() => (data?.journeys?.length ?? 0) > 0, [data]);

  return (
    <div className="space-y-6">
      <div className="card p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StationPicker label="Dari" stations={stations} value={origin} onChange={setOrigin} />
          <StationPicker
            label="Ke"
            stations={stations}
            value={destination}
            onChange={setDestination}
          />
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              Tanggal
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDateInput(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 outline-none focus:border-brand/60"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={runSearch}
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-brand to-brand-2 px-4 py-3 font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Mencari…" : "Cari Jadwal"}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              addFavorite(origin, destination);
            }}
            className="rounded-lg border border-border px-3 py-1.5 text-xs transition hover:border-brand/50"
          >
            {saved ? "⭐ Tersimpan di favorit" : "☆ Simpan rute ini"}
          </button>
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
      </div>

      {data && (
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-bold">
              {data.journeys[0]?.origin.name} → {data.journeys[0]?.destination.name}
            </h2>
            <span className="text-sm text-muted">{data.count} perjalanan ditemukan</span>
          </div>

          {!hasResults ? (
            <p className="card p-6 text-center text-muted">
              Tidak ada perjalanan langsung untuk rute ini. Coba kombinasi stasiun lain.
            </p>
          ) : (
            <ul className="space-y-3">
              {data.journeys.map((j) => (
                <li key={j.train.id} className="card fade-up p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <OperatorBadge operator={j.train.operator} />
                      {j.train.line && <LineBadge line={j.train.line} />}
                      <div>
                        <p className="font-semibold">{j.train.name}</p>
                        <p className="text-xs text-muted">
                          KA {j.train.number} · {j.train.serviceClass}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <DelayChip delayMin={j.delayMin} />
                      {j.live && (
                        <Link
                          href={`/live?train=${j.train.id}`}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs transition hover:border-brand/50"
                        >
                          Lihat posisi
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    <div className="text-center">
                      <div className="tabular text-2xl font-bold">{j.departTime}</div>
                      <div className="text-xs text-muted">{j.origin.code}</div>
                    </div>
                    <div className="flex-1">
                      <div className="relative h-px bg-border">
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-surface px-2 text-xs text-muted">
                          {formatDuration(j.durationMin)}
                        </span>
                      </div>
                      <p className="mt-3 text-center text-xs text-muted">
                        {j.distanceKm} km · {j.train.stops.length} perhentian
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="tabular text-2xl font-bold">{j.arriveTime}</div>
                      <div className="text-xs text-muted">{j.destination.code}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs text-muted">Mulai dari</span>
                    <span className="font-semibold text-brand">
                      Rp {j.priceFrom.toLocaleString("id-ID")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!data && !loading && (
        <p className="card p-8 text-center text-muted">
          Pilih stasiun asal dan tujuan, lalu tekan <b>Cari Jadwal</b>.
        </p>
      )}
    </div>
  );
}
