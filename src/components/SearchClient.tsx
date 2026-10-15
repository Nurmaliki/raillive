"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StationPicker } from "@/components/StationPicker";
import { OperatorBadge, DelayChip, LineBadge } from "@/components/Badges";
import { addFavorite, useFavorites } from "@/lib/favorites";
import { formatDuration } from "@/lib/time";
import { useToday, useWibNow } from "@/lib/useLivePolling";
import type { JourneyOption, Station } from "@/lib/types";

interface SearchResponse {
  origin: string;
  destination: string;
  date: string;
  count: number;
  journeys: JourneyOption[];
}

/** Rentang cepat filter waktu (jam) — untuk mempersempit hasil dengan sekali klik. */
const TIME_PRESETS: { label: string; addH: number }[] = [
  { label: "Sekarang", addH: 0 },
  { label: "+1 jam", addH: 1 },
  { label: "+2 jam", addH: 2 },
];

function addHours(hhmm: string, h: number): string {
  const [H, M] = hhmm.split(":").map(Number);
  const total = (H * 60 + M + h * 60 + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function SearchClient({ stations }: { stations: Station[] }) {
  // Default rute KRL yang populer (Manggarai → Bogor).
  const [origin, setOrigin] = useState("MRI");
  const [destination, setDestination] = useState("BOG");
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tanggal default = hari ini (dihitung di klien, tanpa setState di effect).
  const today = useToday();
  const date = dateInput || today;
  // Jam WIB untuk preset "Sekarang" (null sebelum hidrasi → tombol dinonaktifkan).
  const wibNow = useWibNow();

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

  // Filter waktu diterapkan di klien: hanya perjalanan yang berangkat pada/ setelah jam dipilih.
  const filtered = useMemo(() => {
    const all = data?.journeys ?? [];
    if (!timeInput) return all;
    return all.filter((j) => j.departTime >= timeInput);
  }, [data, timeInput]);

  const hasResults = filtered.length > 0;
  const total = data?.journeys?.length ?? 0;
  const timeFiltered = Boolean(timeInput) && total > filtered.length;

  return (
    <div className="space-y-6">
      {/* relative z-20: kartu ini harus menumpuk di atas kartu hasil, supaya
          dropdown stasiun (yang berada di dalamnya) tidak tertimpa. */}
      <div className="card relative z-20 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted">
              <span>Waktu</span>
              {timeInput && (
                <button
                  type="button"
                  onClick={() => setTimeInput("")}
                  className="text-[10px] font-medium normal-case tracking-normal text-brand hover:underline"
                >
                  reset
                </button>
              )}
            </label>
            <input
              type="time"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 outline-none focus:border-brand/60"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={runSearch}
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-brand to-brand-2 px-4 py-3 font-semibold text-on-brand transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Mencari…" : "Cari Jadwal"}
            </button>
          </div>
        </div>

        {/* Preset waktu cepat — memudahkan memfilter tanpa mengetik. */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Berangkat dari:</span>
          {TIME_PRESETS.map((p) => {
            const val = wibNow ? addHours(wibNow, p.addH) : null;
            const active = val !== null && timeInput === val;
            return (
              <button
                key={p.label}
                type="button"
                disabled={!val}
                onClick={() => val && setTimeInput(val)}
                className={`rounded-lg border px-2.5 py-1 text-xs transition disabled:opacity-40 ${
                  active
                    ? "border-brand/60 bg-brand/10 text-brand"
                    : "border-border hover:border-brand/50"
                }`}
              >
                {p.label}
                {val && <span className="ml-1 text-muted">{val}</span>}
              </button>
            );
          })}
          {timeInput && (
            <span className="rounded-lg bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
              ≥ {timeInput}
            </span>
          )}
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
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold">
              {data.journeys[0]?.origin.name} → {data.journeys[0]?.destination.name}
            </h2>
            <span className="text-sm text-muted">
              {timeFiltered ? (
                <>
                  <b className="text-foreground">{filtered.length}</b> dari {total} perjalanan
                  <span className="text-brand"> · ≥ {timeInput}</span>
                </>
              ) : (
                <>{filtered.length} perjalanan ditemukan</>
              )}
            </span>
          </div>

          {!hasResults ? (
            <p className="card p-6 text-center text-muted">
              {timeFiltered
                ? `Tidak ada keberangkatan setelah ${timeInput}. Coba mundurkan waktu atau tekan reset.`
                : "Tidak ada perjalanan langsung maupun transit untuk rute ini. Coba kombinasi stasiun lain."}
            </p>
          ) : (
            <ul className="space-y-3">
              {filtered.map((j) => (
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
                        {j.distanceKm} km · {j.stopsCount ?? j.train.stops.length} stasiun dilalui
                        {j.transfers ? ` · ${j.transfers}x transit` : ""}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="tabular text-2xl font-bold">{j.arriveTime}</div>
                      <div className="text-xs text-muted">{j.destination.code}</div>
                    </div>
                  </div>

                  {/* Rincian tiap ruas bila perjalanan perlu transit. */}
                  {j.legs && j.legs.length > 1 && (
                    <div className="mt-4 space-y-2 rounded-xl border border-border bg-surface/60 p-3">
                      {j.legs.map((leg, li) => (
                        <div key={leg.train.id} className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/15 font-semibold text-brand">
                            {li + 1}
                          </span>
                          {leg.train.line && <LineBadge line={leg.train.line} />}
                          <span className="font-medium">{leg.train.name}</span>
                          <span className="text-muted">
                            {leg.origin.name} ({leg.origin.code}) → {leg.destination.name} (
                            {leg.destination.code})
                          </span>
                          <span className="tabular ml-auto text-muted">
                            {leg.departTime}–{leg.arriveTime}
                          </span>
                          {li < j.legs!.length - 1 && (
                            <span className="w-full text-[10px] text-amber-400/80">
                              Transit di {leg.destination.name} · tunggu{" "}
                              {j.legs![li + 1].departTime && leg.arriveTime
                                ? `${Math.max(
                                    0,
                                    Number(j.legs![li + 1].departTime.slice(0, 2)) * 60 +
                                      Number(j.legs![li + 1].departTime.slice(3, 5)) -
                                      (Number(leg.arriveTime.slice(0, 2)) * 60 +
                                        Number(leg.arriveTime.slice(3, 5))),
                                  )} menit`
                                : "sebentar"}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

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
