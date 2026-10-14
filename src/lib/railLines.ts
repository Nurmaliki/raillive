import { RAIL_SHAPES } from "@/lib/data/railShapes";
import {
  buildRailPath,
  nearestPointOnPath,
  type LatLng,
  type RailPath,
} from "@/lib/railGeometry";

/**
 * Jalur rel SUNGGUHAN (OpenStreetMap) per lin komuter, siap dipakai peta.
 *
 * Dipakai untuk dua hal:
 *  1. menggambar garis rute agar mengikuti rel asli (bukan garis lurus), dan
 *  2. menempelkan posisi kereta ke rel terdekat supaya penanda tidak
 *     "melayang" di luar jalur.
 */
export const LINE_RAILS: Record<string, RailPath> = Object.fromEntries(
  Object.entries(RAIL_SHAPES).map(([line, pts]) => [line, buildRailPath(pts)]),
);

/** Jalur rel sebuah lin (atau undefined bila belum tersedia). */
export function lineRail(line?: string | null): RailPath | undefined {
  return line ? LINE_RAILS[line] : undefined;
}

/**
 * Jalur rute untuk sebuah lin: pakai geometri rel SUNGGUHAN bila ada,
 * jika tidak jatuh ke garis lurus antar koordinat stasiun (fallback).
 */
export function routePathForLine(
  line: string | undefined,
  stationCoords: LatLng[],
): LatLng[] {
  const rail = lineRail(line);
  if (rail && rail.points.length >= 2) return rail.points;
  return stationCoords;
}

/**
 * Tempelkan sebuah koordinat ke rel lin terdekat.
 * Bila lin tidak punya geometri rel, koordinat asli dikembalikan.
 */
export function snapToLine(
  line: string | null | undefined,
  lat: number,
  lng: number,
): LatLng {
  const rail = lineRail(line);
  if (!rail) return [lat, lng];
  return nearestPointOnPath(rail, lat, lng);
}
