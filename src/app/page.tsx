import Link from "next/link";
import { TRAINS } from "@/lib/data/trains";
import { STATIONS } from "@/lib/data/stations";
import { OPERATOR_META, type Operator } from "@/lib/types";

const FEATURES = [
  {
    href: "/jadwal",
    icon: "🔎",
    title: "Cari Jadwal",
    desc: "Cari perjalanan antar stasiun, lengkap dengan durasi, jarak, dan harga mulai.",
  },
  {
    href: "/live",
    icon: "🗺️",
    title: "Peta Live",
    desc: "Lihat posisi setiap kereta di peta, progres perjalanan, dan status delay.",
  },
  {
    href: "/stasiun",
    icon: "🕒",
    title: "Papan Stasiun",
    desc: "Papan keberangkatan real-time per stasiun, termasuk peron dan status.",
  },
  {
    href: "/favorit",
    icon: "⭐",
    title: "Favorit",
    desc: "Simpan rute langganan dan dapatkan peringatan saat terjadi delay.",
  },
];

export default function Home() {
  const counts = TRAINS.reduce<Record<string, number>>((acc, t) => {
    acc[t.operator] = (acc[t.operator] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-12">
      <section className="fade-up pt-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs text-muted">
          <span className="pulse-dot" /> Data real-time · KAI · KRL · MRT · LRT
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          Jadwal &amp; posisi kereta Indonesia,{" "}
          <span className="bg-gradient-to-r from-brand to-brand-2 bg-clip-text text-transparent">
            dalam satu layar
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted">
          Pantau keberangkatan, keterlambatan, dan posisi kereta secara real-time —
          dari Argo Bromo Anggrek sampai MRT Jakarta.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/jadwal"
            className="rounded-xl bg-gradient-to-r from-brand to-brand-2 px-6 py-3 font-semibold text-slate-950 shadow-lg shadow-brand/20 transition hover:opacity-90"
          >
            Cari Jadwal Kereta
          </Link>
          <Link
            href="/live"
            className="rounded-xl border border-border bg-surface px-6 py-3 font-semibold transition hover:border-brand/50"
          >
            Lihat Peta Live
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={String(STATIONS.length)} label="Stasiun" />
        <Stat value={String(TRAINS.length)} label="Rute kereta" />
        <Stat value="4" label="Operator" />
        <Stat value="15s" label="Interval update" />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Fitur</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="card group p-5 transition hover:border-brand/50 hover:bg-surface-2/50"
            >
              <div className="mb-2 text-2xl">{f.icon}</div>
              <h3 className="font-semibold group-hover:text-brand">{f.title}</h3>
              <p className="mt-1 text-sm text-muted">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Operator yang didukung</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(OPERATOR_META) as Operator[]).map((op) => {
            const meta = OPERATOR_META[op];
            return (
              <div key={op} className="card p-5">
                <span
                  className="inline-flex rounded-lg px-2.5 py-1 text-xs font-bold"
                  style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
                >
                  {meta.short}
                </span>
                <p className="mt-3 font-semibold">{meta.label}</p>
                <p className="text-sm text-muted">{counts[op] ?? 0} rute terdaftar</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="card px-4 py-5 text-center">
      <div className="tabular text-2xl font-black text-brand">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}
