import assert from "node:assert/strict";
// Node membutuhkan ekstensi saat menjalankan TypeScript langsung; TypeScript proyek
// sengaja tidak mengaktifkan allowImportingTsExtensions.
// @ts-expect-error — test dijalankan dengan node --experimental-strip-types.
import { terminalSchedule } from "./liveMapList.ts";
import type { Train } from "./types";

const train: Train = {
  id: "krl-test",
  number: "1",
  name: "Kereta uji",
  operator: "KRL",
  serviceClass: "Commuter",
  line: "bogor",
  stops: [
    { stationCode: "BOG", arrive: null, depart: "05:10", dayOffset: 0 },
    { stationCode: "JAKK", arrive: "06:35", depart: null, dayOffset: 0 },
  ],
};

assert.deepEqual(terminalSchedule(train), {
  departure: "05:10",
  arrival: "06:35",
});
assert.deepEqual(terminalSchedule(null), {
  departure: "—",
  arrival: "—",
});

console.log("liveMapList test: OK");
