"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { OPERATOR_META, type LiveStatus, type Operator, type Station } from "@/lib/types";
import { snapStationToRails, snapToLine } from "@/lib/railLines";
import { useTheme } from "@/lib/useTheme";

/** Satu lin rute (digabung per lin, bukan per kereta) untuk digambar di peta. */
export interface RouteLine {
  key: string;
  operator: Operator;
  line?: string;
  color: string;
  /** Daftar [lat, lng] berurutan dari stasiun asal ke tujuan (rel sungguhan). */
  path: [number, number][];
  /** Kode stasiun yang dilalui (untuk label nama stasiun). */
  stationCodes?: string[];
}

type LeafletNS = typeof import("leaflet");
type LMap = import("leaflet").Map;
type LCircle = import("leaflet").CircleMarker;
type LPoly = import("leaflet").Polyline;
type LMarker = import("leaflet").Marker;

/** Palet elemen peta per tema (Leaflet butuh warna konkret, bukan CSS var). */
const MAP_PALETTE = {
  dark: {
    base: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    ref: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
    stationFill: "#e6edf7",
    stationStroke: "#05080f",
    casing: "#05080f",
    labelClass: "rl-labels",
  },
  light: {
    base: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    ref: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
    stationFill: "#1f2a3d",
    stationStroke: "#ffffff",
    casing: "#ffffff",
    labelClass: "rl-labels rl-labels-light",
  },
} as const;

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

/** Hindari injeksi HTML dari nama stasiun. */
function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

/**
 * Peta sungguhan (OpenStreetMap via Leaflet) dengan:
 *  - garis rute mengikuti REL ASLI (geometri OpenStreetMap), bukan garis lurus
 *  - nama tiap stasiun sebagai label di titik stasiun
 *  - penanda posisi tiap kereta (ditempel ke rel) yang diperbarui real-time
 *
 * Komponen ini hanya dijalankan di klien (diimpor dengan `ssr: false`),
 * karena Leaflet butuh `window`/DOM.
 */
export function LiveMapCanvas({
  stations,
  routes,
  focusKeys,
  labeledStations,
  primaryStations,
  showLabels,
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
  /** Kode stasiun yang diberi label nama. */
  labeledStations: string[];
  /** Subset stasiun utama — labelnya tetap tampil pada zoom rendah. */
  primaryStations: string[];
  /** Tampilkan label nama stasiun? */
  showLabels: boolean;
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
  const labelLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const trainLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const trainMarkers = useRef(new Map<string, LCircle>());
  const routeLines = useRef(new Map<string, { casing: LPoly; main: LPoly }>());
  const highlightRef = useRef<LMarker | null>(null);
  const baseTileRef = useRef<import("leaflet").TileLayer | null>(null);
  const refTileRef = useRef<import("leaflet").TileLayer | null>(null);
  const [ready, setReady] = useState(false);
  const theme = useTheme();

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

      routeLayerRef.current = L.layerGroup().addTo(map);
      stationLayerRef.current = L.layerGroup().addTo(map);
      labelLayerRef.current = L.layerGroup().addTo(map);
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

  /* ---------- 1b. Basemap mengikuti tema (gelap/terang) ---------- */
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;
    const pal = MAP_PALETTE[theme];

    // Ganti lapisan ubin tanpa membangun ulang peta.
    if (baseTileRef.current) map.removeLayer(baseTileRef.current);
    if (refTileRef.current) map.removeLayer(refTileRef.current);

    baseTileRef.current = L.tileLayer(pal.base, {
      maxZoom: 16,
      attribution:
        'Peta &copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    // Lapisan label (nama tempat & jalan) di atas basemap.
    refTileRef.current = L.tileLayer(pal.ref, {
      maxZoom: 16,
      attribution: "",
      className: pal.labelClass,
    }).addTo(map);
  }, [ready, theme]);

  /* ---------- 2. Titik stasiun (ditempel ke rel agar pas di jalur) ---------- */
  useEffect(() => {
    const L = LRef.current;
    const layer = stationLayerRef.current;
    if (!ready || !L || !layer) return;
    const pal = MAP_PALETTE[theme];
    layer.clearLayers();
    for (const s of stations) {
      // Koordinat stasiun di dataset bersifat perkiraan → tempel ke rel
      // lin yang dilayaninya agar titik tepat berada di atas garis rute.
      const [slat, slng] = snapStationToRails(s.lines, s.lat, s.lng);
      // Titik terang dengan cincin kontras supaya jelas terlihat di peta
      // dan tampak "duduk" di atas garis rel.
      L.circleMarker([slat, slng], {
        radius: 3.4,
        color: pal.stationStroke,
        weight: 1.5,
        opacity: 0.9,
        fillColor: pal.stationFill,
        fillOpacity: 0.95,
      })
        .bindTooltip(`${s.name} (${s.code})`, { direction: "top", className: "rl-tip" })
        .addTo(layer);
    }
  }, [ready, stations, theme]);

  /* ---------- 3. Label nama stasiun (dengan anti-tumpang-tindih) ---------- */
  useEffect(() => {
    if (!ready) return;
    const L = LRef.current;
    const layer = labelLayerRef.current;
    const map = mapRef.current;
    if (!L || !layer || !map) return;

    const draw = () => {
      layer.clearLayers();
      if (!showLabels || labeledStations.length === 0) return;

      const primarySet = new Set(primaryStations);
      const byCode = new Map(stations.map((s) => [s.code, s]));
      // Stasiun utama diproses lebih dulu → menang saat ada tabrakan label.
      const ordered = [...labeledStations].sort(
        (a, b) => (primarySet.has(b) ? 1 : 0) - (primarySet.has(a) ? 1 : 0),
      );

      // Kotak label yang sudah terpasang (dalam koordinat piksel) untuk
      // mencegah label saling menimpa; yang bertabrakan dilewati.
      const placed: { x1: number; x2: number; y1: number; y2: number }[] = [];

      for (const code of ordered) {
        const s = byCode.get(code);
        if (!s) continue;
        const p = map.latLngToContainerPoint([s.lat, s.lng]);
        const w = s.name.length * 5.6 + 6;
        const box = { x1: p.x - w / 2, x2: p.x + w / 2, y1: p.y + 5, y2: p.y + 17 };
        let overlap = false;
        for (const b of placed) {
          if (box.x1 < b.x2 && box.x2 > b.x1 && box.y1 < b.y2 && box.y2 > b.y1) {
            overlap = true;
            break;
          }
        }
        if (overlap) continue;
        placed.push(box);

        const isPrimary = primarySet.has(code);
        const icon = L.divIcon({
          className: `rl-stn-label${isPrimary ? " rl-stn-label-p" : ""}`,
          html: `<span>${esc(s.name)}</span>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });
        L.marker([s.lat, s.lng], { icon, interactive: false, keyboard: false }).addTo(layer);
      }
    };

    draw();
    map.on("zoomend", draw);
    return () => {
      map.off("zoomend", draw);
    };
  }, [ready, stations, labeledStations, primaryStations, showLabels]);

  /* ---------- 4. Garis rute (satu per lin, mengikuti rel asli) ---------- */
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
        color: MAP_PALETTE[theme].casing,
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
  }, [ready, routes, focusKeys, theme]);

  /* ---------- 5. Sorotan rute aktif / filter lin ---------- */
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

  /* ---------- 6. Penanda kereta (sinkron inkremental, ditempel ke rel) ---------- */
  useEffect(() => {
    const L = LRef.current;
    const layer = trainLayerRef.current;
    if (!ready || !L || !layer) return;
    const stroke = MAP_PALETTE[theme].stationStroke;

    const seen = new Set<string>();
    for (const t of trains) {
      seen.add(t.trainId);
      const color = trainColor(t);
      // Tempelkan posisi ke rel lin agar penanda tidak melayang di luar jalur.
      const [plat, plng] = snapToLine(t.line, t.position.lat, t.position.lng);
      const latlng: [number, number] = [plat, plng];
      const isHot = selected === t.trainId || hovered === t.trainId;
      let m = trainMarkers.current.get(t.trainId);
      if (!m) {
        m = L.circleMarker(latlng, {
          radius: 5,
          color: stroke,
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
        m.setStyle({ fillColor: color, color: stroke });
      }
      m.setRadius(isHot ? 8 : 5);
      m.bindTooltip(
        `<b>${esc(t.trainName)}</b><br/>${esc(t.lastStationName)} → ${esc(t.nextStationName ?? "stasiun akhir")}` +
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
  }, [ready, trains, selected, hovered, onSelect, onHover, theme]);

  /* ---------- 7. Sorotan + fokus kereta terpilih ---------- */
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
    const [plat, plng] = snapToLine(t.line, t.position.lat, t.position.lng);
    const icon = L.divIcon({
      className: "rl-sel-wrap",
      html: `<span class="rl-sel" style="--c:${color}"></span>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
    const marker = L.marker([plat, plng], {
      icon,
      interactive: false,
      zIndexOffset: 1000,
    })
      .bindTooltip(`<b>${esc(t.trainName)}</b> · KA ${esc(t.trainNumber)}`, {
        permanent: true,
        direction: "right",
        className: "rl-tip rl-tip-strong",
        offset: [10, 0],
      })
      .addTo(map);
    highlightRef.current = marker;
    map.panTo([plat, plng], { animate: true, duration: 0.6 });
  }, [ready, selected, trains]);

  /* ---------- 8. Ukuran ulang saat jendela berubah ---------- */
  useEffect(() => {
    if (!ready) return;
    const onResize = () => mapRef.current?.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [ready]);

  return (
    <div
      ref={containerRef}
      className="h-[420px] w-full bg-(--map-bg) sm:h-[520px] lg:h-[600px]"
      role="application"
      aria-label="Peta posisi kereta real-time"
    />
  );
}
