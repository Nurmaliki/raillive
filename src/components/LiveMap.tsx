"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useLivePolling } from "@/lib/useLivePolling";
import { LiveBadge, LineBadge, OperatorBadge } from "@/components/Badges";
import type { RouteLine } from "@/components/LiveMapCanvas";
import { routePathForLine } from "@/lib/railLines";
import {
  KRL_LINE_ORDER,
  LINE_META,
  OPERATOR_META,
  type LiveStatus,
  type Operator,
  type Station,
  type Train,
} from "@/lib/types";

/** Kanvas peta memakai Leaflet (butuh DOM) → hanya di klien. */
const LiveMapCanvas = dynamic(
  () => import("@/components/LiveMapCanvas").then((m) => m.LiveMapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] w-full items-center justify-center bg-[#0a0f1a] text-sm text-muted sm:h-[520px] lg:h-[600px]">
        Memuat peta…
      </div>
    ),
  },
);

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
  const [operatorFilter, setOperatorFilter] = useState<Operator | "all">("KRL");
  const [lineFilter, setLineFilter] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [hover, setHover] = useState<string | null>(null);

  // Sinkronkan pilihan bila URL berubah (menyesuaikan state saat render).
  const [prevInitialTrain, setPrevInitialTrain] = useState(initialTrain);
  if (initialTrain !== prevInitialTrain) {
    setPrevInitialTrain(initialTrain);
    if (initialTrain) setSelected(initialTrain);
  }

  const { data, error, loading, lastUpdated, refresh } = useLivePolling<LiveResponse>(
    "/api/live",
    15000,
  );

  const stationByCode = useMemo(
    () => new Map(stations.map((s) => [s.code, s])),
    [stations],
  );

  /**
   * Garis rute: digabung per lin (KRL/MRT/LRT) memakai susunan perhentian
   * terlengkap, sedangkan KA antarkota digambar per kereta (rutenya berbeda).
   * Membangun dari jadwal (bukan posisi live) → garis tetap utuh & mulus.
   */
  const routes = useMemo<RouteLine[]>(() => {
    const byLine = new Map<string, { operator: Operator; line: string; stops: string[] }>();
    const kaiRoutes: RouteLine[] = [];

    for (const t of trains) {
      const codes = t.stops
        .map((st) => st.stationCode)
        .filter((c) => stationByCode.has(c));
      if (codes.length < 2) continue;

      if (t.line) {
        const prev = byLine.get(t.line);
        if (!prev || codes.length > prev.stops.length) {
          byLine.set(t.line, { operator: t.operator, line: t.line, stops: codes });
        }
      } else {
        kaiRoutes.push({
          key: `kai-${t.id}`,
          operator: t.operator,
          color: OPERATOR_META[t.operator].color,
          path: codes.map((c) => {
            const s = stationByCode.get(c)!;
            return [s.lat, s.lng] as [number, number];
          }),
          stationCodes: codes,
        });
      }
    }

    const lineRoutes: RouteLine[] = [];
    for (const [line, v] of byLine) {
      const stationCoords = v.stops.map((c) => {
        const s = stationByCode.get(c)!;
        return [s.lat, s.lng] as [number, number];
      });
      lineRoutes.push({
        key: line,
        operator: v.operator,
        line,
        color: LINE_META[line]?.color ?? OPERATOR_META[v.operator].color,
        // Garis mengikuti REL ASLI (geometri OSM) bila tersedia.
        path: routePathForLine(line, stationCoords) as [number, number][],
        stationCodes: v.stops,
      });
    }
    return [...lineRoutes, ...kaiRoutes];
  }, [trains, stationByCode]);

  const liveTrains = useMemo(() => {
    const list = data?.trains ?? [];
    const filtered = list.filter((t) => {
      if (operatorFilter !== "all" && t.operator !== operatorFilter) return false;
      if (lineFilter && t.line !== lineFilter) return false;
      return true;
    });
    // Kereta yang bergerak dulu, lalu terlambat, lalu yang belum berangkat/tiba.
    const rank = (t: LiveStatus) => {
      if (t.status === "delayed") return 0;
      if (t.status === "on-time") return 1;
      if (t.status === "not-started") return 2;
      return 3; // arrived / cancelled
    };
    return [...filtered].sort(
      (a, b) => rank(a) - rank(b) || b.delayMin - a.delayMin || a.trainName.localeCompare(b.trainName),
    );
  }, [data, operatorFilter, lineFilter]);

  const moving = liveTrains.filter((t) => t.status !== "not-started" && t.status !== "arrived");
  const selectedTrain = liveTrains.find((t) => t.trainId === selected) ?? null;

  /** Penanda di peta: sembunyikan yang sudah tiba (kecuali sedang dipilih). */
  const mapTrains = useMemo(
    () =>
      liveTrains.filter(
        (t) => t.status !== "arrived" || t.trainId === selected,
      ),
    [liveTrains, selected],
  );

  /** Kunci rute yang terlihat → menentukan area fokus peta. */
  const focusKeys = useMemo(() => {
    if (lineFilter) return [lineFilter];
    if (operatorFilter === "all") return routes.map((r) => r.key);
    return routes.filter((r) => r.operator === operatorFilter).map((r) => r.key);
  }, [routes, lineFilter, operatorFilter]);

  /**
   * Stasiun yang diberi label nama: semua perhentian pada rute yang sedang
   * terlihat (mengikuti filter operator/lin), sehingga tidak menumpuk.
   */
  const labeledStations = useMemo(() => {
    const keys = new Set(focusKeys);
    const codes = new Set<string>();
    for (const r of routes) {
      if (!keys.has(r.key)) continue;
      for (const c of r.stationCodes ?? []) codes.add(c);
    }
    return [...codes];
  }, [routes, focusKeys]);

  /**
   * Stasiun "utama" (simpul transit / terminal rute) — labelnya tetap tampil
   * walau peta diperkecil, agar tidak terlalu padat. Sisanya muncul saat zoom in.
   */
  const primaryStations = useMemo(() => {
    const keys = new Set(focusKeys);
    const codes = new Set<string>();
    for (const r of routes) {
      if (!keys.has(r.key)) continue;
      const sc = r.stationCodes ?? [];
      // Terminal (ujung rute).
      if (sc[0]) codes.add(sc[0]);
      if (sc.length > 1) codes.add(sc[sc.length - 1]);
      // Simpul transit (dilayani >1 lin).
      for (const c of sc) {
        if ((stationByCode.get(c)?.lines?.length ?? 0) > 1) codes.add(c);
      }
    }
    return [...codes];
  }, [routes, focusKeys, stationByCode]);

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
              onChange={(e) => {
                setOperatorFilter(e.target.value as Operator | "all");
                setLineFilter(null);
              }}
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
              onClick={() => setShowLabels((v) => !v)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${
                showLabels ? "border-brand/50 text-foreground" : "border-border text-muted hover:border-brand/40"
              }`}
              title="Tampilkan/sembunyikan nama stasiun"
            >
              {showLabels ? "Nama stasiun ✓" : "Nama stasiun"}
            </button>
            <button
              onClick={refresh}
              className="rounded-lg border border-border px-2.5 py-1.5 text-xs transition hover:border-brand/50"
            >
              {loading ? "Memuat…" : "Segarkan"}
            </button>
          </div>
        </div>

        <div className="relative">
          <LiveMapCanvas
            stations={stations}
            routes={routes}
            focusKeys={focusKeys}
            labeledStations={labeledStations}
            primaryStations={primaryStations}
            showLabels={showLabels}
            trains={mapTrains}
            selected={selected}
            hovered={hover}
            activeLine={selectedTrain?.line ?? null}
            lineFilter={lineFilter}
            onSelect={setSelected}
            onHover={setHover}
          />

          <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-lg border border-border bg-surface/90 px-3 py-2 text-xs text-muted">
            {lastUpdated
              ? `Diperbarui ${lastUpdated.toLocaleTimeString("id-ID")}`
              : "Menunggu data…"}
            {error && <span className="ml-2 text-red-400">· {error}</span>}
          </div>

          {lineFilter && (
            <button
              onClick={() => setLineFilter(null)}
              className="absolute right-3 top-3 z-[500] rounded-lg border border-border bg-surface/90 px-3 py-1.5 text-xs transition hover:border-brand/50"
            >
              {LINE_META[lineFilter]?.name ?? "Lin"} ✕
            </button>
          )}
        </div>

        {/* Legenda lin — klik untuk menyorot/menyaring */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
          <span className="mr-1 text-[11px] uppercase tracking-wider text-muted">Lin</span>
          {KRL_LINE_ORDER.map((id) => {
            const active = lineFilter === id;
            return (
              <button
                key={id}
                onClick={() => setLineFilter(active ? null : id)}
                className={`flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs transition ${
                  active
                    ? "border-transparent text-white"
                    : "border-border text-muted hover:border-brand/40"
                }`}
                style={active ? { backgroundColor: LINE_META[id].color } : undefined}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: LINE_META[id].color }}
                />
                {LINE_META[id].name}
              </button>
            );
          })}
          {(["mrt", "lrt-bekasi", "lrt-cibubur"] as const).map((id) => {
            const active = lineFilter === id;
            return (
              <button
                key={id}
                onClick={() => setLineFilter(active ? null : id)}
                className={`flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs transition ${
                  active
                    ? "border-transparent text-white"
                    : "border-border text-muted hover:border-brand/40"
                }`}
                style={active ? { backgroundColor: LINE_META[id].color } : undefined}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: LINE_META[id].color }}
                />
                {LINE_META[id].name}
              </button>
            );
          })}
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
            <li className="card p-4 text-sm text-muted">Tidak ada kereta untuk filter ini.</li>
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
                    {t.line && <LineBadge line={t.line} />}
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
                      backgroundColor:
                        (t.line && LINE_META[t.line]?.color) || OPERATOR_META[t.operator].color,
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
              {selectedTrain.line && <LineBadge line={selectedTrain.line} showName />}
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
            <Detail label="Posisi terakhir" value={selectedTrain.lastStationName} />
            <Detail label="Stasiun berikutnya" value={selectedTrain.nextStationName ?? "—"} />
            <Detail
              label="Keterlambatan"
              value={selectedTrain.delayMin > 0 ? `+${selectedTrain.delayMin} menit` : "Tepat waktu"}
            />
            <Detail label="ETA berikutnya" value={selectedTrain.etaNext ?? "—"} />
            <Detail label="Kecepatan" value={`${selectedTrain.speedKmh} km/jam`} />
            <Detail label="Progres" value={`${Math.round(selectedTrain.progress * 100)}%`} />
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
