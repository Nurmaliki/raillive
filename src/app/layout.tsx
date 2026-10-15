import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { providerInfo } from "@/lib/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RailLive — Jadwal Kereta Real-Time Indonesia",
  description:
    "Pantau jadwal dan posisi real-time kereta Indonesia: KAI Antarkota, KRL Commuter, MRT Jakarta, dan LRT Jabodebek.",
};

/**
 * Skrip kecil yang dijalankan SEBELUM halaman digambar: memasang atribut
 * data-theme sesuai pilihan tersimpan (atau preferensi sistem) sehingga tema
 * terang tidak berkelip gelap saat pertama dimuat.
 */
const THEME_INIT = `(function(){try{var k='raillive-theme';var s=localStorage.getItem(k);var m=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';var t=(s==='light'||s==='dark')?s:m;document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  const provider = providerInfo();
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Nav providerName={provider.name} isMock={provider.isMock} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-6 sm:px-6">
          {children}
        </main>
        <footer className="border-t border-border/60 py-6 text-center text-xs text-muted">
          RailLive · sumber data {provider.isMock ? "simulasi" : provider.name} · dibuat
          dengan Next.js, siap deploy ke Vercel
        </footer>
      </body>
    </html>
  );
}
