"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LINE_META, OPERATOR_META, type Operator, type Station } from "@/lib/types";

const OP_ORDER: Operator[] = ["KRL", "MRT", "LRT", "KAI"];

/**
 * Input pencarian stasiun dengan saran (combobox).
 * Hasil dikelompokkan per operator dan menampilkan chip lin berwarna,
 * supaya stasiun KRL mudah ditemukan.
 */
export function StationPicker({
  label,
  stations,
  value,
  onChange,
  placeholder,
  /** Batasi hanya operator tertentu (mis. hanya KRL). */
  operators,
}: {
  label: string;
  stations: Station[];
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  operators?: Operator[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const pool = useMemo(
    () => (operators ? stations.filter((s) => s.operators.some((o) => operators.includes(o))) : stations),
    [stations, operators],
  );

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
    if (!q) return pool;
    return pool
      .map((s) => {
        const name = s.name.toLowerCase();
        const city = s.city.toLowerCase();
        const code = s.code.toLowerCase();
        let score = -1;
        if (code === q || name === q) score = 100;
        else if (name.startsWith(q) || city.startsWith(q)) score = 90;
        else if (code.startsWith(q)) score = 80;
        else if (name.includes(q) || city.includes(q)) score = 60;
        return { s, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.s);
  }, [query, pool]);

  // Kelompokkan hasil per operator (KRL lebih dulu).
  const groups = useMemo(() => {
    const map = new Map<Operator, Station[]>();
    for (const s of results) {
      const op = OP_ORDER.find((o) => s.operators.includes(o)) ?? s.operators[0];
      if (!map.has(op)) map.set(op, []);
      map.get(op)!.push(s);
    }
    return OP_ORDER.filter((o) => map.has(o)).map((o) => ({ operator: o, items: map.get(o)! }));
  }, [results]);

  function pick(code: string) {
    onChange(code);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={boxRef} className="relative">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3.5 py-3 text-left transition hover:border-brand/50"
      >
        {selected ? (
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-semibold">{selected.name}</span>
            <span className="shrink-0 font-mono text-xs text-muted">{selected.code}</span>
            <span className="flex shrink-0 gap-1">
              {(selected.lines ?? []).map((l) => (
                <span
                  key={l}
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: LINE_META[l]?.color ?? "#64748b" }}
                  title={LINE_META[l]?.name ?? l}
                />
              ))}
            </span>
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
            placeholder="Cari nama stasiun, kota, atau kode…"
            className="w-full border-b border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none placeholder:text-muted"
          />
          <div className="max-h-72 overflow-auto">
            {results.length === 0 && (
              <p className="px-3.5 py-3 text-sm text-muted">Stasiun tidak ditemukan.</p>
            )}
            {groups.map((g) => (
              <div key={g.operator}>
                <div className="sticky top-0 flex items-center gap-2 bg-surface/95 px-3.5 py-1.5 backdrop-blur">
                  <span
                    className="inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: `${OPERATOR_META[g.operator].color}22`,
                      color: OPERATOR_META[g.operator].color,
                    }}
                  >
                    {OPERATOR_META[g.operator].short}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-muted">
                    {OPERATOR_META[g.operator].label} · {g.items.length}
                  </span>
                </div>
                <ul>
                  {g.items.map((s) => (
                    <li key={s.code}>
                      <button
                        type="button"
                        onClick={() => pick(s.code)}
                        className={`flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm transition hover:bg-surface-2 ${
                          s.code === value ? "bg-brand/10" : ""
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate font-medium">{s.name}</span>
                          <span className="shrink-0 text-xs text-muted">{s.city}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          {(s.lines ?? []).map((l) => (
                            <span
                              key={l}
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: LINE_META[l]?.color ?? "#64748b" }}
                              title={LINE_META[l]?.name ?? l}
                            />
                          ))}
                          <span className="font-mono text-xs text-muted">{s.code}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
