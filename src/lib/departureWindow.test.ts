import assert from "node:assert/strict";
// Node membutuhkan ekstensi saat menjalankan TypeScript langsung; TypeScript proyek
// sengaja tidak mengaktifkan allowImportingTsExtensions.
// @ts-expect-error — test dijalankan dengan node --experimental-strip-types.
import { isUpcomingDeparture } from "./departureWindow.ts";

assert.equal(isUpcomingDeparture(12 * 60 + 45, 12 * 60 + 46, 60), false);
assert.equal(isUpcomingDeparture(12 * 60 + 46, 12 * 60 + 46, 60), true);
assert.equal(isUpcomingDeparture(13 * 60 + 46, 12 * 60 + 46, 60), true);
assert.equal(isUpcomingDeparture(13 * 60 + 47, 12 * 60 + 46, 60), false);

console.log("departureWindow test: OK");
