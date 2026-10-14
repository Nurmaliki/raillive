"use client";

import { useSyncExternalStore } from "react";
import type { FavoriteRoute } from "@/lib/types";

const KEY = "raillive.favorites.v1";

/** Daftar kosong yang stabil secara referensi (untuk snapshot server). */
const EMPTY: FavoriteRoute[] = [];

function parse(raw: string | null): FavoriteRoute[] {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw) as FavoriteRoute[];
    return Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function loadFavorites(): FavoriteRoute[] {
  if (typeof window === "undefined") return EMPTY;
  return parse(window.localStorage.getItem(KEY));
}

export function saveFavorites(list: FavoriteRoute[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  // Beri tahu komponen lain di tab yang sama.
  window.dispatchEvent(new Event("raillive:favorites"));
}

export function addFavorite(origin: string, destination: string, notifyDelayOver = 10): FavoriteRoute {
  const list = loadFavorites();
  const existing = list.find((f) => f.origin === origin && f.destination === destination);
  if (existing) return existing;
  const fav: FavoriteRoute = {
    id: `${origin}-${destination}`,
    origin,
    destination,
    createdAt: new Date().toISOString(),
    notifyDelayOver,
  };
  saveFavorites([...list, fav]);
  return fav;
}

export function removeFavorite(id: string): void {
  saveFavorites(loadFavorites().filter((f) => f.id !== id));
}

export function updateFavorite(id: string, patch: Partial<FavoriteRoute>): void {
  saveFavorites(loadFavorites().map((f) => (f.id === id ? { ...f, ...patch } : f)));
}

export function isFavorite(origin: string, destination: string): boolean {
  return loadFavorites().some((f) => f.origin === origin && f.destination === destination);
}

/**
 * Berlangganan perubahan favorit (localStorage tab lain + event internal).
 * Dipakai bersama `useSyncExternalStore`.
 */
export function subscribeFavorites(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("raillive:favorites", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("raillive:favorites", callback);
    window.removeEventListener("storage", callback);
  };
}

/**
 * Snapshot favorit yang stabil secara referensi: `useSyncExternalStore`
 * memanggil fungsi ini tiap render, jadi hasilnya di-cache per isi mentah
 * agar tidak memicu render tanpa henti.
 */
let snapshotCache: { raw: string | null; list: FavoriteRoute[] } = {
  raw: null,
  list: EMPTY,
};

export function getFavoritesSnapshot(): FavoriteRoute[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem(KEY);
  if (raw !== snapshotCache.raw) {
    snapshotCache = { raw, list: parse(raw) };
  }
  return snapshotCache.list;
}

/** Snapshot untuk render di server (tidak ada localStorage). */
export function getFavoritesServerSnapshot(): FavoriteRoute[] {
  return EMPTY;
}

/** Hook React untuk membaca favorit secara reaktif (aman hidrasi). */
export function useFavorites(): FavoriteRoute[] {
  return useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    getFavoritesServerSnapshot,
  );
}
