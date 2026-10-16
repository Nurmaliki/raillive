import assert from "node:assert/strict";
// Node membutuhkan ekstensi saat menjalankan TypeScript langsung; TypeScript proyek
// sengaja tidak mengaktifkan allowImportingTsExtensions.
// @ts-expect-error — test dijalankan dengan node --experimental-strip-types.
import { terminalSchedule, trainIconSvg } from "./liveMapList.ts";
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

const iconKinds = (["KAI", "KRL", "MRT", "LRT"] as const).map((operator) =>
  trainIconSvg(operator, "#123456"),
);
assert.equal(new Set(iconKinds).size, 4, "setiap jenis kereta harus punya ikon berbeda");
for (const svg of iconKinds) {
  assert.match(svg, /<svg/);
  assert.match(svg, /#123456/);
}

console.log("liveMapList test: OK");
