import type { Train } from "@/lib/types";

/** Jam terminal yang ditampilkan pada kartu daftar kereta. */
export function terminalSchedule(train: Train | null): {
  departure: string;
  arrival: string;
} {
  const first = train?.stops[0];
  const last = train?.stops.at(-1);
  return {
    departure: first?.depart ?? first?.arrive ?? "—",
    arrival: last?.arrive ?? last?.depart ?? "—",
  };
}
