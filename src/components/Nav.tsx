"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/jadwal", label: "Cari Jadwal" },
  { href: "/live", label: "Peta Live" },
  { href: "/stasiun", label: "Papan Stasiun" },
  { href: "/favorit", label: "Favorit" },
];

export function Nav({ providerName, isMock }: { providerName: string; isMock: boolean }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-2 text-lg shadow-lg shadow-brand/20">
            🚆
          </span>
          <span className="text-lg font-bold tracking-tight">
            Rail<span className="text-brand">Live</span>
          </span>
        </Link>

        <nav className="order-3 flex w-full flex-wrap gap-1 sm:order-none sm:w-auto">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-brand/15 text-brand"
                    : "text-muted hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <span className="ml-auto hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted sm:flex">
          <span className={`pulse-dot ${isMock ? "bg-amber-400" : "bg-green-500"}`} />
          Sumber: {providerName}
        </span>
      </div>
    </header>
  );
}
