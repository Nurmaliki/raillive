import { FavoritesClient } from "@/components/FavoritesClient";

export const metadata = { title: "Favorit — RailLive" };

export default function FavoritPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Rute Favorit</h1>
        <p className="mt-1 text-sm text-muted">
          Rute tersimpan akan dipantau otomatis; Anda akan diberi peringatan saat terjadi delay.
        </p>
      </header>
      <FavoritesClient />
    </div>
  );
}
