import assert from "node:assert/strict";
// Node membutuhkan ekstensi saat menjalankan TypeScript langsung; TypeScript proyek
// sengaja tidak mengaktifkan allowImportingTsExtensions.
// @ts-expect-error — test dijalankan dengan node --experimental-strip-types.
import { nearestStationCode } from "./nearestStation.ts";
import type { Station } from "./types";

const stations: Station[] = [
  { code: "MRI", name: "Manggarai", city: "Jakarta", operators: ["KRL"], lat: -6.21053, lng: 106.85024 },
  { code: "BOG", name: "Bogor", city: "Bogor", operators: ["KRL"], lat: -6.59428, lng: 106.79072 },
];

assert.equal(nearestStationCode(stations, -6.595, 106.791), "BOG");
assert.equal(nearestStationCode(stations, -6.211, 106.85), "MRI");
assert.equal(nearestStationCode([], -6.2, 106.8), null);

console.log("nearestStation test: OK");
