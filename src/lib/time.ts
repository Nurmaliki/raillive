/**
 * Utilitas waktu.
 *
 * PENTING — seluruh jadwal kereta Indonesia memakai WIB (UTC+7). Server
 * produksi (mis. Vercel) berjalan pada UTC, sehingga perhitungan TIDAK BOLEH
 * memakai `Date.getHours()` yang bergantung zona waktu mesin. Semua fungsi di
 * file ini mengonversi waktu ke WIB secara eksplisit agar hasilnya identik di
 * laptop (WIB) maupun di server (UTC).
 */

/** Offset WIB terhadap UTC, dalam menit. */
export const JAKARTA_OFFSET_MIN = 7 * 60;

/**
 * Menit sejak tengah malam menurut WIB, untuk sebuah Date apa pun.
 * Tidak bergantung pada zona waktu mesin yang menjalankannya.
 */
export function jakartaMinutes(date: Date): number {
  const shifted = new Date(date.getTime() + JAKARTA_OFFSET_MIN * 60_000);
  return (
    shifted.getUTCHours() * 60 +
    shifted.getUTCMinutes() +
    shifted.getUTCSeconds() / 60
  );
}

/** Tanggal menurut WIB (YYYY-MM-DD) dari sebuah Date. */
export function toDateKey(date: Date): string {
  const shifted = new Date(date.getTime() + JAKARTA_OFFSET_MIN * 60_000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Geser sebuah dateKey "YYYY-MM-DD" sebanyak `days` hari (boleh negatif). */
export function shiftDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

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

/**
 * Menit "absolut" sebuah peristiwa relatif terhadap awal hari keberangkatan.
 * Menambahkan 1440 menit untuk setiap hari yang dilewati.
 */
export function absoluteMinutes(hhmm: string, dayOffset: number): number {
  return toMinutes(hhmm) + dayOffset * 1440;
}

/** Selisih menit antara jam WIB sekarang dan sebuah waktu "HH:mm" hari ini. */
export function minutesUntil(hhmm: string, now: Date): number {
  return toMinutes(hhmm) - jakartaMinutes(now);
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
