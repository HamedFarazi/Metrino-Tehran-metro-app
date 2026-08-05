/**
 * MapPage — Three map modes: Offline SVG | Street vector | Satellite
 */
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ZoomIn, ZoomOut, Maximize2,
  Map, Satellite, Layers,
  ArrowLeftRight, MapPin, Navigation, Route, X, LocateFixed,
} from "lucide-react";
import { TransformWrapper, TransformComponent, useTransformEffect } from "react-zoom-pan-pinch";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMetroStore } from "@/store/metro.store";
import { MetroDataService } from "@/services/metro-data.service";
import { MetroRouteService } from "@/services/metro-route.service";
import { useGeolocation } from "@/hooks/useGeolocation";
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
const GLASS = "bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";

// ─── Map Top Bar ──────────────────────────────────────────────────────────────

function MapTopBar() {
  const {
    originStation, destinationStation,
    openSearch, swapOriginDestination,
    setCurrentRoute, addRecentRoute,
    currentRoute, clearRoute,
    userLocation, setOrigin,
  } = useMetroStore();
  const { request: requestLocation, loading: locLoading } = useGeolocation();

  const [routeMode, setRouteMode] = useState(false);
  const canRoute = !!originStation && !!destinationStation;
  // Track previous userLocation to detect when it's freshly set
  const prevLocationRef = useRef(userLocation);

  // When userLocation changes (after requestLocation resolves), find nearest station
  useEffect(() => {
    if (userLocation && userLocation !== prevLocationRef.current) {
      prevLocationRef.current = userLocation;
      const nearest = MetroDataService.getNearestStations(userLocation.lat, userLocation.lng, 1)[0];
      if (nearest) setOrigin(nearest);
    }
  }, [userLocation, setOrigin]);

  const handleFindRoute = () => {
    if (!originStation || !destinationStation) return;
    const route = MetroRouteService.calculate(originStation.id, destinationStation.id);
    if (route) {
      setCurrentRoute(route);
      addRecentRoute(originStation.id, destinationStation.id);
      setRouteMode(false);
    }
  };

  const handleLocateMe = () => {
    requestLocation();
  };

  return (
    <div className="absolute top-0 inset-x-0 z-20 px-3 pt-3 pointer-events-none">
      <div className="pointer-events-auto flex-1 max-w-sm">
        {!routeMode ? (
          <div className="flex gap-2">
            <button
              onClick={() => openSearch("general")}
              className={cn("flex flex-1 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm text-white/50 hover:text-white transition-colors", GLASS)}
            >
              <Search className="h-4 w-4 shrink-0" />
              <span>جستجوی ایستگاه…</span>
            </button>
            {/* Locate Me */}
            <button
              onClick={handleLocateMe}
              disabled={locLoading}
              className={cn("flex items-center gap-1.5 rounded-2xl px-3 py-2.5 text-sm transition-colors", GLASS,
                userLocation ? "text-sky-400 border-sky-500/30" : "text-white/50 hover:text-white"
              )}
            >
              <LocateFixed className={cn("h-4 w-4 shrink-0", locLoading && "animate-spin")} />
            </button>
            <button
              onClick={() => setRouteMode(true)}
              className={cn("flex items-center gap-1.5 rounded-2xl px-3 py-2.5 text-sm transition-colors", GLASS,
                currentRoute ? "text-emerald-400 border-emerald-500/30" : "text-white/50 hover:text-white"
              )}
            >
              <Route className="h-4 w-4 shrink-0" />
              <span className="text-xs font-medium hidden sm:inline">مسیریابی</span>
            </button>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className={cn("rounded-2xl p-3", GLASS)}>
            <div className="flex items-center justify-between mb-2.5" dir="rtl">
              <div className="flex items-center gap-2 text-white/60">
                <Route className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold">مسیریابی</span>
              </div>
              <button onClick={() => { setRouteMode(false); clearRoute(); }}
                className="rounded-lg p-1 text-white/30 hover:text-white/70 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <button onClick={() => openSearch("origin")}
              className={cn("flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-right transition-all bg-white/5 border hover:bg-white/8",
                originStation ? "border-emerald-500/25" : "border-white/6")} dir="rtl">
              <div className="h-7 w-7 shrink-0 flex items-center justify-center rounded-full bg-emerald-500/20">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
              <span className={cn("text-sm flex-1 truncate", originStation ? "text-white/90 font-medium" : "text-white/35")}>
                {originStation ? originStation.nameFa : "مبدا را انتخاب کنید"}
              </span>
              <Search className="h-3.5 w-3.5 shrink-0 text-white/25" />
            </button>
            <div className="relative flex items-center justify-center my-1.5">
              <div className="absolute inset-x-8 h-px bg-white/6" />
              <button onClick={swapOriginDestination}
                className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/8 border border-white/10 hover:bg-white/15 transition-colors">
                <ArrowLeftRight className="h-3 w-3 text-white/40 rotate-90" />
              </button>
            </div>
            <button onClick={() => openSearch("destination")}
              className={cn("flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-right transition-all bg-white/5 border hover:bg-white/8",
                destinationStation ? "border-cyan-500/25" : "border-white/6")} dir="rtl">
              <div className="h-7 w-7 shrink-0 flex items-center justify-center rounded-full bg-cyan-500/20">
                <MapPin className="h-3.5 w-3.5 text-cyan-400" />
              </div>
              <span className={cn("text-sm flex-1 truncate", destinationStation ? "text-white/90 font-medium" : "text-white/35")}>
                {destinationStation ? destinationStation.nameFa : "مقصد را انتخاب کنید"}
              </span>
              <Search className="h-3.5 w-3.5 shrink-0 text-white/25" />
            </button>
            <button onClick={handleFindRoute}
              className={cn("mt-2.5 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all",
                canRoute
                  ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/25 active:scale-95"
                  : "bg-white/5 text-white/20 cursor-not-allowed"
              )}>
              <Navigation className="h-4 w-4" />
              {canRoute ? "یافتن مسیر" : "انتخاب مبدا و مقصد"}
            </button>
            {currentRoute && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                className="mt-2.5 rounded-xl bg-white/5 border border-white/8 px-3 py-2.5 hidden md:block" dir="rtl">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-bold text-sm">{formatDuration(currentRoute.totalTimeMin)}</span>
                    <span className="text-white/40">·</span>
                    <span className="text-white/60">{currentRoute.totalStations} ایستگاه</span>
                    {currentRoute.transferCount > 0 && (
                      <><span className="text-white/40">·</span>
                      <span className="text-amber-400">{currentRoute.transferCount} تبادل</span></>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {currentRoute.segments.map((seg, i) => (
                      <div key={i} className="h-2 w-2 rounded-full" style={{ backgroundColor: LINE_COLORS[seg.lineId] ?? "#888" }} />
                    ))}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1 flex-wrap">
                  {currentRoute.stationSequence.map((station, idx) => {
                    const isLast = idx === currentRoute.stationSequence.length - 1;
                    const isKey = currentRoute.transfers.some(t => t.atStation.id === station.id) || idx === 0 || isLast;
                    return (
                      <div key={station.id} className="flex items-center gap-1">
                        <div className={cn("rounded-full border border-white/30", isKey ? "h-2.5 w-2.5" : "h-1.5 w-1.5")}
                          style={{ backgroundColor: station.colors[0] ?? "#888" }} title={station.nameFa} />
                        {!isLast && <div className="h-px w-2 bg-white/15" />}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function MapPage() {
  const [mode, setMode] = useState<ViewMode>("offline");

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0 }} className="flex flex-col bg-[#1a1c2e]">
      <MapTopBar />
      <div className="absolute inset-0">
        <div className="absolute inset-0 transition-opacity duration-300"
          style={{ opacity: mode === "offline" ? 1 : 0, zIndex: mode === "offline" ? 2 : 1, pointerEvents: mode === "offline" ? "auto" : "none" }}>
          <OfflineMap />
        </div>
        {mode !== "offline" && (
          <div className="absolute inset-0" style={{ zIndex: 2 }}>
            <OnlineMap key={mode} styleKey={mode} />
          </div>
        )}
      </div>
      <LayerSwitcher mode={mode} onChange={setMode} />
    </div>
  );
}

// ─── Layer Switcher ───────────────────────────────────────────────────────────

const LAYERS: Array<{ id: ViewMode; labelFa: string; desc: string; icon: React.ReactNode }> = [
  { id: "offline",   labelFa: "نقشه مترو",     desc: "نقشه خطوط مترو",        icon: <Map className="h-5 w-5" /> },
  { id: "street",    labelFa: "تیره (Fiord)",   desc: "OpenFreeMap — تم تیره", icon: <Layers className="h-5 w-5" /> },
  { id: "liberty",   labelFa: "روشن (Liberty)", desc: "OpenFreeMap — تم روشن", icon: <Layers className="h-5 w-5 opacity-70" /> },
  { id: "satellite", labelFa: "ماهواره‌ای",     desc: "MapTiler Satellite",    icon: <Satellite className="h-5 w-5" /> },
];

function LayerSwitcher({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  const [open, setOpen] = useState(false);
  const current = LAYERS.find((l) => l.id === mode)!;

  return (
    <div className="absolute bottom-24 left-4 z-30 flex flex-col-reverse items-start gap-2">
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.18 }}
            className="flex flex-col gap-1.5 mb-1">
            {LAYERS.map((layer) => (
              <button key={layer.id} onClick={() => { onChange(layer.id); setOpen(false); }}
                className={cn("flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-left transition-all",
                  "bg-black/40 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_8px_24px_rgba(0,0,0,0.5)]",
                  mode === layer.id
                    ? "border-[var(--color-primary)]/40 text-[var(--color-primary)]"
                    : "border-white/8 text-white/65 hover:text-white hover:border-white/15"
                )}>
                <span style={{ color: mode === layer.id ? "var(--color-primary)" : undefined }}
                  className={mode === layer.id ? "" : "text-white/30"}>
                  {layer.icon}
                </span>
                <div dir="rtl">
                  <p className="text-sm font-semibold leading-none">{layer.labelFa}</p>
                  <p className="text-xs text-white/35 mt-0.5">{layer.desc}</p>
                </div>
                {mode === layer.id && (
                  <div className="mr-auto h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: "var(--color-primary)", boxShadow: "0 0 6px var(--color-primary)" }} />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setOpen((v) => !v)}
        className={cn("flex items-center gap-2 rounded-2xl border px-3 py-2.5 transition-all",
          "bg-black/40 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_4px_16px_rgba(0,0,0,0.4)]",
          open
            ? "border-[var(--color-primary)]/40 text-[var(--color-primary)]"
            : "border-white/8 text-white/60 hover:text-white hover:border-white/15"
        )}>
        <Layers className="h-4 w-4" />
        <span className="text-xs font-medium" dir="rtl">{current.labelFa}</span>
      </button>
    </div>
  );
}

// ─── Offline Map ──────────────────────────────────────────────────────────────

// ─── Offline Map ──────────────────────────────────────────────────────────────

/** Reads current transform scale via useTransformEffect and calls back */
function ScaleTracker({ onScale }: { onScale: (s: number) => void }) {
  useTransformEffect(({ state }) => {
    onScale(state.scale);
  });
  return null;
}

const IMAGE_W = 900;
const IMAGE_H = 900; // approximate, used for initial scale calc

function OfflineMap() {
  const [scale, setScale] = useState(1);
  const [showHint, setShowHint] = useState(true);
  const { userLocation } = useMetroStore();
  const [nearestLabel, setNearestLabel] = useState<string | null>(null);

  // Calculate initial scale so the image fits the viewport with a small padding
  const initialScale = Math.min(
    (window.innerWidth * 0.95) / IMAGE_W,
    (window.innerHeight * 0.85) / IMAGE_H,
    1
  );

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 2000);
    return () => clearTimeout(t);
  }, []);

  // Show nearest station when location is available
  useEffect(() => {
    if (!userLocation) return;
    const nearest = MetroDataService.getNearestStations(userLocation.lat, userLocation.lng, 1)[0];
    if (nearest) {
      setNearestLabel(nearest.nameFa);
      const t = setTimeout(() => setNearestLabel(null), 4000);
      return () => clearTimeout(t);
    }
  }, [userLocation]);

  return (
    <div className="relative h-full w-full bg-[#0d1117]">
      <TransformWrapper
        initialScale={initialScale}
        minScale={0.2}
        maxScale={6}
        centerOnInit
        limitToBounds={false}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <ScaleTracker onScale={setScale} />
            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%" }}
              contentStyle={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <img
                src="/metromap.jpg"
                alt="نقشه مترو تهران"
                draggable={false}
                style={{ width: IMAGE_W, maxWidth: "none", userSelect: "none" }}
              />
            </TransformComponent>

            {/* Zoom controls */}
            <div className="absolute bottom-2 right-4 flex flex-col gap-1.5 z-10">
              <ZoomBtn icon={<ZoomIn className="h-4 w-4" />} onClick={() => zoomIn()} />
              <ZoomBtn icon={<ZoomOut className="h-4 w-4" />} onClick={() => zoomOut()} />
              <ZoomBtn icon={<Maximize2 className="h-4 w-4" />} onClick={() => resetTransform()} />
            </div>

            {/* Scale indicator */}
            <div className="absolute bottom-2 left-4 z-10 rounded-lg bg-black/40 backdrop-blur-xl border border-white/8 px-2 py-1 text-xs text-white/40">
              {Math.round(scale * 100)}%
            </div>

            {/* Nearest station toast */}
            <AnimatePresence>
              {nearestLabel && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-2xl bg-sky-500/20 backdrop-blur-xl border border-sky-500/30 px-4 py-2.5 shadow-lg pointer-events-none"
                  dir="rtl"
                >
                  <LocateFixed className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <span className="text-xs text-sky-300 font-medium">نزدیک‌ترین ایستگاه:</span>
                  <span className="text-xs text-white font-semibold">{nearestLabel}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Gesture hint */}
            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                >
                  <div className="flex flex-col items-center gap-3 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 px-8 py-6">
                    <motion.span
                      animate={{ x: [0, 10, -10, 8, -6, 0], y: [0, -5, 5, -3, 3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="text-4xl select-none"
                    >
                      👆
                    </motion.span>
                    <p className="text-xs text-white/60" dir="rtl">برای جابجایی بکشید</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </TransformWrapper>
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
    )}>
      {icon}
    </button>
  );
}

// ─── Online Map ───────────────────────────────────────────────────────────────

function OnlineMap({ styleKey }: { styleKey: OnlineMode }) {
  const divRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const { openStationSheet, currentRoute } = useMetroStore();

  const stations = MetroDataService.getAllStations().filter(
    (s) => !s.isDisabled && s.coordinates.lat !== 0 && s.coordinates.lng !== 0
  );

  // Route overlay — desktop only
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    ["route-line", "route-stations-highlight"].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });
    if (!currentRoute || window.innerWidth < 768) return;

    const coords = currentRoute.stationSequence.map((s) => [s.coordinates.lng, s.coordinates.lat]);

    map.addSource("route-line", { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: coords }, properties: {} } });
    map.addLayer({ id: "route-line", type: "line", source: "route-line",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": "#10b981", "line-width": 4, "line-opacity": 0.85, "line-blur": 1 },
    }, "stations-glow");

    map.addSource("route-stations-highlight", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: currentRoute.stationSequence.map((s, idx) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [s.coordinates.lng, s.coordinates.lat] },
          properties: {
            color: s.colors[0] ?? "#10b981",
            isEndpoint: idx === 0 || idx === currentRoute.stationSequence.length - 1,
            isTransfer: currentRoute.transfers.some((t) => t.atStation.id === s.id),
          },
        })),
      },
    });
    map.addLayer({ id: "route-stations-highlight", type: "circle", source: "route-stations-highlight",
      paint: {
        "circle-radius": ["case", ["get", "isEndpoint"], 10, ["get", "isTransfer"], 8, 5],
        "circle-color": ["get", "color"],
        "circle-stroke-width": 2.5,
        "circle-stroke-color": "#ffffff",
      },
    });

    if (coords.length >= 2) {
      const lngs = coords.map((c) => c[0]);
      const lats = coords.map((c) => c[1]);
      map.fitBounds([[Math.min(...lngs) - 0.01, Math.min(...lats) - 0.01], [Math.max(...lngs) + 0.01, Math.max(...lats) + 0.01]], { padding: 80, duration: 1000 });
    }
  }, [currentRoute, ready]);

  useEffect(() => {
    if (!divRef.current) return;
    const lib = mgl();
    if (!lib) return;
    let cancelled = false;
    const styleDef = MAP_STYLES[styleKey];

    const initMap = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let styleObj: string | any = styleDef.url;
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
              return { ...l, layout: { ...l.layout,
                "text-field": ["case", ["has", "name:nonlatin"], ["concat", ["get", "name:latin"], "\n", ["get", "name:nonlatin"]], ["coalesce", ["get", "name:latin"], ["get", "name"]]],
                "text-font": ["Noto Sans Arabic Regular", "Noto Sans Regular"],
              }};
            });
          }
          styleObj = json;
        } catch { /* fallback to url */ }
      }
      if (cancelled || !divRef.current) return;
      const map = new lib.Map({ container: divRef.current, style: styleObj, center: TEHRAN, zoom: ZOOM, attributionControl: false });
      map.addControl(new lib.AttributionControl({ compact: true }), "bottom-left");
      map.on("load", () => { if (cancelled) return; addStationLayers(map); setReady(true); });
      mapRef.current = map;
    };

    initMap();
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleKey]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function addStationLayers(map: any) {
    const geojson = {
      type: "FeatureCollection" as const,
      features: stations.map((s) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [s.coordinates.lng, s.coordinates.lat] },
        properties: { id: s.id, name: s.name, color: s.colors[0] ?? "#888", isInterchange: s.lines.length > 1 },
      })),
    };
    map.addSource("stations", { type: "geojson", data: geojson });
    map.addLayer({ id: "stations-glow", type: "circle", source: "stations", filter: ["==", ["get", "isInterchange"], true],
      paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 10, 14, 20], "circle-color": ["get", "color"], "circle-opacity": 0.2, "circle-blur": 1 } });
    map.addLayer({ id: "stations-circle", type: "circle", source: "stations",
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, ["case", ["get", "isInterchange"], 5, 3], 14, ["case", ["get", "isInterchange"], 10, 6]],
        "circle-color": ["get", "color"],
        "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 9, 1.5, 14, 3],
        "circle-stroke-color": "rgba(255,255,255,0.95)",
      } });
    map.addLayer({ id: "stations-label", type: "symbol", source: "stations", minzoom: 13,
      layout: { "text-field": ["get", "name"], "text-font": ["Noto Sans Regular"], "text-size": ["interpolate", ["linear"], ["zoom"], 13, 10, 16, 13], "text-offset": [0, 1.2], "text-anchor": "top", "text-allow-overlap": false },
      paint: { "text-color": "#fff", "text-halo-color": "rgba(0,0,0,0.85)", "text-halo-width": 1.5 } });
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
    <div className={cn("absolute bottom-24 right-4 z-10 rounded-2xl overflow-hidden",
      "bg-black/40 backdrop-blur-2xl border border-white/8",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_8px_24px_rgba(0,0,0,0.5)]")}>
      <button onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-3.5 py-2.5" dir="rtl">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">خطوط</p>
        <span className="text-white/25 text-xs leading-none">{collapsed ? "+" : "−"}</span>
      </button>
      <AnimatePresence>
        {!collapsed && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-3.5 pb-3 flex flex-col gap-2">
              {lines.map((l) => (
                <div key={l.id} className="flex items-center gap-2.5" dir="rtl">
                  <div className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: LINE_COLORS[l.id] ?? "#888", boxShadow: `0 0 4px ${LINE_COLORS[l.id]}80` }} />
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
