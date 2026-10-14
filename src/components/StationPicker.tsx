"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Station } from "@/lib/types";

/**
 * Input pencarian stasiun dengan saran (autocomplete).
 * Menerima daftar stasiun dari luar agar tidak fetch berulang.
 */
export function StationPicker({
  label,
  stations,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  stations: Station[];
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => stations.find((s) => s.code === value),
    [stations, value],
  );

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stations.slice(0, 8);
    return stations
      .map((s) => {
        const name = s.name.toLowerCase();
        const city = s.city.toLowerCase();
        const code = s.code.toLowerCase();
        let score = -1;
        if (name.startsWith(q) || city.startsWith(q)) score = 90;
        else if (code.startsWith(q)) score = 80;
        else if (name.includes(q) || city.includes(q)) score = 60;
        return { s, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.s);
  }, [query, stations]);

  return (
    <div ref={boxRef} className="relative">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-3.5 py-3 text-left transition hover:border-brand/50"
      >
        {selected ? (
          <span>
            <span className="font-semibold">{selected.name}</span>
            <span className="ml-2 text-xs text-muted">{selected.code}</span>
          </span>
        ) : (
          <span className="text-muted">{placeholder ?? "Pilih stasiun"}</span>
        )}
        <span className="text-muted">▾</span>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama stasiun atau kota…"
            className="w-full border-b border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none placeholder:text-muted"
          />
          <ul className="max-h-64 overflow-auto">
            {results.length === 0 && (
              <li className="px-3.5 py-3 text-sm text-muted">Stasiun tidak ditemukan</li>
            )}
            {results.map((s) => (
              <li key={s.code}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(s.code);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm transition hover:bg-surface-2"
                >
                  <span>
                    <span className="font-medium">{s.name}</span>
                    <span className="ml-2 text-xs text-muted">{s.city}</span>
                  </span>
                  <span className="font-mono text-xs text-muted">{s.code}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
