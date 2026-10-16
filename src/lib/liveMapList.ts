import type { Operator, Train } from "@/lib/types";

/** SVG marker berbeda per jenis kereta; warna mengikuti warna jalur. */
export function trainIconSvg(operator: Operator, color: string): string {
  const shapes: Record<Operator, string> = {
    KAI: '<path d="M4 15V9c0-3 2-5 5-5h7c3 0 5 2 5 5v6h3v4h-3l-2 3h-3l1-3H8l1 3H6l-2-3H2v-4h2Zm3-6v4h11V9H7Z"/>',
    KRL: '<path d="M5 6c0-2 2-4 4-4h8c2 0 4 2 4 4v13l-3 3-2-2H10l-2 2-3-3V6Zm3 1v6h10V7H8Zm1 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/>',
    MRT: '<path d="M3 8c0-4 3-6 7-6h6c4 0 7 2 7 6v10l-4 4-2-2H9l-2 2-4-4V8Zm4-1v7h12V7H7Zm2 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/>',
    LRT: '<path d="M6 5c0-2 2-3 4-3h6c2 0 4 1 4 3v14l-3 3-2-3h-4l-2 3-3-3V5Zm3 1v8h8V6H9Zm1 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/>',
  };
  return `<svg data-train-kind="${operator}" viewBox="0 0 26 24" xmlns="http://www.w3.org/2000/svg" fill="${color}" aria-hidden="true">${shapes[operator]}</svg>`;
}

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
