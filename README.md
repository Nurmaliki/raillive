# 🚆 RailLive — Jadwal Kereta Real-Time Indonesia

Aplikasi web untuk memantau **jadwal dan posisi real-time kereta Indonesia**:
KAI Antarkota, KRL Commuter Jabodetabek, MRT Jakarta, dan LRT Jabodebek.

Dibangun dengan **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4**, siap
deploy ke **Vercel**.

---

## ✨ Fitur

| Fitur | Deskripsi |
| --- | --- |
| 🔎 **Cari Jadwal** | Cari perjalanan antar stasiun: jam berangkat/tiba, durasi, jarak, dan harga mulai. Bisa difilter per operator. |
| 🗺️ **Peta Live** | Peta SVG berisi posisi setiap kereta, progres perjalanan, kecepatan, dan status delay. Diperbarui otomatis tiap 15 detik. |
| 🕒 **Papan Stasiun** | Papan keberangkatan digital per stasiun: jam aktual, peron, dan status (tepat waktu / terlambat / segera berangkat). |
| ⭐ **Favorit** | Simpan rute langganan; aplikasi memantau dan memberi **peringatan saat delay** melewati ambang yang Anda tentukan. |

---

## 🏃 Menjalankan di Komputer Lokal

> **Penting:** Next.js 16 memerlukan **Node.js ≥ 20.9**. Cek dengan `node -v`.

```bash
# 1. Masuk ke folder proyek
cd kereta-realtime

# 2. Pasang dependensi
npm install

# 3. (Opsional) salin konfigurasi environment
cp .env.example .env.local

# 4. Jalankan server pengembangan
npm run dev
```

Buka <http://localhost:3000>.

Perintah lain:

```bash
npm run build   # build produksi
npm run start   # jalankan hasil build
npm run lint    # periksa kode
```

---

## 🔌 Sumber Data (Mock vs RajaKAI)

Aplikasi ini memakai pola **adapter**, jadi sumber data bisa diganti tanpa
mengubah UI. Pilih lewat environment variable `DATA_PROVIDER`:

### Mode `mock` (default) — langsung jalan, tanpa API key

Data jadwal & delay **disimulasikan secara deterministik**: delay dihitung dari
hash `(id kereta + tanggal)`, sehingga stabil sepanjang hari tetapi berubah tiap
hari. Posisi kereta dihitung dari jam saat ini, jadi terasa hidup. Cocok untuk
demo, portofolio, atau pengembangan UI.

### Mode `rajakai` — pakai API RajaKAI

Set environment variable berikut (lokal di `.env.local`, di Vercel lewat
**Settings → Environment Variables**):

```env
DATA_PROVIDER=rajakai
RAJAKAI_BASE_URL=https://api.rajakai.com
RAJAKAI_API_KEY=isi_api_key_anda
RAJAKAI_AUTH_HEADER=X-API-Key
```

Lalu **sesuaikan path endpoint** di `src/lib/providers/rajakai.ts` (konstanta
`ENDPOINTS`) dengan dokumentasi resmi RajaKAI Anda, dan sesuaikan fungsi
pemetaan (`mapStation`, `mapDeparture`, `mapLive`) bila nama field berbeda.

> 🛡️ **API key aman.** Semua panggilan API terjadi di server (Route Handlers
> di `src/app/api/`). API key **tidak pernah** dikirim ke browser.
>
> ♻️ **Anti-blank.** Bila API RajaKAI gagal atau belum dikonfigurasi, provider
> otomatis jatuh ke data simulasi sehingga halaman tetap tampil.

---

## 📁 Struktur Proyek

```
src/
├── app/
│   ├── api/                  # Route Handlers (server) — API key aman di sini
│   │   ├── stations/         # GET daftar stasiun
│   │   ├── departures/       # GET papan keberangkatan per stasiun
│   │   ├── live/             # GET semua kereta live
│   │   ├── live/[id]/        # GET satu kereta live
│   │   ├── search/           # GET pencarian jadwal antar stasiun
│   │   └── alerts/           # GET peringatan/gangguan layanan
│   ├── jadwal/               # Halaman Cari Jadwal
│   ├── live/                 # Halaman Peta Live
│   ├── stasiun/              # Halaman Papan Stasiun
│   ├── favorit/              # Halaman Rute Favorit
│   ├── layout.tsx            # Layout + navigasi
│   └── page.tsx              # Beranda
├── components/               # Komponen UI (Nav, LiveMap, StationBoard, dll.)
└── lib/
    ├── types.ts              # Tipe data inti + metadata operator
    ├── time.ts               # Utilitas waktu
    ├── geo.ts                # Proyeksi koordinat → peta
    ├── engine.ts             # Mesin simulasi & perhitungan jadwal/delay
    ├── favorites.ts          # Penyimpanan favorit (localStorage)
    ├── useLivePolling.ts     # Hook polling real-time
    ├── data/
    │   ├── stations.ts       # Dataset 37 stasiun
    │   └── trains.ts         # Dataset 19 rute kereta
    └── providers/
        ├── types.ts          # Kontrak TrainDataProvider
        ├── mock.ts           # Provider simulasi
        ├── rajakai.ts        # Adapter RajaKAI
        └── index.ts          # Pemilih provider
```

---

## 🚀 Upload ke GitHub

Repo-nya belum ada — buat dulu di GitHub, lalu jalankan perintah berikut dari
dalam folder proyek.

### Opsi A — lewat website GitHub (paling mudah)

1. Buka <https://github.com/new>.
2. Isi **Repository name** (mis. `raillive`), pilih **Public** atau **Private**.
3. **Jangan** centang "Add a README / .gitignore / license" (biar tidak konflik).
4. Klik **Create repository**, lalu salin URL yang muncul.
5. Jalankan di terminal:

```bash
cd kereta-realtime
git remote add origin https://github.com/USERNAME/raillive.git
git push -u origin main
```

Ganti `USERNAME/raillive` dengan milik Anda.

### Opsi B — lewat GitHub CLI

```bash
cd kereta-realtime
gh repo create raillive --public --source=. --remote=origin --push
```

---

## ▲ Deploy ke Vercel

### Cara 1 — Vercel Dashboard (disarankan)

1. Buka <https://vercel.com/new> dan login.
2. Klik **Import Git Repository**, pilih repo `raillive` yang baru dibuat.
3. Vercel otomatis mendeteksi Next.js — **biarkan semua pengaturan default**
   (Framework: Next.js, Build Command: `next build`).
4. Buka bagian **Environment Variables** dan tambahkan (hanya jika memakai
   RajaKAI; kalau demo, cukup lewati atau set `DATA_PROVIDER=mock`):

   | Name | Value |
   | --- | --- |
   | `DATA_PROVIDER` | `rajakai` |
   | `RAJAKAI_BASE_URL` | `https://api.rajakai.com` |
   | `RAJAKAI_API_KEY` | *(API key Anda)* |
   | `RAJAKAI_AUTH_HEADER` | `X-API-Key` |

5. Klik **Deploy**. Selesai — Anda dapat URL seperti
   `https://raillive-xxx.vercel.app`.

Setiap kali Anda `git push` ke branch `main`, Vercel otomatis men-deploy ulang.

### Cara 2 — Vercel CLI

```bash
npm i -g vercel     # pasang sekali
cd kereta-realtime
vercel              # deploy preview (login saat diminta)
vercel --prod       # deploy ke produksi
```

---

## 🛠️ Teknologi

- **Next.js 16** — App Router, Route Handlers, Turbopack
- **React 19** + **TypeScript**
- **Tailwind CSS v4**
- Peta digambar dengan **SVG native** (tanpa dependensi peta eksternal, tanpa API key)

---

## 📝 Catatan Teknis

- **`cacheComponents` sengaja tidak diaktifkan** di `next.config.ts`. Aplikasi ini
  menyajikan data real-time sehingga semua halaman dirender saat request
  (`dynamic = "force-dynamic"`), yang tidak kompatibel dengan model Cache
  Components.
- **Tanpa database.** Favorit disimpan di `localStorage` browser. Untuk
  multi-perangkat, tambahkan database (mis. Vercel Postgres) dan ganti
  `src/lib/favorites.ts`.
- **Peta tanpa API key.** Peta memakai proyeksi equirectangular sederhana ke
  SVG (`src/lib/geo.ts`), sehingga tidak perlu token Mapbox/Google Maps.
- **Zona waktu WIB eksplisit.** Semua perhitungan jadwal memakai WIB (UTC+7)
  melalui `src/lib/time.ts`, bukan jam lokal mesin. Ini penting karena Vercel
  menjalankan server pada **UTC** — tanpa ini jadwal akan melenceng 7 jam.
- **Kereta lintas tengah malam.** KA malam (mis. Bima, Gajayana) tetap terpantau
  setelah lewat tengah malam karena mesin memeriksa instance keberangkatan
  kemarin juga.

---

## ⚠️ Disclaimer

Data pada mode default adalah **simulasi** dan bukan jadwal resmi. Untuk
informasi resmi, selalu rujuk ke kanal PT KAI / KAI Commuter / MRT / LRT.
