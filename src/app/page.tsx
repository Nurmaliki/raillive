import Link from "next/link";
import { TRAINS } from "@/lib/data/trains";
import { STATIONS } from "@/lib/data/stations";
import { KRL_LINE_ORDER, LINE_META, OPERATOR_META, type Operator } from "@/lib/types";

const FEATURES = [
  {
    href: "/stasiun",
    icon: "🕒",
    title: "Papan Stasiun",
    desc: "Papan keberangkatan real-time per stasiun KRL, lengkap dengan lin, peron, dan status delay.",
  },
  {
    href: "/jadwal",
    icon: "🔎",
    title: "Cari Jadwal",
    desc: "Cari perjalanan KRL antar stasiun, lengkap dengan durasi, jarak, dan jam berangkat.",
  },
  {
    href: "/live",
    icon: "🗺️",
    title: "Peta Live",
    desc: "Lihat posisi setiap KRL di peta, progres perjalanan, dan status keterlambatan.",
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

  const krlStations = STATIONS.filter((s) => (s.lines?.length ?? 0) > 0);
  const krlTrips = TRAINS.filter((t) => t.operator === "KRL").length;

  return (
    <div className="space-y-12">
      <section className="fade-up pt-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs text-muted">
          <span className="pulse-dot" /> Real-time · KRL Commuter Jabodetabek · MRT · LRT · KAI
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          Jadwal &amp; posisi{" "}
          <span className="bg-gradient-to-r from-brand to-brand-2 bg-clip-text text-transparent">
            KRL Jabodetabek
          </span>{" "}
          dalam satu layar
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted">
          Pantau keberangkatan, keterlambatan, dan posisi kereta secara real-time —
          fokus KRL Commuter Line (5 lin), plus MRT Jakarta dan LRT Jabodebek.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/stasiun"
            className="rounded-xl bg-gradient-to-r from-brand to-brand-2 px-6 py-3 font-semibold text-on-brand shadow-lg shadow-brand/20 transition hover:opacity-90"
          >
            Buka Papan Stasiun
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
        <Stat value={String(krlStations.length)} label="Stasiun KRL/MRT/LRT" />
        <Stat value={String(krlTrips)} label="Perjalanan KRL" />
        <Stat value="5" label="Lin KRL" />
        <Stat value="15s" label="Interval update" />
      </section>

      <section>
        <h2 className="mb-1 text-xl font-bold">Lin KRL Commuter Jabodetabek</h2>
        <p className="mb-4 text-sm text-muted">
          Lima lin resmi. Klik salah satu untuk melihat papan keberangkatannya.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {KRL_LINE_ORDER.map((id) => {
            const meta = LINE_META[id];
            const trains = TRAINS.filter((t) => t.line === id);
            const stops = new Set(trains.flatMap((t) => t.stops.map((s) => s.stationCode)));
            const termini = stops.size
              ? [Array.from(stops)[0], Array.from(stops).at(-1)]
              : [];
            return (
              <Link
                key={id}
                href="/stasiun"
                className="card group p-4 transition hover:border-brand/50 hover:bg-surface-2/50"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="font-semibold group-hover:text-brand">{meta.name}</span>
                </div>
                <p className="mt-2 text-sm text-muted">
                  {stops.size} stasiun · {trains.length} perjalanan
                </p>
                {termini.length === 2 && (
                  <p className="mt-1 text-xs text-muted">
                    {STATIONS.find((s) => s.code === termini[0])?.name} ↔{" "}
                    {STATIONS.find((s) => s.code === termini[1])?.name}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
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
                <p className="text-sm text-muted">{counts[op] ?? 0} perjalanan terdaftar</p>
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
