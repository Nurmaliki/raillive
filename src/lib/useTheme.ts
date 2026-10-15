"use client";

import { useSyncExternalStore } from "react";

export type Theme = "dark" | "light";
export const THEME_STORAGE_KEY = "raillive-theme";

/**
 * Tema disimpan sebagai atribut `data-theme` di <html> (dipasang lebih awal
 * oleh skrip anti-kedip di layout). React membacanya lewat store eksternal
 * (useSyncExternalStore) sehingga tidak perlu setState di dalam effect.
 */
function subscribe(callback: () => void) {
  const obs = new MutationObserver(callback);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

/** Tema saat render server / sebelum hidrasi: selalu "dark" (nilai default). */
function getServerSnapshot(): Theme {
  return "dark";
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Terapkan tema ke <html> dan simpan pilihan. */
export function setTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* localStorage bisa diblokir; abaikan. */
  }
}
