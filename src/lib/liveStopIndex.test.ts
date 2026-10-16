import assert from "node:assert/strict";
// Node membutuhkan ekstensi saat menjalankan TypeScript langsung.
// @ts-expect-error — test dijalankan dengan node --experimental-strip-types.
import { currentStopIndex } from "./liveStopIndex.ts";

const stops = [
  { arriveMinute: null, departMinute: 17 * 60 + 54 },
  { arriveMinute: 18 * 60 + 3, departMinute: 18 * 60 + 3 },
  { arriveMinute: 18 * 60 + 5, departMinute: 18 * 60 + 6 },
  { arriveMinute: 18 * 60 + 8, departMinute: 18 * 60 + 8 },
];

assert.equal(currentStopIndex(stops, 18 * 60 + 4), 1, "di perjalanan dari Bojong Indah");
assert.equal(currentStopIndex(stops, 18 * 60 + 5), 2, "saat tiba harus menunjukkan Rawa Buaya");
assert.equal(currentStopIndex(stops, 18 * 60 + 6), 2, "saat berangkat tetap dari Rawa Buaya");

console.log("liveStopIndex test: OK");
