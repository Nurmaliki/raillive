"use client";

import { useEffect, useMemo, useState } from "react";
import { useLivePolling } from "@/lib/useLivePolling";
import { computeBounds, project } from "@/lib/geo";
import { LiveBadge, OperatorBadge } from "@/components/Badges";
import { OPERATOR_META, type LiveStatus, type Operator, type Station, type Train } from "@/lib/types";
import { formatDuration } from "@/lib/time";

const W = 1000;
const H = 720;

interface LiveResponse {
  trains: LiveStatus[];
  updatedAt: string;
  date: string;
  count: number;
}

export function LiveMap({
  stations,
  trains,
  initialTrain,
}: {
  stations: Station[];
  trains: Train[];
  initialTrain?: string;
}) {
  const [selected, setSelected] = useState<string | null>(initialTrain ?? null);
  const [operatorFilter, setOperatorFilter] = useState<Operator | "all">("all");
  const [hover, setHover] = useState<string | null>(null);

  const { data, error, loading, lastUpdated, refresh } = useLivePolling<LiveResponse>(
    "/api/live",
    15000,
  );

  const stationByCode = useMemo(
    () => new Map(stations.map((s) => [s.code, s])),
    [stations],
  );

  const bounds = useMemo(() => computeBounds(stations), [stations]);

  /** Segmen rute untuk digambar sebagai polyline. */
  const routes = useMemo(() => {
    return trains.map((t) => ({
      id: t.id,
      operator: t.operator,
      points: t.stops
        .map((st) => stationByCode.get(st.stationCode))
        .filter((s): s is Station => Boolean(s))
        .map((s) => project(s.lat, s.lng, bounds, W, H)),
    }));
  }, [trains, stationByCode, bounds]);

  const liveTrains = useMemo(() => {
    const list = data?.trains ?? [];
    return operatorFilter === "all"
      ? list
      : list.filter((t) => t.operator === operatorFilter);
  }, [data, operatorFilter]);

  const moving = liveTrains.filter((t) => t.status !== "not-started" && t.status !== "arrived");
  const selectedTrain = liveTrains.find((t) => t.trainId === selected) ?? null;

  // Sorot rute kereta terpilih.
  useEffect(() => {
    if (initialTrain) setSelected(initialTrain);
  }, [initialTrain]);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      {/* PETA */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="pulse-dot" />
            <span className="font-semibold">{moving.length}</span>
            <span className="text-muted">kereta bergerak</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={operatorFilter}
              onChange={(e) => setOperatorFilter(e.target.value as Operator | "all")}
              className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs outline-none"
            >
              <option value="all">Semua operator</option>
              {(Object.keys(OPERATOR_META) as Operator[]).map((op) => (
                <option key={op} value={op}>
                  {OPERATOR_META[op].label}
                </option>
              ))}
            </select>
            <button
              onClick={refresh}
              className="rounded-lg border border-border px-2.5 py-1.5 text-xs transition hover:border-brand/50"
            >
              {loading ? "Memuat…" : "Segarkan"}
            </button>
          </div>
        </div>

        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Peta kereta live">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1a2740" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width={W} height={H} fill="url(#grid)" />

            {/* Rute */}
            {routes.map((r) => {
              const isSel = selected === r.id;
              const dim = operatorFilter !== "all" && r.operator !== operatorFilter;
              return (
                <polyline
                  key={r.id}
                  points={r.points.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke={OPERATOR_META[r.operator].color}
                  strokeWidth={isSel ? 3.5 : 1.6}
                  strokeOpacity={dim ? 0.06 : isSel ? 0.95 : 0.28}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}

            {/* Stasiun */}
            {stations.map((s) => {
              const p = project(s.lat, s.lng, bounds, W, H);
              return (
                <g key={s.code}>
                  <circle cx={p.x} cy={p.y} r={3.2} fill="#0e1626" stroke="#4b5f85" strokeWidth="1.4" />
                  <text
                    x={p.x + 7}
                    y={p.y + 3.5}
                    fontSize="11"
                    fill="#93a2bd"
                    className="pointer-events-none select-none"
                  >
                    {s.code}
                  </text>
                </g>
              );
            })}

            {/* Kereta */}
            {liveTrains.map((t) => {
              const p = project(t.position.lat, t.position.lng, bounds, W, H);
              const meta = OPERATOR_META[t.operator];
              const isSel = selected === t.trainId;
              const isHover = hover === t.trainId;
              const active = isSel || isHover;
              return (
                <g
                  key={t.trainId}
                  className="cursor-pointer"
                  onClick={() => setSelected(t.trainId)}
                  onMouseEnter={() => setHover(t.trainId)}
                  onMouseLeave={() => setHover(null)}
                >
                  {(t.status === "on-time" || t.status === "delayed") && (
                    <circle cx={p.x} cy={p.y} r={14} fill={meta.color} opacity={0.18}>
                      <animate
                        attributeName="r"
                        values="9;18;9"
                        dur="2.4s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  <g
                    className="train-marker"
                    style={{ transform: `translate(${p.x}px, ${p.y}px)` }}
                  >
                    <circle
                      r={active ? 8 : 6}
                      fill={meta.color}
                      stroke="#070b14"
                      strokeWidth="2"
                    />
                    <circle r={active ? 3 : 2} fill="#070b14" />
                  </g>
                  {(active || isSel) && (
                    <g className="pointer-events-none">
                      <rect
                        x={p.x + 12}
                        y={p.y - 22}
                        width={Math.max(120, t.trainName.length * 7)}
                        height="40"
                        rx="8"
                        fill="#0e1626"
                        stroke={meta.color}
                        strokeWidth="1"
                        opacity="0.98"
                      />
                      <text x={p.x + 22} y={p.y - 6} fontSize="12" fontWeight="700" fill="#eef2f9">
                        {t.trainName}
                      </text>
                      <text x={p.x + 22} y={p.y + 10} fontSize="11" fill="#93a2bd">
                        {t.lastStationName} → {t.nextStationName ?? "akhir"}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-border bg-surface/90 px-3 py-2 text-xs text-muted">
            {lastUpdated
              ? `Diperbarui ${lastUpdated.toLocaleTimeString("id-ID")}`
              : "Menunggu data…"}
            {error && <span className="ml-2 text-red-400">· {error}</span>}
          </div>
        </div>

        {/* Legenda operator */}
        <div className="flex flex-wrap gap-4 border-t border-border px-4 py-3">
          {(Object.keys(OPERATOR_META) as Operator[]).map((op) => (
            <span key={op} className="flex items-center gap-2 text-xs text-muted">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: OPERATOR_META[op].color }}
              />
              {OPERATOR_META[op].label}
            </span>
          ))}
        </div>
      </div>

      {/* DAFTAR KERETA */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Daftar Kereta</h2>
          <span className="text-xs text-muted">{liveTrains.length} kereta</span>
        </div>
        <ul className="max-h-[720px] space-y-2 overflow-auto pr-1">
          {liveTrains.length === 0 && (
            <li className="card p-4 text-sm text-muted">
              Tidak ada kereta untuk filter ini.
            </li>
          )}
          {liveTrains.map((t) => (
            <li key={t.trainId}>
              <button
                onClick={() => setSelected(t.trainId)}
                onMouseEnter={() => setHover(t.trainId)}
                onMouseLeave={() => setHover(null)}
                className={`card w-full p-3.5 text-left transition ${
                  selected === t.trainId ? "border-brand/60 bg-surface-2/60" : "hover:border-brand/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <OperatorBadge operator={t.operator} />
                    <span className="text-sm font-semibold">{t.trainName}</span>
                  </div>
                  <LiveBadge status={t.status} />
                </div>
                <div className="mt-2 text-xs text-muted">
                  {t.lastStationName} → {t.nextStationName ?? "stasiun akhir"}
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round(t.progress * 100)}%`,
                      backgroundColor: OPERATOR_META[t.operator].color,
                    }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
                  <span>{Math.round(t.progress * 100)}% perjalanan</span>
                  <span>
                    {t.status === "not-started"
                      ? `Berangkat ${t.etaNext ?? "-"}`
                      : t.speedKmh > 0
                        ? `${t.speedKmh} km/jam`
                        : "berhenti"}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* PANEL DETAIL */}
      {selectedTrain && (
        <div className="card p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <OperatorBadge operator={selectedTrain.operator} />
              <div>
                <h3 className="text-lg font-bold">{selectedTrain.trainName}</h3>
                <p className="text-xs text-muted">KA {selectedTrain.trainNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LiveBadge status={selectedTrain.status} />
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs transition hover:border-brand/50"
              >
                Tutup
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <Detail label="Dari" value={selectedTrain.originName} />
            <Detail label="Tujuan" value={selectedTrain.destinationName} />
            <Detail
              label="Posisi terakhir"
              value={selectedTrain.lastStationName}
            />
            <Detail
              label="Stasiun berikutnya"
              value={selectedTrain.nextStationName ?? "—"}
            />
            <Detail
              label="Keterlambatan"
              value={selectedTrain.delayMin > 0 ? `+${selectedTrain.delayMin} menit` : "Tepat waktu"}
            />
            <Detail
              label="ETA berikutnya"
              value={selectedTrain.etaNext ?? "—"}
            />
            <Detail label="Kecepatan" value={`${selectedTrain.speedKmh} km/jam`} />
            <Detail
              label="Progres"
              value={`${Math.round(selectedTrain.progress * 100)}%`}
            />
          </div>

          <p className="mt-4 text-xs text-muted">
            Estimasi sisa perjalanan mengikuti posisi saat ini. Diperbarui{" "}
            {new Date(selectedTrain.updatedAt).toLocaleTimeString("id-ID")}.
          </p>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3.5 py-3">
      <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}
