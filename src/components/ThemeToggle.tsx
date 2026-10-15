"use client";

import { setTheme, useTheme } from "@/lib/useTheme";

/**
 * Tombol ganti tema gelap/terang.
 * Tema awal dipasang oleh skrip anti-kedip di <head> (layout) sehingga tidak
 * berkelip; komponen ini membaca tema aktif dari <html> dan mengubahnya.
 */
export function ThemeToggle() {
  const theme = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={theme === "dark" ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
      title={theme === "dark" ? "Tema terang" : "Tema gelap"}
      className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface text-foreground transition hover:border-brand/50"
    >
      <span aria-hidden="true" className="text-base leading-none">
        {theme === "dark" ? "☀️" : "🌙"}
      </span>
    </button>
  );
}
