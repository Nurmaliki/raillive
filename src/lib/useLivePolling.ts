"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Hook polling data real-time.
 * `path` boleh null untuk menonaktifkan polling.
 */
export function useLivePolling<T>(path: string | null, intervalMs = 15000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchOnce = useCallback(async () => {
    if (!path) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const res = await fetch(path, { signal: ctrl.signal, cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as T;
      setData(json);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    if (!path) return;
    // Panggilan pertama dijadwalkan lewat timeout (bukan sinkron di dalam
    // effect) agar tidak memicu cascading render saat mount.
    const kick = setTimeout(() => void fetchOnce(), 0);
    const id = setInterval(() => void fetchOnce(), intervalMs);
    return () => {
      clearTimeout(kick);
      clearInterval(id);
      abortRef.current?.abort();
    };
  }, [path, intervalMs, fetchOnce]);

  return { data, error, loading, lastUpdated, refresh: fetchOnce };
}

/* ------------------------------------------------------------------ */
/* Jam berdetak & tanggal hari ini — berbasis useSyncExternalStore     */
/* sehingga aman dari hydration mismatch dan tanpa setState di effect. */
/* ------------------------------------------------------------------ */

const clockListeners = new Set<() => void>();
let clockTimer: ReturnType<typeof setInterval> | null = null;

function subscribeClock(callback: () => void): () => void {
  clockListeners.add(callback);
  if (!clockTimer) {
    clockTimer = setInterval(() => {
      for (const listener of clockListeners) listener();
    }, 1000);
  }
  return () => {
    clockListeners.delete(callback);
    if (clockListeners.size === 0 && clockTimer) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  };
}

function getClockSnapshot(): number {
  return Math.floor(Date.now() / 1000) * 1000;
}

function getClockServerSnapshot(): number | null {
  return null;
}

/** Jam lokal yang berdetak tiap detik; `null` sebelum hidrasi di klien. */
export function useClock(): Date | null {
  const ms = useSyncExternalStore(subscribeClock, getClockSnapshot, getClockServerSnapshot);
  return ms === null ? null : new Date(ms);
}

/** Tanggal hari ini "YYYY-MM-DD" menurut waktu lokal klien. */
function getTodaySnapshot(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(
    t.getDate(),
  ).padStart(2, "0")}`;
}

function getTodayServerSnapshot(): string {
  return "";
}

export function useToday(): string {
  return useSyncExternalStore(
    // Tanggal tidak berubah selama sesi; berlangganan no-op.
    () => () => {},
    getTodaySnapshot,
    getTodayServerSnapshot,
  );
}
