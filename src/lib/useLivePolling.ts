"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
    fetchOnce();
    const id = setInterval(fetchOnce, intervalMs);
    return () => {
      clearInterval(id);
      abortRef.current?.abort();
    };
  }, [path, intervalMs, fetchOnce]);

  return { data, error, loading, lastUpdated, refresh: fetchOnce };
}

/** Jam lokal yang berdetak tiap detik (hindari hydration mismatch). */
export function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}
