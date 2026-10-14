/** Utilitas waktu. Semua jam direpresentasikan sebagai menit sejak 00:00. */

/** "HH:mm" -> menit sejak tengah malam. */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** menit sejak tengah malam -> "HH:mm" (dibungkus 24 jam). */
export function toHHMM(minutes: number): string {
  const wrapped = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Tanggal lokal (YYYY-MM-DD) dari sebuah Date. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Menit "absolut" sebuah peristiwa relatif terhadap awal hari keberangkatan.
 * Menambahkan 1440 menit untuk setiap hari yang dilewati.
 */
export function absoluteMinutes(hhmm: string, dayOffset: number): number {
  return toMinutes(hhmm) + dayOffset * 1440;
}

/** Selisih menit antara jam sekarang dan sebuah waktu "HH:mm" pada hari yang sama. */
export function minutesUntil(hhmm: string, now: Date): number {
  const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  return toMinutes(hhmm) - nowMin;
}

/** Format durasi menit -> "2j 15m". */
export function formatDuration(min: number): string {
  const total = Math.max(0, Math.round(min));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return `${h}j ${m}m`;
}

/** Format angka menit delay menjadi label singkat. */
export function formatDelay(min: number): string {
  if (min <= 0) return "Tepat waktu";
  if (min < 60) return `+${min} mnt`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `+${h}j ${m}m`;
}
