"use client";

import { useEffect, useMemo, useState } from "react";
import { StationPicker } from "@/components/StationPicker";
import { OperatorBadge, StatusBadge } from "@/components/Badges";
import { useLivePolling } from "@/lib/useLivePolling";
import type { Departure, Station } from "@/lib/types";

interface DeparturesResponse {
  station: string;
  date: string;
  departures: Departure[];
}

export function StationBoard({ stations }: { stations: Station[] }) {
  const [station, setStation] = useState("GMR");
  const [window_, setWindow] = useState(240);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const path = useMemo(
    () => `/api/departures?station=${station}&window=${window_}`,
    [station, window_],
  );
  const { data, loading, lastUpdated, refresh } = useLivePolling<DeparturesResponse>(path, 20000);

  const stationName = stations.find((s) => s.code === station)?.name ?? station;
  const departures = data?.departures ?? [];

  return (
    <div className="space-y-5">
      <div className="card p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
          <StationPicker label="Stasiun" stations={stations} value={station} onChange={setStation} />
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
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div>
            <h2 className="font-bold">Keberangkatan · {stationName}</h2>
            <p className="text-xs text-muted">
              {departures.length} keberangkatan
              {lastUpdated && ` · diperbarui ${lastUpdated.toLocaleTimeString("id-ID")}`}
            </p>
          </div>
          <div className="tabular rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-semibold">
            {now ? now.toLocaleTimeString("id-ID") : "--:--:--"}
          </div>
        </div>

        {departures.length === 0 ? (
          <p className="p-8 text-center text-muted">
            {loading ? "Memuat keberangkatan…" : "Tidak ada keberangkatan pada rentang ini."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-semibold">Jam</th>
                  <th className="px-4 py-3 font-semibold">Kereta</th>
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
        )}
      </div>
    </div>
  );
}
