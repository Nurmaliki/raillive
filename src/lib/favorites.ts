"use client";

import type { FavoriteRoute } from "@/lib/types";

const KEY = "raillive.favorites.v1";

export function loadFavorites(): FavoriteRoute[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FavoriteRoute[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
