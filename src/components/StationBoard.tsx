"use client";

import { useMemo, useState } from "react";
import { StationPicker } from "@/components/StationPicker";
import { LineBadge, OperatorBadge, StatusBadge } from "@/components/Badges";
import { useClock, useLivePolling } from "@/lib/useLivePolling";
import { KRL_LINE_ORDER, LINE_META, type Departure, type Station } from "@/lib/types";

interface DeparturesResponse {
  station: string;
  date: string;
  departures: Departure[];
}

const OP_FILTERS = [
  { id: "all", label: "Semua" },
  { id: "KRL", label: "KRL" },
  { id: "MRT", label: "MRT" },
  { id: "LRT", label: "LRT" },
  { id: "KAI", label: "Antarkota" },
] as const;

export function StationBoard({ stations }: { stations: Station[] }) {
  // Default ke stasiun KRL (Manggarai) supaya papan langsung terisi.
  const [station, setStation] = useState("MRI");
  const [window_, setWindow] = useState(240);
  const [opFilter, setOpFilter] = useState<(typeof OP_FILTERS)[number]["id"]>("all");
  const [lineFilter, setLineFilter] = useState<string>("all");
  const now = useClock();

  const path = useMemo(
    () => `/api/departures?station=${station}&window=${window_}`,
    [station, window_],
  );
  const { data, loading, lastUpdated, refresh } = useLivePolling<DeparturesResponse>(path, 20000);

  const stationMeta = stations.find((s) => s.code === station);
  const stationName = stationMeta?.name ?? station;
  const allDepartures = useMemo(() => data?.departures ?? [], [data]);

  // Lin apa saja yang dilayani stasiun ini (untuk chip filter).
  const availableLines = useMemo(() => {
    const set = new Set(allDepartures.map((d) => d.line).filter(Boolean) as string[]);
    return KRL_LINE_ORDER.filter((l) => set.has(l)).concat(
      Array.from(set).filter((l) => !KRL_LINE_ORDER.includes(l)),
    );
  }, [allDepartures]);

  const departures = useMemo(() => {
    return allDepartures.filter((d) => {
      if (opFilter !== "all" && d.operator !== opFilter) return false;
      if (lineFilter !== "all" && d.line !== lineFilter) return false;
      return true;
    });
  }, [allDepartures, opFilter, lineFilter]);

  const isKrlStation = (stationMeta?.lines?.length ?? 0) > 0;

  return (
    <div className="space-y-5">
      {/* relative z-20: kartu filter harus menumpuk di atas kartu hasil, supaya
          dropdown stasiun (yang berada di dalamnya) tidak tertimpa. */}
      <div className="card relative z-20 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
          <StationPicker
            label="Stasiun"
            stations={stations}
            value={station}
            onChange={(c) => {
              setStation(c);
              setLineFilter("all");
            }}
          />
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              Rentang
            </label>
            <select
              value={window_}
              onChange={(e) => setWindow(Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 outline-none"
            >
              <option value={60}>1 jam ke depan</option>
              <option value={120}>2 jam ke depan</option>
              <option value={240}>4 jam ke depan</option>
              <option value={480}>8 jam ke depan</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={refresh}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 font-semibold transition hover:border-brand/50"
            >
              {loading ? "Memuat…" : "Segarkan"}
            </button>
          </div>
        </div>

        {/* Filter operator */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {OP_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setOpFilter(f.id);
                setLineFilter("all");
              }}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                opFilter === f.id
                  ? "border-brand bg-brand/15 text-brand"
                  : "border-border bg-surface text-muted hover:border-brand/40"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Filter lin KRL */}
        {availableLines.length > 1 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-muted">Lin:</span>
            <button
              onClick={() => setLineFilter("all")}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition ${
                lineFilter === "all"
                  ? "border-brand bg-brand/15 text-brand"
                  : "border-border bg-surface text-muted hover:border-brand/40"
              }`}
            >
              Semua
            </button>
            {availableLines.map((l) => {
              const meta = LINE_META[l];
              const active = lineFilter === l;
              return (
                <button
                  key={l}
                  onClick={() => setLineFilter(l)}
                  className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition"
                  style={
                    active
                      ? { borderColor: meta?.color, backgroundColor: `${meta?.color}22`, color: meta?.color }
                      : { borderColor: "var(--border)", color: "var(--muted)" }
                  }
                >
                  {meta?.name ?? l}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <h2 className="font-bold">Keberangkatan · {stationName}</h2>
            {stationMeta?.lines?.map((l) => <LineBadge key={l} line={l} />)}
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted">
              {departures.length} keberangkatan
              {lastUpdated && ` · diperbarui ${lastUpdated.toLocaleTimeString("id-ID")}`}
            </p>
            <div className="tabular rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-semibold">
              {now ? now.toLocaleTimeString("id-ID") : "--:--:--"}
            </div>
          </div>
        </div>

        {departures.length === 0 ? (
          <div className="p-8 text-center">
            {loading ? (
              <p className="text-muted">Memuat keberangkatan…</p>
            ) : !isKrlStation && opFilter === "all" ? (
              <>
                <p className="font-semibold">Tidak ada keberangkatan pada rentang ini.</p>
                <p className="mt-1 text-sm text-muted">
                  Stasiun ini tidak dilayani KRL. Coba pilih stasiun KRL seperti Manggarai,
                  Tanah Abang, atau Duri, atau ubah filter di atas.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold">Tidak ada keberangkatan pada rentang ini.</p>
                <p className="mt-1 text-sm text-muted">
                  Coba perbesar rentang waktu (mis. 8 jam) atau pilih stasiun lain.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Tabel untuk layar sedang ke atas */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-semibold">Jam</th>
                  <th className="px-4 py-3 font-semibold">Kereta</th>
                  <th className="px-4 py-3 font-semibold">Lin</th>
                  <th className="px-4 py-3 font-semibold">Tujuan</th>
                  <th className="px-4 py-3 font-semibold">Peron</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {departures.map((d) => (
                  <tr
                    key={`${d.trainId}-${d.scheduled}`}
                    className="border-b border-border/50 transition hover:bg-surface-2/40"
                  >
                    <td className="px-4 py-3">
                      <div className="tabular text-base font-bold">{d.actual}</div>
                      {d.delayMin > 0 && (
                        <div className="tabular text-[11px] text-muted line-through">
                          {d.scheduled}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <OperatorBadge operator={d.operator} />
                        <div>
                          <div className="font-medium">{d.trainName}</div>
                          <div className="text-[11px] text-muted">KA {d.trainNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {d.line ? <LineBadge line={d.line} showName /> : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{d.destinationName}</div>
                      <div className="text-[11px] text-muted">{d.destination}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="tabular inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface font-semibold">
                        {d.platform}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={d.status} />
                        {d.delayMin > 0 && (
                          <span className="text-[11px] font-semibold text-red-400">
                            +{d.delayMin} menit
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {/* Daftar kartu untuk layar kecil (mobile) */}
            <ul className="divide-y divide-border/60 sm:hidden">
              {departures.map((d) => (
                <li
                  key={`${d.trainId}-${d.scheduled}`}
                  className="flex items-start gap-3 px-4 py-3.5"
                >
                  <div className="w-16 shrink-0 text-center">
                    <div className="tabular text-lg font-bold leading-tight">{d.actual}</div>
                    {d.delayMin > 0 && (
                      <div className="tabular text-[11px] text-muted line-through">{d.scheduled}</div>
                    )}
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-muted">
                      Peron {d.platform}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <OperatorBadge operator={d.operator} />
                      {d.line && <LineBadge line={d.line} />}
                    </div>
                    <div className="mt-1 text-sm font-medium">{d.trainName}</div>
                    <div className="text-[11px] text-muted">
                      KA {d.trainNumber} · ke {d.destinationName} ({d.destination})
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <StatusBadge status={d.status} />
                      {d.delayMin > 0 && (
                        <span className="text-[11px] font-semibold text-red-400">
                          +{d.delayMin} menit
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
