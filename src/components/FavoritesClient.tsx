"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { removeFavorite, updateFavorite, useFavorites } from "@/lib/favorites";
import { useLivePolling } from "@/lib/useLivePolling";
import { DelayChip, OperatorBadge } from "@/components/Badges";
import type { FavoriteRoute, JourneyOption } from "@/lib/types";

interface LiveResponse {
  trains: { trainId: string; delayMin: number; status: string }[];
}

export function FavoritesClient() {
  // Dibaca langsung dari store (aman hidrasi, tidak perlu state/effect).
  const favorites = useFavorites();

  const { data } = useLivePolling<LiveResponse>("/api/live", 15000);

  const delayByTrain = new Map((data?.trains ?? []).map((t) => [t.trainId, t]));

  return (
    <div className="space-y-6">
      {favorites.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-3xl">⭐</p>
          <h2 className="mt-3 font-bold">Belum ada rute favorit</h2>
          <p className="mt-1 text-sm text-muted">
            Simpan rute dari halaman Cari Jadwal untuk memantau delay-nya di sini.
          </p>
          <Link
            href="/jadwal"
            className="mt-5 inline-block rounded-xl bg-gradient-to-r from-brand to-brand-2 px-5 py-2.5 font-semibold text-slate-950"
          >
            Cari Jadwal
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {favorites.map((fav) => (
            <FavoriteCard
              key={fav.id}
              fav={fav}
              delayByTrain={delayByTrain}
              onRemove={() => removeFavorite(fav.id)}
              onThreshold={(v) => updateFavorite(fav.id, { notifyDelayOver: v })}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function FavoriteCard({
  fav,
  delayByTrain,
  onRemove,
  onThreshold,
}: {
  fav: FavoriteRoute;
  delayByTrain: Map<string, { trainId: string; delayMin: number; status: string }>;
  onRemove: () => void;
  onThreshold: (v: number) => void;
}) {
  const [journeys, setJourneys] = useState<JourneyOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/search?origin=${fav.origin}&destination=${fav.destination}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { journeys: JourneyOption[] }) => {
        if (active) setJourneys(json.journeys ?? []);
      })
      .catch(() => {
        if (active) setJourneys([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fav.origin, fav.destination]);

  // Kereta yang delay-nya melewati ambang peringatan.
  const alerts = journeys.filter((j) => {
    const live = delayByTrain.get(j.train.id);
    const delay = live?.delayMin ?? j.delayMin;
    return delay >= fav.notifyDelayOver && delay > 0;
  });

  return (
    <li className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xl">⭐</span>
          <div>
            <h3 className="font-semibold">
              {journeys[0]?.origin.name ?? fav.origin} →{" "}
              {journeys[0]?.destination.name ?? fav.destination}
            </h3>
            <p className="text-xs text-muted">
              {loading ? "Memuat jadwal…" : `${journeys.length} perjalanan langsung`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted">
            Peringatan delay ≥
            <select
              value={fav.notifyDelayOver}
              onChange={(e) => onThreshold(Number(e.target.value))}
              className="rounded-lg border border-border bg-surface px-2 py-1 text-xs outline-none"
            >
              {[5, 10, 15, 30].map((v) => (
                <option key={v} value={v}>
                  {v} mnt
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={onRemove}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-red-400 transition hover:border-red-500/50"
          >
            Hapus
          </button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">
          ⚠️ {alerts.length} kereta mengalami delay ≥ {fav.notifyDelayOver} menit:{" "}
          {alerts.map((a) => a.train.name).join(", ")}
        </div>
      )}

      {!loading && journeys.length > 0 && (
        <ul className="mt-4 space-y-2">
          {journeys.map((j) => {
            const live = delayByTrain.get(j.train.id);
            const delay = live?.delayMin ?? j.delayMin;
            return (
              <li
                key={j.train.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3.5 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <OperatorBadge operator={j.train.operator} />
                  <div>
                    <div className="text-sm font-medium">{j.train.name}</div>
                    <div className="tabular text-xs text-muted">
                      {j.departTime} → {j.arriveTime}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DelayChip delayMin={delay} />
                  <Link
                    href={`/live?train=${j.train.id}`}
                    className="rounded-lg border border-border px-3 py-1 text-xs transition hover:border-brand/50"
                  >
                    Posisi
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && journeys.length === 0 && (
        <p className="mt-3 text-sm text-muted">
          Tidak ada perjalanan langsung untuk rute ini.
        </p>
      )}
    </li>
  );
}
