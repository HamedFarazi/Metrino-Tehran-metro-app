/**
 * MapPage — Three map modes: Offline SVG | Street vector | Satellite
 */
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ZoomIn, ZoomOut, Maximize2, Map, Satellite, Layers, ArrowLeftRight, MapPin, Navigation, Route, X } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMetroStore } from "@/store/metro.store";
import { MetroDataService } from "@/services/metro-data.service";
import { MetroRouteService } from "@/services/metro-route.service";
import { LINE_COLORS } from "@/types/metro";
import { cn, formatDuration } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mgl = () => (window as any).maplibregl as typeof import("maplibre-gl");
const MT_KEY = import.meta.env.VITE_MAPTILER_KEY as string;

const MAP_STYLES = {
  street:    { url: "https://tiles.openfreemap.org/styles/fiord",   glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${MT_KEY}` },
  liberty:   { url: "https://tiles.openfreemap.org/styles/liberty", glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${MT_KEY}` },
  satellite: { url: `https://api.maptiler.com/maps/satellite/style.json?key=${MT_KEY}`, glyphs: null },
} as const;

type OnlineMode = keyof typeof MAP_STYLES;
type ViewMode = "offline" | OnlineMode;

const TEHRAN: [number, number] = [51.389, 35.6892];
const ZOOM = 11;

// ─── Page ─────────────────────────────────────────────────────────────────────

export function MapPage() {
  const [mode, setMode] = useState<ViewMode>("offline");
  const { openSearch } = useMetroStore();

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0 }} className="flex flex-col bg-[#1a1c2e]">

      {/* Top bar */}
      <MapTopBar />

      {/* Map area */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{ opacity: mode === "offline" ? 1 : 0, zIndex: mode === "offline" ? 2 : 1, pointerEvents: mode === "offline" ? "auto" : "none" }}
        >
          <OfflineMap />
        </div>

        {mode !== "offline" && (
          <div className="absolute inset-0" style={{ zIndex: 2 }}>
            <OnlineMap key={mode} styleKey={mode} />
          </div>
        )}
      </div>

      {/* Layer switcher */}
      <LayerSwitcher mode={mode} onChange={setMode} />
    </div>
  );
}

// ─── Layer Switcher ───────────────────────────────────────────────────────────

const LAYERS: Array<{ id: ViewMode; labelFa: string; desc: string; icon: React.ReactNode }> = [
  { id: "offline",   labelFa: "نقشه مترو",      desc: "نقشه خطوط مترو",        icon: <Map className="h-5 w-5" /> },
  { id: "street",    labelFa: "تیره (Fiord)",    desc: "OpenFreeMap — تم تیره", icon: <Layers className="h-5 w-5" /> },
  { id: "liberty",   labelFa: "روشن (Liberty)",  desc: "OpenFreeMap — تم روشن", icon: <Layers className="h-5 w-5 opacity-70" /> },
  { id: "satellite", labelFa: "ماهواره‌ای",      desc: "MapTiler Satellite",    icon: <Satellite className="h-5 w-5" /> },
];

const GLASS = "bg-black/40 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_8px_24px_rgba(0,0,0,0.5)]";

function LayerSwitcher({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  const [open, setOpen] = useState(false);
  const current = LAYERS.find((l) => l.id === mode)!;

  return (
    <div className="absolute bottom-24 left-4 z-30 flex flex-col-reverse items-start gap-2">

      {/* Options list */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-1.5 mb-1"
          >
            {LAYERS.map((layer) => (
              <button
                key={layer.id}
                onClick={() => { onChange(layer.id); setOpen(false); }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-left transition-all",
                  GLASS,
                  mode === layer.id
                    ? "border-emerald-500/30 text-emerald-300"
                    : "border-white/8 text-white/65 hover:text-white hover:border-white/15"
                )}
              >
                <span className={mode === layer.id ? "text-emerald-400" : "text-white/30"}>
                  {layer.icon}
                </span>
                <div dir="rtl">
                  <p className="text-sm font-semibold leading-none">{layer.labelFa}</p>
                  <p className="text-xs text-white/35 mt-0.5">{layer.desc}</p>
                </div>
                {mode === layer.id && (
                  <div className="mr-auto h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-2xl border px-3 py-2.5 transition-all",
          GLASS,
          open ? "border-emerald-500/30 text-emerald-300" : "border-white/8 text-white/60 hover:text-white hover:border-white/15"
        )}
      >
        <Layers className="h-4 w-4" />
        <span className="text-xs font-medium" dir="rtl">{current.labelFa}</span>
      </button>
    </div>
  );
}

// ─── Offline Map ──────────────────────────────────────────────────────────────

function OfflineMap() {
  const [scale, setScale] = useState(1);
  return (
    <div className="relative h-full w-full bg-[#0d1117]">
      <TransformWrapper initialScale={1} minScale={0.3} maxScale={6} centerOnInit
        onTransformed={(r) => setScale(r.state.scale)}>
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%" }}
              contentStyle={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <img src="/metromap.jpg" alt="نقشه مترو تهران" draggable={false}
                style={{ width: 900, maxWidth: "none", userSelect: "none" }} />
            </TransformComponent>
            <div className="absolute bottom-2 right-4 flex flex-col gap-1.5 z-10">
              <ZoomBtn icon={<ZoomIn className="h-4 w-4" />} onClick={() => zoomIn()} />
              <ZoomBtn icon={<ZoomOut className="h-4 w-4" />} onClick={() => zoomOut()} />
              <ZoomBtn icon={<Maximize2 className="h-4 w-4" />} onClick={() => resetTransform()} />
            </div>
            <div className="absolute bottom-2 left-4 z-10 rounded-lg bg-black/40 backdrop-blur-xl border border-white/8 px-2 py-1 text-xs text-white/40">
              {Math.round(scale * 100)}%
            </div>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}

// ─── Online Map ───────────────────────────────────────────────────────────────

function OnlineMap({ styleKey }: { styleKey: OnlineMode }) {
  const divRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const { openStationSheet } = useMetroStore();

  const stations = MetroDataService.getAllStations().filter(
    (s) => !s.isDisabled && s.coordinates.lat !== 0 && s.coordinates.lng !== 0
  );

  useEffect(() => {
    if (!divRef.current) return;
    const lib = mgl();
    if (!lib) return;

    let cancelled = false;
    const styleDef = MAP_STYLES[styleKey];

    const initMap = async () => {
      let styleObj: string | object = styleDef.url;

      if (styleKey !== "satellite") {
        try {
          const res = await fetch(styleDef.url);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const json: any = await res.json();
          if (styleDef.glyphs) json.glyphs = styleDef.glyphs;
          if (Array.isArray(json.layers)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            json.layers = json.layers.map((l: any) => {
              if (l.type !== "symbol" || !l.layout?.["text-field"]) return l;
              return {
                ...l,
                layout: {
                  ...l.layout,
                  "text-field": ["case", ["has", "name:nonlatin"],
                    ["concat", ["get", "name:latin"], "\n", ["get", "name:nonlatin"]],
                    ["coalesce", ["get", "name:latin"], ["get", "name"]],
                  ],
                  "text-font": ["Noto Sans Arabic Regular", "Noto Sans Regular"],
                },
              };
            });
          }
          styleObj = json;
        } catch { /* use url fallback */ }
      }

      if (cancelled || !divRef.current) return;

      const map = new lib.Map({ container: divRef.current, style: styleObj, center: TEHRAN, zoom: ZOOM, attributionControl: false });
      map.addControl(new lib.AttributionControl({ compact: true }), "bottom-left");
      map.on("load", () => {
        if (cancelled) return;
        addStationLayers(map);
        setReady(true);
      });
      mapRef.current = map;
    };

    initMap();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleKey]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function addStationLayers(map: any) {
    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: stations.map((s) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [s.coordinates.lng, s.coordinates.lat] },
        properties: { id: s.id, name: s.name, color: s.colors[0] ?? "#888", isInterchange: s.lines.length > 1 },
      })),
    };

    map.addSource("stations", { type: "geojson", data: geojson });

    map.addLayer({ id: "stations-glow", type: "circle", source: "stations",
      filter: ["==", ["get", "isInterchange"], true],
      paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 10, 14, 20], "circle-color": ["get", "color"], "circle-opacity": 0.2, "circle-blur": 1 },
    });

    map.addLayer({ id: "stations-circle", type: "circle", source: "stations",
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, ["case", ["get", "isInterchange"], 5, 3], 14, ["case", ["get", "isInterchange"], 10, 6]],
        "circle-color": ["get", "color"],
        "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 9, 1.5, 14, 3],
        "circle-stroke-color": "rgba(255,255,255,0.95)",
      },
    });

    map.addLayer({ id: "stations-label", type: "symbol", source: "stations", minzoom: 13,
      layout: { "text-field": ["get", "name"], "text-font": ["Noto Sans Regular"], "text-size": ["interpolate", ["linear"], ["zoom"], 13, 10, 16, 13], "text-offset": [0, 1.2], "text-anchor": "top", "text-allow-overlap": false },
      paint: { "text-color": "#fff", "text-halo-color": "rgba(0,0,0,0.85)", "text-halo-width": 1.5 },
    });

    map.on("click", "stations-circle", (e: { features?: Array<{ properties?: { id?: string } }> }) => {
      const id = e.features?.[0]?.properties?.id;
      if (id) { const s = MetroDataService.getStation(id); if (s) openStationSheet(s); }
    });
    map.on("mouseenter", "stations-circle", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "stations-circle", () => { map.getCanvas().style.cursor = ""; });
  }

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div ref={divRef} style={{ position: "absolute", inset: 0 }} />
      {!ready && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#1a1c2e]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-500" />
          <p className="text-sm text-white/40">در حال بارگذاری نقشه…</p>
        </div>
      )}
      {ready && <MapLegend />}
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function MapLegend() {
  const [collapsed, setCollapsed] = useState(false);
  const lines = MetroDataService.getAllLines();

  return (
    <div className={cn(
      "absolute bottom-24 right-4 z-10 rounded-2xl overflow-hidden",
      "bg-black/40 backdrop-blur-2xl border border-white/8",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_8px_24px_rgba(0,0,0,0.5)]"
    )}>
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-3.5 py-2.5"
        dir="rtl"
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">خطوط</p>
        <span className="text-white/25 text-xs leading-none">{collapsed ? "+" : "−"}</span>
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3 flex flex-col gap-2">
              {lines.map((l) => (
                <div key={l.id} className="flex items-center gap-2.5" dir="rtl">
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: LINE_COLORS[l.id] ?? "#888", boxShadow: `0 0 4px ${LINE_COLORS[l.id]}80` }}
                  />
                  <span className="text-[11px] text-white/65">{l.nameFa}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Zoom btn ─────────────────────────────────────────────────────────────────

function ZoomBtn({ icon, onClick }: { icon: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
      "bg-black/40 backdrop-blur-2xl border-white/8",
      "text-white/55 hover:text-white hover:border-white/15",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
    )}>
      {icon}
    </button>
  );
}
