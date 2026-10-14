"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { OPERATOR_META, type LiveStatus, type Operator, type Station } from "@/lib/types";

/** Satu lin rute (digabung per lin, bukan per kereta) untuk digambar di peta. */
export interface RouteLine {
  key: string;
  operator: Operator;
  line?: string;
  color: string;
  /** Daftar [lat, lng] berurutan dari stasiun asal ke tujuan. */
  path: [number, number][];
}

type LeafletNS = typeof import("leaflet");
type LMap = import("leaflet").Map;
type LCircle = import("leaflet").CircleMarker;
type LPoly = import("leaflet").Polyline;
type LMarker = import("leaflet").Marker;

/** Warna sebuah kereta: warna lin bila ada, jika tidak warna operator. */
function trainColor(t: LiveStatus): string {
  return t.line ? LINE_COLOR[t.line] ?? OPERATOR_META[t.operator].color : OPERATOR_META[t.operator].color;
}

/** Warna lin dipakai di sini agar komponen mandiri (tanpa impor sirkular). */
const LINE_COLOR: Record<string, string> = {
  bogor: "#ec2329",
  cikarang: "#26baed",
  tangerang: "#c25f28",
  rangkasbitung: "#99ca3e",
  priok: "#ef509a",
  mrt: "#0ea5e9",
  "lrt-bekasi": "#8b5cf6",
  "lrt-cibubur": "#a855f7",
};

/**
 * Peta sungguhan (OpenStreetMap via Leaflet) dengan:
 *  - garis rute per lin (bergaya "rel": casing gelap + garis warna)
 *  - penanda posisi tiap kereta yang diperbarui real-time
 *  - penanda stasiun
 *
 * Komponen ini hanya dijalankan di klien (diimpor dengan `ssr: false`),
 * karena Leaflet butuh `window`/DOM.
 */
export function LiveMapCanvas({
  stations,
  routes,
  focusKeys,
  trains,
  selected,
  hovered,
  activeLine,
  lineFilter,
  onSelect,
  onHover,
}: {
  stations: Station[];
  routes: RouteLine[];
  /** Kunci rute yang sedang terlihat (untuk menentukan area fokus peta). */
  focusKeys: string[];
  trains: LiveStatus[];
  selected: string | null;
  hovered: string | null;
  activeLine?: string | null;
  lineFilter?: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const LRef = useRef<LeafletNS | null>(null);
  const mapRef = useRef<LMap | null>(null);
  const routeLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const stationLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const trainLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const trainMarkers = useRef(new Map<string, LCircle>());
  const routeLines = useRef(new Map<string, { casing: LPoly; main: LPoly }>());
  const highlightRef = useRef<LMarker | null>(null);
  const [ready, setReady] = useState(false);

  /* ---------- 1. Inisialisasi peta (sekali) ---------- */
  useEffect(() => {
    let cancelled = false;
    const markers = trainMarkers.current;
    const lines = routeLines.current;
    (async () => {
      const mod = await import("leaflet");
      const L = (mod.default ?? mod) as LeafletNS;
      if (cancelled || !containerRef.current) return;
      LRef.current = L;

      const map = L.map(containerRef.current, {
        center: [-6.25, 106.85],
        zoom: 10,
        minZoom: 8,
        maxZoom: 18,
        zoomControl: true,
        preferCanvas: true,
        attributionControl: true,
      });

      // Basemap gelap gratis (Esri Dark Gray Canvas) — tanpa API key.
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 16,
          attribution:
            'Peta &copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        },
      ).addTo(map);
      // Lapisan label (nama tempat & jalan) di atas basemap — dinaikkan kontrasnya.
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 16, attribution: "", className: "rl-labels" },
      ).addTo(map);

      routeLayerRef.current = L.layerGroup().addTo(map);
      stationLayerRef.current = L.layerGroup().addTo(map);
      trainLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      // Peta di dalam grid butuh invalidateSize setelah layout selesai.
      setTimeout(() => map.invalidateSize(), 120);
      setReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      LRef.current = null;
      markers.clear();
      lines.clear();
      setReady(false);
    };
  }, []);

  /* ---------- 2. Stasiun ---------- */
  useEffect(() => {
    const L = LRef.current;
    const layer = stationLayerRef.current;
    if (!ready || !L || !layer) return;
    layer.clearLayers();
    for (const s of stations) {
      L.circleMarker([s.lat, s.lng], {
        radius: 3,
        color: "#5b7099",
        weight: 1,
        fillColor: "#0e1626",
        fillOpacity: 1,
      })
        .bindTooltip(`${s.name} (${s.code})`, { direction: "top", className: "rl-tip" })
        .addTo(layer);
    }
  }, [ready, stations]);

  /* ---------- 3. Garis rute (satu per lin) ---------- */
  useEffect(() => {
    const L = LRef.current;
    const layer = routeLayerRef.current;
    const map = mapRef.current;
    if (!ready || !L || !layer || !map) return;

    // Hapus rute lama, gambar ulang (jumlahnya sedikit: ~8 lin + KA antarkota).
    for (const { casing, main } of routeLines.current.values()) {
      layer.removeLayer(casing);
      layer.removeLayer(main);
    }
    routeLines.current.clear();

    for (const r of routes) {
      if (r.path.length < 2) continue;
      const casing = L.polyline(r.path, {
        color: "#05080f",
        weight: 7,
        opacity: 0.55,
        lineCap: "round",
        lineJoin: "round",
        interactive: false,
      });
      const main = L.polyline(r.path, {
        color: r.color,
        weight: 3.4,
        opacity: 0.6,
        lineCap: "round",
        lineJoin: "round",
      });
      casing.addTo(layer);
      main.addTo(layer);
      routeLines.current.set(r.key, { casing, main });
    }

    // Sesuaikan tampilan peta ke rute yang sedang terlihat (bukan seluruh Jawa).
    if (focusKeys.length > 0) {
      const wanted = new Set(focusKeys);
      const pts = routes.filter((r) => wanted.has(r.key)).flatMap((r) => r.path);
      if (pts.length > 1) {
        map.fitBounds(pts as [number, number][], { padding: [28, 28] });
      }
    }
  }, [ready, routes, focusKeys]);

  /* ---------- 4. Sorotan rute aktif / filter lin ---------- */
  useEffect(() => {
    for (const [key, { casing, main }] of routeLines.current) {
      const dim = lineFilter ? key !== lineFilter : false;
      const isActive = activeLine ? key === activeLine : false;
      const isHoverLine = hovered ? hovered === key : false;
      const hot = isActive || isHoverLine;
      main.setStyle({
        weight: hot ? 4.6 : 3.4,
        opacity: dim ? 0.05 : hot ? 1 : 0.55,
      });
      casing.setStyle({ opacity: dim ? 0.05 : hot ? 0.8 : 0.5 });
    }
  }, [activeLine, hovered, lineFilter, ready, routes]);

  /* ---------- 5. Penanda kereta (sinkron inkremental) ---------- */
  useEffect(() => {
    const L = LRef.current;
    const layer = trainLayerRef.current;
    if (!ready || !L || !layer) return;

    const seen = new Set<string>();
    for (const t of trains) {
      seen.add(t.trainId);
      const color = trainColor(t);
      const latlng: [number, number] = [t.position.lat, t.position.lng];
      const isHot = selected === t.trainId || hovered === t.trainId;
      let m = trainMarkers.current.get(t.trainId);
      if (!m) {
        m = L.circleMarker(latlng, {
          radius: 5,
          color: "#05080f",
          weight: 1.5,
          fillColor: color,
          fillOpacity: 1,
        });
        m.on("click", () => onSelect(t.trainId));
        m.on("mouseover", () => onHover(t.trainId));
        m.on("mouseout", () => onHover(null));
        m.addTo(layer);
        trainMarkers.current.set(t.trainId, m);
      } else {
        m.setLatLng(latlng);
        m.setStyle({ fillColor: color });
      }
      m.setRadius(isHot ? 8 : 5);
      m.bindTooltip(
        `<b>${t.trainName}</b><br/>${t.lastStationName} → ${t.nextStationName ?? "stasiun akhir"}` +
          (t.delayMin > 0 ? `<br/>Terlambat +${t.delayMin} menit` : ""),
        { direction: "top", className: "rl-tip", opacity: 1 },
      );
    }

    // Buang penanda kereta yang tidak lagi ada di daftar terfilter.
    for (const [id, m] of trainMarkers.current) {
      if (!seen.has(id)) {
        layer.removeLayer(m);
        trainMarkers.current.delete(id);
      }
    }
  }, [ready, trains, selected, hovered, onSelect, onHover]);

  /* ---------- 6. Sorotan + fokus kereta terpilih ---------- */
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    const layer = trainLayerRef.current;
    if (!ready || !L || !map || !layer) return;

    if (highlightRef.current) {
      map.removeLayer(highlightRef.current);
      highlightRef.current = null;
    }
    if (!selected) return;
    const t = trains.find((x) => x.trainId === selected);
    if (!t) return;

    const color = trainColor(t);
    const icon = L.divIcon({
      className: "rl-sel-wrap",
      html: `<span class="rl-sel" style="--c:${color}"></span>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
    const marker = L.marker([t.position.lat, t.position.lng], {
      icon,
      interactive: false,
      zIndexOffset: 1000,
    })
      .bindTooltip(`<b>${t.trainName}</b> · KA ${t.trainNumber}`, {
        permanent: true,
        direction: "right",
        className: "rl-tip rl-tip-strong",
        offset: [10, 0],
      })
      .addTo(map);
    highlightRef.current = marker;
    map.panTo([t.position.lat, t.position.lng], { animate: true, duration: 0.6 });
  }, [ready, selected, trains]);

  /* ---------- 7. Ukuran ulang saat jendela berubah ---------- */
  useEffect(() => {
    if (!ready) return;
    const onResize = () => mapRef.current?.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [ready]);

  return (
    <div
      ref={containerRef}
      className="h-[420px] w-full bg-[#0a0f1a] sm:h-[520px] lg:h-[600px]"
      role="application"
      aria-label="Peta posisi kereta real-time"
    />
  );
}
