"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

const LINKS = [
  { href: "/", label: "Beranda", icon: "🏠" },
  { href: "/jadwal", label: "Cari Jadwal", icon: "🔎" },
  { href: "/live", label: "Peta Live", icon: "🗺️" },
  { href: "/stasiun", label: "Papan Stasiun", icon: "🚉" },
  { href: "/favorit", label: "Favorit", icon: "⭐" },
];

export function Nav({ providerName, isMock }: { providerName: string; isMock: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Tutup menu dengan tombol Escape atau klik di luar.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDocClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div
        ref={menuRef}
        className="mx-auto flex w-full max-w-6xl items-center gap-x-6 px-4 py-3 sm:px-6"
      >
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-2 text-lg shadow-lg shadow-brand/20">
            🚆
          </span>
          <span className="text-lg font-bold tracking-tight">
            Rail<span className="text-brand">Live</span>
          </span>
        </Link>

        {/* Navigasi desktop */}
        <nav className="hidden gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                isActive(l.href)
                  ? "bg-brand/15 text-brand"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted md:flex">
            <span className={`pulse-dot ${isMock ? "bg-amber-400" : "bg-green-500"}`} />
            Sumber: {providerName}
          </span>
          <ThemeToggle />
        </div>

        {/* Tombol hamburger (mobile) */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          aria-controls="nav-mobile-menu"
          className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface text-foreground transition hover:border-brand/50 md:hidden"
        >
          <span className="relative block h-4 w-5" aria-hidden="true">
            <span
              className={`absolute left-0 block h-0.5 w-5 rounded bg-current transition-all duration-200 ${
                open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 block h-0.5 w-5 -translate-y-1/2 rounded bg-current transition-all duration-200 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 block h-0.5 w-5 rounded bg-current transition-all duration-200 ${
                open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
              }`}
            />
          </span>
        </button>
      </div>

      {/* Panel menu mobile (dropdown) */}
      <div
        id="nav-mobile-menu"
        className={`overflow-hidden border-t border-border/60 bg-background/95 backdrop-blur-lg transition-[max-height,opacity] duration-200 md:hidden ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive(l.href)
                  ? "bg-brand/15 text-brand"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              <span aria-hidden="true" className="text-base">
                {l.icon}
              </span>
              {l.label}
            </Link>
          ))}
          <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs text-muted">
            <span className={`pulse-dot ${isMock ? "bg-amber-400" : "bg-green-500"}`} />
            Sumber: {providerName}
          </div>
        </nav>
      </div>
    </header>
  );
}
