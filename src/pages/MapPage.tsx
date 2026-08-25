/**
 * MapPage — Three map modes: Offline SVG | Street vector | Satellite
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ZoomIn, ZoomOut, Maximize2,
  Map, Satellite, Layers, Eye,
  ArrowLeftRight, MapPin, Navigation, Route, X, LocateFixed,
  CloudSun, CloudRain, Cloud, Sun, CloudSnow, Wind,
  Building2,
} from "lucide-react";
import { TransformWrapper, TransformComponent, useTransformEffect } from "react-zoom-pan-pinch";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMetroStore } from "@/store/metro.store";
import { MetroDataService } from "@/services/metro-data.service";
import { MetroRouteService } from "@/services/metro-route.service";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useIsDesktop, useMediaQuery } from "@/hooks/useMediaQuery";
import { LINE_COLORS } from "@/types/metro";
import { cn, formatDuration } from "@/lib/utils";
import { createGLBDragController } from "@/lib/glb-drag-controller";

/** Desktop route sidebar = `md` + w-80; station sidebar = `lg` + ~356px */
const ROUTE_SIDEBAR_OFFSET_PX = 336;
const STATION_SIDEBAR_OFFSET_PX = 380;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mgl = () => (window as any).maplibregl as typeof import("maplibre-gl");
const MT_KEY = import.meta.env.VITE_MAPTILER_KEY as string;

const MAP_STYLES = {
  street:    { url: "https://tiles.openfreemap.org/styles/fiord",   glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${MT_KEY}` },
  liberty:   { url: "https://tiles.openfreemap.org/styles/liberty", glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${MT_KEY}` },
  satellite: { url: `https://api.maptiler.com/maps/satellite/style.json?key=${MT_KEY}`, glyphs: null },
  "futuristic-3d": { url: "https://tiles.openfreemap.org/styles/fiord", glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${MT_KEY}` },
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
    setCurrentRoute, setAlternativeRoutes, addRecentRoute,
    currentRoute, clearRoute,
    userLocation, setOrigin,
    isStationSheetOpen,
  } = useMetroStore();
  const { request: requestLocation, loading: locLoading } = useGeolocation();
  const isMdUp = useMediaQuery("(min-width: 768px)"); // RouteSheet desktop sidebar
  const isLgUp = useIsDesktop(); // Station DesktopSidebar

  const [routeMode, setRouteMode] = useState(false);
  const canRoute = !!originStation && !!destinationStation;
  // Track previous userLocation to detect when it's freshly set
  const prevLocationRef = useRef(userLocation);

  // Push top controls left when a desktop right sidebar is open
  const topBarOffsetPx =
    isLgUp && isStationSheetOpen
      ? STATION_SIDEBAR_OFFSET_PX
      : isMdUp && !!currentRoute
        ? ROUTE_SIDEBAR_OFFSET_PX
        : 0;

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
    const routes = MetroRouteService.calculateMultiple(originStation.id, destinationStation.id);
    if (routes.length > 0) {
      setAlternativeRoutes(routes);
      setCurrentRoute(routes[0].route);
      addRecentRoute(originStation.id, destinationStation.id);
      setRouteMode(false);
    }
  };

  const handleLocateMe = () => {
    requestLocation();
  };

  return (
    <div className="absolute top-0 inset-x-0 z-20 px-3 pt-3 pointer-events-none">
      {/* On desktop, shift away from route/station sidebars so controls stay visible */}
      <div
        className="pointer-events-auto flex-1 max-w-sm transition-[margin] duration-300 ease-in-out"
        style={{ marginRight: topBarOffsetPx ? topBarOffsetPx : undefined }}
      >
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
  const [isInitialized, setIsInitialized] = useState(false);

  // Add/remove body class based on offline map visibility
  useEffect(() => {
    if (mode === "offline") {
      document.body.classList.add("showing-offline-map");
    } else {
      document.body.classList.remove("showing-offline-map");
    }
    return () => {
      document.body.classList.remove("showing-offline-map");
    };
  }, [mode]);

  // Mark as initialized after first render to prevent flash
  useEffect(() => {
    // Small delay to ensure smooth transition
    const timer = setTimeout(() => setIsInitialized(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      style={{ position: "fixed", inset: 0, zIndex: 0 }} 
      className="flex flex-col bg-[#1a1c2e]"
      data-map-mode={mode}
    >
      <MapTopBar />
      <WeatherWidget />
      <div className="absolute inset-0">
        <div className="absolute inset-0 transition-opacity duration-300"
          style={{ opacity: mode === "offline" ? 1 : 0, zIndex: mode === "offline" ? 2 : 1, pointerEvents: mode === "offline" ? "auto" : "none" }}>
          {isInitialized && <OfflineMap />}
        </div>
        {mode !== "offline" && isInitialized && (
          <div className="absolute inset-0" style={{ zIndex: 2 }}>
            <OnlineMap key={mode} styleKey={mode} />
          </div>
        )}
      </div>
      {!isInitialized && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#1a1c2e]">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-emerald-500/30 border-t-emerald-500" />
          <p className="mt-4 text-sm text-white/50">در حال بارگذاری نقشه…</p>
        </div>
      )}
      <LayerSwitcher mode={mode} onChange={setMode} />
    </div>
  );
}

// ─── Weather Widget ───────────────────────────────────────────────────────────

interface WeatherData {
  temp: number;
  description: string;
  code: number;
}

function getWeatherIcon(code: number, className = "h-4 w-4") {
  if (code >= 200 && code < 300) return <CloudRain className={className} />;
  if (code >= 300 && code < 600) return <CloudRain className={className} />;
  if (code >= 600 && code < 700) return <CloudSnow className={className} />;
  if (code >= 700 && code < 800) return <Wind className={className} />;
  if (code === 800) return <Sun className={className} />;
  if (code === 801 || code === 802) return <CloudSun className={className} />;
  return <Cloud className={className} />;
}

function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Open-Meteo — free, no API key, Tehran coords
    const TEHRAN_LAT = 35.6892;
    const TEHRAN_LNG = 51.389;
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${TEHRAN_LAT}&longitude=${TEHRAN_LNG}&current_weather=true&hourly=precipitation_probability&forecast_days=1`
    )
      .then((r) => r.json())
      .then((data) => {
        const cw = data.current_weather;
        if (!cw) return;
        // Map WMO weather code to a rough OWM-style code for icon
        const wmo = cw.weathercode as number;
        let code = 800;
        if (wmo === 0) code = 800;
        else if (wmo <= 3) code = 801 + wmo;
        else if (wmo <= 49) code = 741;
        else if (wmo <= 67) code = 501;
        else if (wmo <= 77) code = 601;
        else if (wmo <= 82) code = 521;
        else if (wmo <= 99) code = 211;

        const descMap: Record<number, string> = {
          0: "آفتابی", 1: "کمی ابری", 2: "نیمه ابری", 3: "ابری",
          45: "مه", 48: "مه یخ‌زده",
          51: "نم‌نم باران", 53: "باران ملایم", 55: "باران",
          61: "باران سبک", 63: "باران متوسط", 65: "باران شدید",
          71: "برف سبک", 73: "برف", 75: "برف شدید",
          80: "رگبار سبک", 81: "رگبار", 82: "رگبار شدید",
          95: "طوفان",
        };
        setWeather({
          temp: Math.round(cw.temperature),
          description: descMap[wmo] ?? "نامشخص",
          code,
        });
      })
      .catch(() => { /* silently fail */ })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !weather) return null;

  return (
    <div
      className={cn(
        "absolute top-[52px] left-3 z-20 pointer-events-none",
        "flex items-center gap-1.5 rounded-2xl px-2.5 py-1.5",
        "bg-black/35 backdrop-blur-xl border border-white/[0.09]",
        "shadow-[0_2px_12px_rgba(0,0,0,0.4)]",
        "select-none",
      )}
    >
      <span className="text-white/60">{getWeatherIcon(weather.code, "h-3.5 w-3.5")}</span>
      <span className="text-[13px] font-semibold text-white/90 tabular-nums">{weather.temp}°</span>
      <span className="text-[11px] text-white/40 hidden xs:inline">{weather.description}</span>
    </div>
  );
}

// ─── Layer Switcher ───────────────────────────────────────────────────────────

const LAYERS: Array<{ id: ViewMode; labelFa: string; desc: string; icon: React.ReactNode }> = [
  { id: "offline",   labelFa: "نقشه مترو",     desc: "نقشه خطوط مترو",        icon: <Map className="h-5 w-5" /> },
  { id: "street",    labelFa: "تیره (Fiord)",   desc: "OpenFreeMap — تم تیره", icon: <Layers className="h-5 w-5" /> },
  { id: "liberty",   labelFa: "روشن (Liberty)", desc: "OpenFreeMap — تم روشن", icon: <Layers className="h-5 w-5 opacity-70" /> },
  { id: "satellite", labelFa: "ماهواره‌ای",     desc: "MapTiler Satellite",    icon: <Satellite className="h-5 w-5" /> },
  { id: "futuristic-3d", labelFa: "شهر 3D", desc: "نمای 3D تهران", icon: <Building2 className="h-5 w-5" /> },
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

type AccessibilityMapType = "default" | "blind" | "ramp" | "wheelchair";

const ACCESSIBILITY_MAPS = {
  default: {
    url: "/metromap.jpg",
    label: "نقشه کلی",
    labelEn: "General Map",
  },
  blind: {
    url: "https://metro.tehran.ir/Portals/0/1405/%D9%86%D8%A7%D8%A8%DB%8C%D9%86%D8%A7%DB%8C%D8%A7%D9%86405.jpg?ver=YECRgttb4hQmuwfBzoOi8Q%3d%3d",
    label: "مسیر ویژه نابینایان",
    labelEn: "Blind Path",
  },
  ramp: {
    url: "https://metro.tehran.ir/Portals/0/1405/%D9%88%DB%8C%DA%98%D9%87%20%D8%B1%D9%85%D9%BE405.jpg?ver=dsC1T7ituMsPCiFu1fNlGw%3d%3d",
    label: "ورودی همسطح یا رمپ",
    labelEn: "Level Entry / Ramp",
  },
  wheelchair: {
    url: "https://metro.tehran.ir/Portals/0/1405/%D9%88%DB%8C%D9%84%DA%86%D8%B1405.jpg?ver=fxZWUZmLLwdapR5_iH6vIA%3d%3d",
    label: "آسانسور ویلچر",
    labelEn: "Wheelchair Elevator",
  },
} as const;

function OfflineMap() {
  const [scale, setScale] = useState(1);
  const [showHint, setShowHint] = useState(true);
  const { userLocation } = useMetroStore();
  const [nearestLabel, setNearestLabel] = useState<string | null>(null);
  const [accessibilityMap, setAccessibilityMap] = useState<AccessibilityMapType>("default");
  const [showAccessibilityPopup, setShowAccessibilityPopup] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Calculate initial scale so the image fits the viewport with padding
  const initialScale = Math.min(
    (window.innerWidth * 0.9) / IMAGE_W,
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

  // Preload default image
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = ACCESSIBILITY_MAPS.default.url;
  }, []);

  return (
    <div className="relative h-full w-full bg-[#0d1117]">
      {!imageLoaded && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-emerald-500/30 border-t-emerald-500" />
          <p className="mt-4 text-sm text-white/50">بارگذاری نقشه…</p>
        </div>
      )}
      <TransformWrapper
        initialScale={initialScale}
        minScale={0.2}
        maxScale={6}
        centerOnInit
        limitToBounds={false}
        centerZoomedOut={true}
        disabled={!imageLoaded}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <ScaleTracker onScale={setScale} />
            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%" }}
              contentStyle={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                width: "100%",
                height: "100%",
                opacity: imageLoaded ? 1 : 0,
                transition: "opacity 0.3s ease-in-out"
              }}
            >
              <img
                src={ACCESSIBILITY_MAPS[accessibilityMap].url}
                alt={ACCESSIBILITY_MAPS[accessibilityMap].label}
                draggable={false}
                onLoad={() => setImageLoaded(true)}
                style={{ 
                  width: IMAGE_W, 
                  maxWidth: "none", 
                  userSelect: "none"
                }}
              />
            </TransformComponent>

            {/* Zoom controls */}
            <div className="absolute bottom-2 right-4 flex flex-col gap-1.5 z-10">
              <ZoomBtn 
                icon={<Eye className="h-4 w-4" />} 
                onClick={() => setShowAccessibilityPopup(!showAccessibilityPopup)} 
                active={showAccessibilityPopup}
              />
              <ZoomBtn icon={<ZoomIn className="h-4 w-4" />} onClick={() => zoomIn()} />
              <ZoomBtn icon={<ZoomOut className="h-4 w-4" />} onClick={() => zoomOut()} />
              <ZoomBtn icon={<Maximize2 className="h-4 w-4" />} onClick={() => resetTransform()} />
            </div>

            {/* Accessibility Map Popup */}
            <AnimatePresence>
              {showAccessibilityPopup && (
                <>
                  {/* Backdrop for mobile */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="md:hidden fixed inset-0 bg-black/40 z-[15]"
                    onClick={() => setShowAccessibilityPopup(false)}
                  />
                  
                  {/* Desktop Popup (slide from right) */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="hidden md:block absolute bottom-2 right-20 z-20 max-w-[280px]"
                    dir="rtl"
                  >
                    <div 
                      className="rounded-2xl p-3 min-w-[220px] w-full"
                      style={{
                        background: "rgba(0, 0, 0, 0.85)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                      }}
                    >
                      <h3 className="text-sm font-semibold mb-2 px-1" style={{ color: "#F8FAFF" }}>
                        تغییر نما
                      </h3>
                      <div className="space-y-1">
                        {(Object.keys(ACCESSIBILITY_MAPS) as AccessibilityMapType[]).map((type) => (
                          <button
                            key={type}
                            onClick={() => {
                              setAccessibilityMap(type);
                              setShowAccessibilityPopup(false);
                            }}
                            className="w-full text-right px-3 py-2 rounded-xl transition-all text-sm whitespace-normal"
                            style={{
                              background: accessibilityMap === type 
                                ? "rgba(139, 92, 246, 0.2)" 
                                : "rgba(255, 255, 255, 0.05)",
                              border: `1px solid ${accessibilityMap === type 
                                ? "rgba(139, 92, 246, 0.4)" 
                                : "transparent"}`,
                              color: accessibilityMap === type ? "#A855F7" : "rgba(248, 250, 255, 0.8)",
                            }}
                          >
                            {ACCESSIBILITY_MAPS[type].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  {/* Mobile Bottom Sheet */}
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 30, stiffness: 380 }}
                    className="md:hidden fixed bottom-0 inset-x-0 z-20 rounded-t-3xl p-5"
                    style={{
                      background: "rgba(0, 0, 0, 0.9)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.6)",
                      paddingBottom: "calc(env(safe-area-inset-bottom) + 80px)", // Space for bottom nav
                    }}
                    dir="rtl"
                  >
                    {/* Handle */}
                    <div className="flex justify-center mb-4">
                      <div className="h-1 w-12 rounded-full" style={{ background: "rgba(255, 255, 255, 0.2)" }} />
                    </div>

                    <h3 className="text-base font-semibold mb-3" style={{ color: "#F8FAFF" }}>
                      انتخاب نوع نقشه
                    </h3>
                    
                    <div className="space-y-2">
                      {(Object.keys(ACCESSIBILITY_MAPS) as AccessibilityMapType[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            setAccessibilityMap(type);
                            setShowAccessibilityPopup(false);
                          }}
                          className="w-full text-right px-4 py-3 rounded-xl transition-all"
                          style={{
                            background: accessibilityMap === type 
                              ? "rgba(139, 92, 246, 0.25)" 
                              : "rgba(255, 255, 255, 0.08)",
                            border: `1px solid ${accessibilityMap === type 
                              ? "rgba(139, 92, 246, 0.5)" 
                              : "rgba(255, 255, 255, 0.1)"}`,
                            color: accessibilityMap === type ? "#A855F7" : "rgba(248, 250, 255, 0.9)",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{ACCESSIBILITY_MAPS[type].label}</span>
                            {accessibilityMap === type && (
                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

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
                    <motion.div
                      animate={{ x: [0, 10, -10, 8, -6, 0], y: [0, -5, 5, -3, 3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="relative"
                    >
                      <div className="flex items-center justify-center h-12 w-12 rounded-full"
                        style={{ background: "rgba(139, 92, 246, 0.2)", border: "2px solid rgba(139, 92, 246, 0.4)" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                          className="h-6 w-6" style={{ color: "#A855F7" }}>
                          <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>
                        </svg>
                      </div>
                    </motion.div>
                    <div className="flex flex-col items-center gap-1" dir="rtl">
                      <p className="text-sm font-medium text-white/80">برای جابجایی بکشید</p>
                      <p className="text-xs text-white/40">برای بزرگ‌نمایی دوبار لمس کنید</p>
                    </div>
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

function ZoomBtn({ icon, onClick, active = false }: { icon: React.ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} className={cn(
      "flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
      active 
        ? "bg-violet-500/30 backdrop-blur-2xl border-violet-500/50 text-violet-300"
        : "bg-black/40 backdrop-blur-2xl border-white/8 text-white/55 hover:text-white hover:border-white/15",
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
  const { openStationSheet, currentRoute, selectedStationCoordinates, isStationSheetOpen } = useMetroStore();
  // Keep animation frame id in a ref so cleanup is always up-to-date
  const targetAnimRef = useRef<number | null>(null);

  const stations = MetroDataService.getAllStations().filter(
    (s) => !s.isDisabled && s.coordinates.lat !== 0 && s.coordinates.lng !== 0
  );

  // Helper: remove target layers/source unconditionally
  const removeTargetLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (targetAnimRef.current !== null) {
      cancelAnimationFrame(targetAnimRef.current);
      targetAnimRef.current = null;
    }
    const LAYERS = ["station-target-outer", "station-target-inner", "station-target-center"] as const;
    LAYERS.forEach((id) => { try { if (map.getLayer(id)) map.removeLayer(id); } catch {} });
    try { if (map.getSource("station-target")) map.removeSource("station-target"); } catch {}
  }, []);

  // Selected station target effect — desktop only
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    // Clean up whatever was previously rendered
    removeTargetLayers();

    if (!selectedStationCoordinates || !isStationSheetOpen || window.innerWidth < 768) {
      return removeTargetLayers;
    }

    const { lng, lat } = selectedStationCoordinates;

    try {
      map.addSource("station-target", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [{ type: "Feature", geometry: { type: "Point", coordinates: [lng, lat] }, properties: {} }] },
      });
      map.addLayer({ id: "station-target-outer", type: "circle", source: "station-target",
        paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 15, 15, 25, 18, 40],
          "circle-color": "#ffffff", "circle-opacity": 0.25, "circle-stroke-width": 2, "circle-stroke-color": "#ffffff", "circle-stroke-opacity": 0.5 } });
      map.addLayer({ id: "station-target-inner", type: "circle", source: "station-target",
        paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 8, 15, 15, 18, 25],
          "circle-color": "#ffffff", "circle-opacity": 0.6, "circle-stroke-width": 2, "circle-stroke-color": "#ffffff", "circle-stroke-opacity": 0.8 } });
      map.addLayer({ id: "station-target-center", type: "circle", source: "station-target",
        paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3, 15, 5, 18, 8],
          "circle-color": "#ffffff", "circle-opacity": 1, "circle-stroke-width": 2, "circle-stroke-color": "#10b981" } });
    } catch {
      return removeTargetLayers;
    }

    // Pulsing animation — ID stored in ref so cleanup is always current
    let time = 0;
    const animate = () => {
      time += 0.05;
      const pulse = 0.5 + 0.3 * Math.sin(time);
      try {
        map.setPaintProperty("station-target-outer", "circle-opacity", 0.15 + 0.15 * pulse);
        map.setPaintProperty("station-target-outer", "circle-radius", ["interpolate", ["linear"], ["zoom"], 10, 12 + 3 * pulse, 15, 20 + 5 * pulse, 18, 35 + 5 * pulse]);
      } catch {}
      targetAnimRef.current = requestAnimationFrame(animate);
    };
    targetAnimRef.current = requestAnimationFrame(animate);

    // Fly to station on desktop
    map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 14), duration: 700, essential: true });

    return removeTargetLayers;
  }, [selectedStationCoordinates, isStationSheetOpen, ready, removeTargetLayers]);
  
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
      if (styleKey !== "satellite" && styleKey !== "futuristic-3d") {
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
      } else if (styleKey === "futuristic-3d") {
        // Load Fiord style for futuristic mode
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
          // Add promoteId to openmaptiles source so feature IDs work in filters
          // Use string format to use tile's built-in feature ID
          if (json.sources?.openmaptiles) {
            json.sources.openmaptiles = {
              ...json.sources.openmaptiles,
              promoteId: "id"  // Use tile's own numeric feature ID
            };
          }
          styleObj = json;
        } catch { /* fallback to url */ }
      }
      if (cancelled || !divRef.current) return;
      const map = new lib.Map({ container: divRef.current, style: styleObj, center: TEHRAN, zoom: ZOOM, attributionControl: false });
      map.addControl(new lib.AttributionControl({ compact: true }), "bottom-left");
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const setupLayers = (map: any) => {
        const geojson = {
          type: "FeatureCollection" as const,
          features: stations.map((s) => ({
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: [s.coordinates.lng, s.coordinates.lat] },
            properties: { id: s.id, name: s.name, color: s.colors[0] ?? "#888", isInterchange: s.lines.length > 1 },
          })),
        };
        map.addSource("stations", { type: "geojson", data: geojson });

        // ═══════════════════════════════════════════════════════════════════════════
        // METRO INTELLIGENCE LAYER - Integrated with 3D Digital Twin
        // ═══════════════════════════════════════════════════════════════════════════
        if (styleKey === "futuristic-3d") {
          // Wait for style to fully load before adding metro intelligence
          map.once("idle", () => {
            if (cancelled) return;
            const trainData = addMetroIntelligenceLayer(map, stations);
            
            // Add Digital Twin Intelligence System on top
            setTimeout(() => {
              if (!cancelled) {
                addDigitalTwinIntelligence(map, stations);
                
                // Add Urban Entity Behavior Engine
                setTimeout(() => {
                  if (!cancelled && trainData) {
                    addUrbanEntityBehavior(map, stations, trainData);
                  }
                }, 300);
              }
            }, 500); // Brief delay to ensure metro layer is ready
          });
        }

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

        map.on("click", "stations-circle", (e: any) => {
          const id = e.features?.[0]?.properties?.id;
          if (id) { 
            const s = MetroDataService.getStation(id); 
            if (s) {
              openStationSheet(s);
              
              // Zoom to the station with smooth animation
              const coordinates = e.lngLat;
              const currentZoom = map.getZoom();
              const targetZoom = Math.max(15, currentZoom + 2);
              
              map.flyTo({
                center: [coordinates.lng, coordinates.lat],
                zoom: targetZoom,
                duration: 800,
                essential: true,
                curve: 1.2
              });
            }
          }
        });
        map.on("mouseenter", "stations-circle", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "stations-circle", () => { map.getCanvas().style.cursor = ""; });
      };
      
      map.on("load", () => { 
        if (cancelled) return; 
        setupLayers(map); 
        setReady(true); 
      });

      // Wait for style to fully load before applying futuristic styling
      console.log("🔍 MapPage: styleKey =", styleKey);
      if (styleKey === "futuristic-3d") {
        console.log("✅ Registering idle listener for futuristic-3d");
        map.once("idle", () => {
          if (cancelled) return;
          console.log("🎨 idle event fired - map is ready");
          if (!(map as any).__futuristicApplied) {
            console.log("🚀 Applying futuristic layers NOW");
            (map as any).__futuristicApplied = true;
            addFuturistic3DLayers(map);
          }
        });
      }

      mapRef.current = map;
    };

    initMap();
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleKey]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function addFuturistic3DLayers(map: any) {
    // ═══════════════════════════════════════════════════════════════════════════
    // FUTURISTIC DIGITAL TWIN VISUALIZATION
    // Priority: Buildings >>> Roads > Labels
    // Style: Dark premium smart city with subtle cyan accents
    // ═══════════════════════════════════════════════════════════════════════════

    // Wait for style to fully load before applying styling
    const applyFuturisticStyling = () => {
      console.log("🎨 Applying futuristic styling...");
      
      // ─── Camera: Cinematic 3D City Viewing ─────────────────────────────────────
      console.log("📹 Setting cinematic camera for 3D city...");
      map.setPitch(65);
      map.setBearing(-20);
      
      // Smooth zoom to showcase 3D depth
      const currentZoom = map.getZoom();
      if (currentZoom < 14) {
        map.easeTo({ 
          zoom: 14, 
          duration: 1500,
          pitch: 65,
          bearing: -20
        });
      }

      try {
        // ─── Background: Deep Navy Atmosphere with Subtle Contrast ───────────────
        if (map.getLayer("background")) {
          // Slightly lighter background for better building separation
          map.setPaintProperty("background", "background-color", "#040b16");
        }

        // ─── Debug: Log all layer IDs ─────────────────────────────────────────────
        const allLayers = map.getStyle()?.layers || [];
        console.log("All layer IDs:", allLayers.map((l: any) => l.id));
        console.log("Road layers:", allLayers.filter((l: any) => 
          l.type === "line" && (
            l.id.includes("road") || 
            l.id.includes("street") || 
            l.id.includes("highway") ||
            l.id.includes("motorway") ||
            l.id.includes("path") ||
            l.id.includes("transportation")
          )
        ).map((l: any) => l.id));

      // ─── Roads: Hierarchical & Subtle ─────────────────────────────────────────
      const roadLayers = map.getStyle()?.layers?.filter((l: any) => 
        l.type === "line" && (
          l.id.includes("road") || 
          l.id.includes("street") || 
          l.id.includes("highway") ||
          l.id.includes("motorway") ||
          l.id.includes("path") ||
          l.id.includes("transportation")
        )
      ) || [];

      console.log(`Found ${roadLayers.length} road layers to style`);

      roadLayers.forEach((layer: any) => {
        try {
          const isHighway = layer.id.includes("motorway") || layer.id.includes("trunk");
          const isMain = layer.id.includes("primary") || layer.id.includes("secondary");
          const isMinor = layer.id.includes("tertiary") || layer.id.includes("minor");
          
          console.log(`Styling road layer: ${layer.id}`);
          
          if (isHighway) {
            map.setPaintProperty(layer.id, "line-color", "#2d4a62");
            map.setPaintProperty(layer.id, "line-opacity", 0.65);
            map.setPaintProperty(layer.id, "line-width", [
              "interpolate", ["linear"], ["zoom"],
              10, 1.5,
              14, 2.5,
              18, 4
            ]);
          } else if (isMain) {
            map.setPaintProperty(layer.id, "line-color", "#243a52");
            map.setPaintProperty(layer.id, "line-opacity", 0.5);
            map.setPaintProperty(layer.id, "line-width", [
              "interpolate", ["linear"], ["zoom"],
              10, 0.8,
              14, 1.5,
              18, 2.5
            ]);
          } else if (isMinor) {
            map.setPaintProperty(layer.id, "line-color", "#1a2d42");
            map.setPaintProperty(layer.id, "line-opacity", 0.35);
            map.setPaintProperty(layer.id, "line-width", [
              "interpolate", ["linear"], ["zoom"],
              10, 0.3,
              14, 0.8,
              18, 1.2
            ]);
          } else {
            map.setPaintProperty(layer.id, "line-color", "#12233a");
            map.setPaintProperty(layer.id, "line-opacity", 0.25);
          }
        } catch (e) {
          console.warn(`Failed to style layer ${layer.id}:`, e);
        }
      });

      // ─── Labels: Minimal & Professional ───────────────────────────────────────
      const allSymbolLayers = map.getStyle()?.layers?.filter((l: any) => l.type === "symbol") || [];
      const labelLayers = allSymbolLayers.filter((l: any) => !l.id.includes("stations"));

      console.log(`🏷️ Total symbol layers: ${allSymbolLayers.length}`);
      console.log(`🏷️ Non-station labels: ${labelLayers.length}`);
      console.log("Label layer IDs:", labelLayers.map((l: any) => l.id));

      if (labelLayers.length === 0) {
        console.warn("⚠️ No label layers found! Style might not have text layers.");
      }

      labelLayers.forEach((layer: any) => {
        try {
          console.log(`Processing label: ${layer.id}`);
          
          // FORCE all text layers to be visible
          if (layer.layout?.['text-field']) {
            map.setLayoutProperty(layer.id, 'visibility', 'visible');
            map.setPaintProperty(layer.id, "text-opacity", 0.7);
            map.setPaintProperty(layer.id, "text-color", "#7a94ab");
            map.setPaintProperty(layer.id, "text-halo-color", "#050a12");
            map.setPaintProperty(layer.id, "text-halo-width", 1.5);
            console.log(`✅ Forced ${layer.id} visible`);
          }
          
          // Also handle icons
          if (layer.layout?.['icon-image']) {
            map.setPaintProperty(layer.id, "icon-opacity", 0.5);
          }
        } catch (e) {
          console.error(`❌ Failed to style label ${layer.id}:`, e);
        }
      });

      // ─── Water: Dark Reflective Surface ───────────────────────────────────────
      const waterLayers = map.getStyle()?.layers?.filter((l: any) => 
        l.id.includes("water") || l.id.includes("ocean") || l.id.includes("river")
      ) || [];

      waterLayers.forEach((layer: any) => {
        try {
          map.setPaintProperty(layer.id, "fill-color", "#0a1420");
          map.setPaintProperty(layer.id, "fill-opacity", 0.9);
        } catch (e) {
          // Silent fail
        }
      });

      // ─── Landuse: Simplified & Dark ───────────────────────────────────────────
      const landuseayers = map.getStyle()?.layers?.filter((l: any) => 
        l.id.includes("landuse") || l.id.includes("landcover")
      ) || [];

      landuseayers.forEach((layer: any) => {
        try {
          map.setPaintProperty(layer.id, "fill-color", "#0d1520");
          map.setPaintProperty(layer.id, "fill-opacity", 0.6);
        } catch (e) {
          // Silent fail
        }
      });

    } catch (error) {
      console.warn("Futuristic layer styling warning:", error);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 3D BUILDINGS: THE MAIN VISUAL ELEMENT
    // Premium Futuristic Digital Twin Visualization
    // ═══════════════════════════════════════════════════════════════════════════
    try {
      const style = map.getStyle();
      const sources = style?.sources || {};
      
      console.log("🏗️ Building Analysis:");
      console.log("Available sources:", Object.keys(sources));
      
      // Find vector tile source (usually openmaptiles or similar)
      const vectorSourceName = Object.keys(sources).find(s => 
        sources[s].type === "vector" && !s.includes("stations")
      );
      
      if (!vectorSourceName) {
        console.warn("❌ No vector tile source found for buildings");
        return;
      }
      
      console.log("✅ Using vector source:", vectorSourceName);
      
      // Find existing building layers to understand the source-layer structure
      const existingBuildingLayers = style?.layers?.filter((l: any) => 
        l.source === vectorSourceName && 
        l["source-layer"] &&
        (l["source-layer"].includes("building") || l.id.includes("building"))
      ) || [];
      
      console.log("📋 Existing building layers:", existingBuildingLayers.map((l: any) => ({
        id: l.id,
        sourceLayer: l["source-layer"],
        type: l.type
      })));
      
      // Determine source-layer name
      let buildingSourceLayer = "building";
      if (existingBuildingLayers.length > 0) {
        buildingSourceLayer = existingBuildingLayers[0]["source-layer"];
      }
      
      console.log("🎯 Using source-layer:", buildingSourceLayer);

      // ─── ROBUST HEIGHT EXPRESSION ────────────────────────────────────────────
      // Priority: 
      // 1. render_height (meters)
      // 2. height (meters)  
      // 3. building:levels * 3.5 meters per floor
      // 4. levels * 3.5 meters per floor
      // 5. Default: 15 meters (strong minimum for visibility)
      
      const heightExpression: any = [
        "case",
        ["has", "render_height"], ["get", "render_height"],
        ["has", "height"], ["get", "height"],
        ["has", "building:levels"], ["*", ["get", "building:levels"], 3.5],
        ["has", "levels"], ["*", ["get", "levels"], 3.5],
        15  // Strong default - every building MUST be visible
      ];

      console.log("📏 Height expression configured with fallbacks");

      // ─── Main 3D Building Layer: Premium Architectural Visualization ─────────
      map.addLayer({
        id: "futuristic-3d-buildings",
        type: "fill-extrusion",
        source: vectorSourceName,
        "source-layer": buildingSourceLayer,
        minzoom: 10, // Lower minzoom to show more buildings
        paint: {
          // PREMIUM ARCHITECTURAL MATERIAL
          // Richer dark graphite with improved depth perception
          // Vertical gradient creates natural roof illumination
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            heightExpression,
            0, "#06090f",      // Very low: deep black foundation
            8, "#08111c",      // Low: rich graphite base
            15, "#0a1620",     // Low-medium: dark architectural gray
            25, "#0d1d2e",     // Medium: deep navy graphite
            40, "#11263c",     // Medium-tall: structured navy
            60, "#152f4a",     // Tall: defined navy depth
            90, "#1a3858",     // Very tall: prominent navy
            120, "#1f4266"     // Landmarks: distinguished presence
          ],
          
          // HEIGHT with natural scaling for realistic depth
          "fill-extrusion-height": [
            "interpolate",
            ["linear"],
            ["zoom"],
            12, 0,
            13, ["*", heightExpression, 0.3],
            14, ["*", heightExpression, 0.8],
            15, heightExpression,
            18, ["*", heightExpression, 1.3]
          ],
          
          // Base elevation
          "fill-extrusion-base": 0,
          
          // Maximum opacity for solid architectural presence
          "fill-extrusion-opacity": 1.0,
          
          // CRITICAL: Vertical gradient for realistic roof illumination
          // Creates premium architectural depth: dark walls + illuminated roofs
          "fill-extrusion-vertical-gradient": true
        }
      }, "stations-glow");

      console.log("✅ Premium architectural buildings rendered");

      // ─── Move Labels Above Buildings ──────────────────────────────────────────
      // Fix z-index: Labels should be on top of 3D buildings
      const allLabelLayers = map.getStyle()?.layers?.filter((l: any) => 
        l.type === "symbol" && l.layout?.['text-field']
      ) || [];
      
      console.log(`📌 Moving ${allLabelLayers.length} label layers above buildings...`);
      allLabelLayers.forEach((layer: any) => {
        try {
          map.moveLayer(layer.id);
          console.log(`✅ Moved ${layer.id} to top`);
        } catch (e) {
          console.warn(`⚠️ Could not move ${layer.id}:`, e);
        }
      });

      // ─── Building Edge Enhancement: Refined Silhouette Definition ────────────
      map.addLayer({
        id: "futuristic-building-edges",
        type: "line",
        source: vectorSourceName,
        "source-layer": buildingSourceLayer,
        minzoom: 15, // Only at closer zoom for subtlety
        paint: {
          // ULTRA-SUBTLE EDGES - Premium scan aesthetic
          "line-color": [
            "interpolate",
            ["linear"],
            heightExpression,
            0, "#0f1a28",      // Low: barely visible
            20, "#12202f",     // Low-medium: subtle presence
            40, "#152536",     // Medium: refined edge  
            70, "#182a3d",     // Tall: clear definition
            120, "#1b2f44"     // Landmarks: distinguished outline
          ],
          // MINIMAL OPACITY - Production quality subtlety
          "line-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15, 0.08,
            16, 0.12,
            18, 0.16
          ],
          // PRECISE WIDTH - Architectural precision
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15, 0.25,
            16, 0.35,
            18, 0.45
          ]
        }
      }, "stations-glow");

      console.log("✅ Refined building silhouettes added");
      console.log("🎬 Premium architectural visualization complete");


    } catch (error) {
      console.error("❌ Failed to add 3D buildings:", error);
    }

    // ─── Reduce Station Dominance ──────────────────────────────────────────────
    try {
      if (map.getLayer("stations-glow")) {
        map.setPaintProperty("stations-glow", "circle-radius", [
          "interpolate",
          ["linear"],
          ["zoom"],
          10, 8,
          14, 12,
          18, 18
        ]);
        map.setPaintProperty("stations-glow", "circle-opacity", 0.2);
        map.setPaintProperty("stations-glow", "circle-color", "#0ea5e9");
        map.setPaintProperty("stations-glow", "circle-blur", 0.8);
      }
      
      if (map.getLayer("stations-circle")) {
        map.setPaintProperty("stations-circle", "circle-radius", [
          "interpolate",
          ["linear"],
          ["zoom"],
          10, 3,
          14, 4,
          18, 6
        ]);
        map.setPaintProperty("stations-circle", "circle-stroke-color", "#0ea5e9");
        map.setPaintProperty("stations-circle", "circle-stroke-width", [
          "interpolate",
          ["linear"],
          ["zoom"],
          10, 1.5,
          14, 2,
          18, 2.5
        ]);
      }

      if (map.getLayer("stations-label")) {
        map.setPaintProperty("stations-label", "text-color", "#e0f2fe");
        map.setPaintProperty("stations-label", "text-halo-color", "#0a1428");
        map.setPaintProperty("stations-label", "text-halo-width", 2);
      }
    } catch (error) {
      console.warn("Could not enhance station styling:", error);
    }
    };

    // Check if style is already loaded
    if (map.isStyleLoaded()) {
      console.log("✅ Style already loaded, applying immediately");
      applyFuturisticStyling();
    } else {
      console.log("⏳ Waiting for style to load...");
      map.once("idle", () => {
        console.log("✅ Style loaded via idle event");
        applyFuturisticStyling();
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function addMetroIntelligenceLayer(map: any, stations: any[]) {
    console.log("🚇 Adding Metro Intelligence Layer...");

    try {
      // ═══════════════════════════════════════════════════════════════════════════
      // METRO INTELLIGENCE LAYER - Digital Twin Integration
      // Animated metro lines + subtle station pulses + train-ready architecture
      // Premium dark style integrated with 3D city
      // ═══════════════════════════════════════════════════════════════════════════

      // ─── Build Metro Line Connections ──────────────────────────────────────────
      // Group stations by line and create connected segments
      const lineSegments: Record<number, any[]> = {};
      
      console.log("🔍 Building metro line segments...");
      let skippedStations = 0;
      let validSegments = 0;
      
      stations.forEach(station => {
        // Validate station coordinates
        if (!station.coordinates || 
            station.coordinates.lat === 0 || 
            station.coordinates.lng === 0 ||
            !isFinite(station.coordinates.lat) ||
            !isFinite(station.coordinates.lng)) {
          console.warn(`⚠️ Skipping station ${station.id} - Invalid coordinates:`, station.coordinates);
          skippedStations++;
          return; // Skip stations with invalid coordinates
        }

        station.lines.forEach((lineId: number) => {
          if (!lineSegments[lineId]) lineSegments[lineId] = [];
          
          // Find connected stations on the same line
          station.connectedStationIds?.forEach((connectedId: string) => {
            const connectedStation = stations.find(s => s.id === connectedId);
            
            // Validate connected station and its coordinates
            if (connectedStation && 
                connectedStation.lines.includes(lineId) &&
                connectedStation.coordinates &&
                connectedStation.coordinates.lat !== 0 &&
                connectedStation.coordinates.lng !== 0 &&
                isFinite(connectedStation.coordinates.lat) &&
                isFinite(connectedStation.coordinates.lng)) {
              
              const coords = [
                [station.coordinates.lng, station.coordinates.lat],
                [connectedStation.coordinates.lng, connectedStation.coordinates.lat]
              ];
              
              // Final validation: ensure all coordinate values are valid numbers
              const allCoordsValid = coords.every(coord => 
                coord.every(val => typeof val === 'number' && isFinite(val) && val !== 0)
              );
              
              if (!allCoordsValid) {
                console.error(`❌ Invalid coordinates in segment ${station.id} -> ${connectedId}:`, coords);
                return;
              }
              
              lineSegments[lineId].push({
                type: "Feature" as const,
                geometry: {
                  type: "LineString" as const,
                  coordinates: coords
                },
                properties: {
                  lineId,
                  color: station.colors[station.lines.indexOf(lineId)] || LINE_COLORS[lineId] || "#888",
                  from: station.id,
                  to: connectedId
                }
              });
              validSegments++;
            }
          });
        });
      });
      
      console.log(`✅ Built ${validSegments} valid line segments, skipped ${skippedStations} invalid stations`);

      // ─── Metro Lines: Premium Digital Twin Network ────────────────────────────
      Object.keys(lineSegments).forEach(lineId => {
        const segments = lineSegments[Number(lineId)];
        if (segments.length === 0) {
          console.warn(`⚠️ No segments for line ${lineId}`);
          return;
        }

        console.log(`🎨 Adding line ${lineId} with ${segments.length} segments`);
        
        const lineColor = segments[0].properties.color;
        const sourceId = `metro-line-${lineId}`;
        const layerId = `metro-line-layer-${lineId}`;
        const glowLayerId = `metro-line-glow-${lineId}`;
        const animLayerId = `metro-line-anim-${lineId}`;

        // Validate GeoJSON before adding
        const geojson = {
          type: "FeatureCollection" as const,
          features: segments
        };
        
        try {
          // Add source
          map.addSource(sourceId, {
            type: "geojson",
            data: geojson
          });

          // Wide soft glow (integrated atmospheric presence)
          map.addLayer({
            id: glowLayerId,
            type: "line",
            source: sourceId,
            paint: {
              "line-color": lineColor,
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                10, 12,
                14, 18,
                18, 26
              ],
              "line-opacity": 0.03, // Reduced for hierarchy
              "line-blur": 10 // Increased blur for atmospheric integration
            }
          }, "stations-glow");

          // Core line (refined minimal precision)
          map.addLayer({
            id: layerId,
            type: "line",
            source: sourceId,
            paint: {
              "line-color": lineColor,
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                10, 1.5,
                14, 2,
                18, 2.5
              ],
              "line-opacity": 0.28 // Reduced to let city dominate
            }
          }, "stations-glow");

          // Subtle animated intelligence flow
          map.addLayer({
            id: animLayerId,
            type: "line",
            source: sourceId,
            paint: {
              "line-color": lineColor,
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                10, 1,
                14, 1.5,
                18, 2
              ],
              "line-opacity": 0.18, // Further reduced for subtlety
              "line-blur": 2.5 // Softer for atmospheric feel
            }
          }, "stations-glow");

          console.log(`✅ Added metro line ${lineId} with animation`);
        } catch (error) {
          console.error(`❌ Failed to add line ${lineId}:`, error);
        }
      });

      // ─── Animate Metro Lines ───────────────────────────────────────────────────
      // Calm professional intelligence flow
      let linePulsePhase = 0;
      const animateMetroLines = () => {
        linePulsePhase = (linePulsePhase + 0.008) % (Math.PI * 2); // Slower
        
        Object.keys(lineSegments).forEach(lineId => {
          const animLayerId = `metro-line-anim-${lineId}`;
          if (map.getLayer(animLayerId)) {
            try {
              // Minimal pulse: 0.15 to 0.21 opacity (very calm)
              const opacity = 0.18 + Math.sin(linePulsePhase) * 0.03;
              map.setPaintProperty(animLayerId, "line-opacity", opacity);
            } catch (error) {
              console.error(`❌ Animation error for line ${lineId}:`, error);
            }
          }
        });

        if (map && !map._removed) {
          requestAnimationFrame(animateMetroLines);
        }
      };
      animateMetroLines();

      // ─── Station Markers: Hierarchical Digital Twin Nodes ─────────────────────
      // Refined hierarchy: interchange stations vs regular stations
      const stationPulseSource = {
        type: "FeatureCollection" as const,
        features: stations.map(s => ({
          type: "Feature" as const,
          geometry: { 
            type: "Point" as const, 
            coordinates: [s.coordinates.lng, s.coordinates.lat] 
          },
          properties: {
            id: s.id,
            color: s.colors[0] || "#0ea5e9",
            isInterchange: s.lines.length > 1
          }
        }))
      };

      map.addSource("metro-station-pulses", {
        type: "geojson",
        data: stationPulseSource
      });

      // Wide atmospheric presence (ultra-subtle)
      map.addLayer({
        id: "metro-station-pulse-outer",
        type: "circle",
        source: "metro-station-pulses",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, ["case", ["get", "isInterchange"], 14, 10],
            14, ["case", ["get", "isInterchange"], 20, 14],
            18, ["case", ["get", "isInterchange"], 28, 20]
          ],
          "circle-color": ["get", "color"],
          "circle-opacity": 0.04, // Reduced for hierarchy
          "circle-blur": 1.2
        }
      }, "stations-glow");

      // Precise core marker (refined sizing)
      map.addLayer({
        id: "metro-station-pulse-inner",
        type: "circle",
        source: "metro-station-pulses",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, ["case", ["get", "isInterchange"], 3, 2],
            14, ["case", ["get", "isInterchange"], 4.5, 3],
            18, ["case", ["get", "isInterchange"], 6.5, 4.5]
          ],
          "circle-color": ["get", "color"],
          "circle-opacity": 0.35, // Refined for balance
          "circle-blur": 0.4
        }
      }, "stations-glow");

      // Calm breathing animation (production quality)
      let pulsePhase = 0;
      const animateStationPulses = () => {
        pulsePhase = (pulsePhase + 0.012) % (Math.PI * 2);
        const pulseScale = 0.92 + Math.sin(pulsePhase) * 0.08; // 0.84 to 1.0 (calmer)
        const pulseOpacity = 0.04 + Math.sin(pulsePhase) * 0.015; // 0.025 to 0.055

        if (map.getLayer("metro-station-pulse-outer")) {
          const baseRadii = [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, ["case", ["get", "isInterchange"], 14 * pulseScale, 10 * pulseScale],
            14, ["case", ["get", "isInterchange"], 20 * pulseScale, 14 * pulseScale],
            18, ["case", ["get", "isInterchange"], 28 * pulseScale, 20 * pulseScale]
          ];
          map.setPaintProperty("metro-station-pulse-outer", "circle-radius", baseRadii);
          map.setPaintProperty("metro-station-pulse-outer", "circle-opacity", pulseOpacity);
        }

        if (map && !map._removed) {
          requestAnimationFrame(animateStationPulses);
        }
      };
      animateStationPulses();

      console.log("🚇 Metro Intelligence Layer complete");
      console.log("✅ Animated metro lines + station pulses integrated");

      // ═══════════════════════════════════════════════════════════════════════════
      // ─── Metro Train Simulation v1 ─────────────────────────────────────────────
      // ═══════════════════════════════════════════════════════════════════════════
      console.log("🚆 Initializing Metro Train Simulation...");

      // Build continuous path geometries for each metro line
      const metroLinePaths: Record<number, { coordinates: [number, number][]; stationIds: string[] }> = {};
      
      Object.keys(lineSegments).forEach(lineId => {
        const segments = lineSegments[Number(lineId)];
        if (segments.length === 0) return;

        // Extract unique stations along the line
        const stationSet = new Set<string>();
        const coordMap: Record<string, [number, number]> = {};
        
        segments.forEach(segment => {
          const from = segment.properties.from;
          const to = segment.properties.to;
          stationSet.add(from);
          stationSet.add(to);
          
          const [fromCoord, toCoord] = segment.geometry.coordinates;
          coordMap[from] = fromCoord as [number, number];
          coordMap[to] = toCoord as [number, number];
        });

        // Build ordered path (simple approach: use first station and follow connections)
        const stationIds = Array.from(stationSet);
        const path: [number, number][] = [];
        const visited = new Set<string>();
        
        // Start from first station
        let current = stationIds[0];
        while (current && visited.size < stationIds.length) {
          visited.add(current);
          const coord = coordMap[current];
          if (coord) path.push(coord);
          
          // Find next connected station
          const nextSegment = segments.find(s => 
            (s.properties.from === current && !visited.has(s.properties.to)) ||
            (s.properties.to === current && !visited.has(s.properties.from))
          );
          
          if (nextSegment) {
            current = nextSegment.properties.from === current ? 
              nextSegment.properties.to : nextSegment.properties.from;
          } else {
            break;
          }
        }

        metroLinePaths[Number(lineId)] = { 
          coordinates: path,
          stationIds: Array.from(visited)
        };
      });

      // Initialize train positions for each line
      interface TrainState {
        lineId: number;
        position: number; // 0 to 1 along path
        speed: number; // units per frame
        color: string;
        direction: 1 | -1;
      }

      const trains: TrainState[] = [];
      
      Object.keys(metroLinePaths).forEach(lineId => {
        const path = metroLinePaths[Number(lineId)];
        if (path.coordinates.length < 2) return;

        const segments = lineSegments[Number(lineId)];
        const color = segments[0]?.properties.color || "#0ea5e9";

        // Create 2-3 trains per line with staggered positions
        const trainsPerLine = Math.min(3, Math.max(2, Math.floor(path.coordinates.length / 8)));
        
        for (let i = 0; i < trainsPerLine; i++) {
          trains.push({
            lineId: Number(lineId),
            position: i / trainsPerLine,
            speed: 0.0008 + Math.random() * 0.0004, // Varied speeds
            color,
            direction: i % 2 === 0 ? 1 : -1 // Alternate directions
          });
        }
      });

      console.log(`🚆 Created ${trains.length} trains across ${Object.keys(metroLinePaths).length} lines`);

      // Create GeoJSON source for train positions
      const trainSource = {
        type: "FeatureCollection" as const,
        features: trains.map((train, idx) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [0, 0] // Will be updated in animation
          },
          properties: {
            id: `train-${train.lineId}-${idx}`,
            color: train.color,
            lineId: train.lineId
          }
        }))
      };

      map.addSource("metro-trains", {
        type: "geojson",
        data: trainSource
      });

      // Wide soft glow (energy signature)
      map.addLayer({
        id: "metro-train-glow",
        type: "circle",
        source: "metro-trains",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 12,
            14, 18,
            18, 26
          ],
          "circle-color": ["get", "color"],
          "circle-opacity": 0.08,
          "circle-blur": 1.2
        }
      });

      // Core energy point
      map.addLayer({
        id: "metro-train-core",
        type: "circle",
        source: "metro-trains",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 3,
            14, 4,
            18, 5
          ],
          "circle-color": "#ffffff",
          "circle-opacity": 0.7,
          "circle-blur": 0.3
        }
      });

      // Animate trains along paths
      const animateTrains = () => {
        // Update each train position
        trains.forEach((train, idx) => {
          const path = metroLinePaths[train.lineId];
          if (!path || path.coordinates.length < 2) return;

          // Update position
          train.position += train.speed * train.direction;

          // Loop at path ends
          if (train.position > 1) {
            train.position = 0;
          } else if (train.position < 0) {
            train.position = 1;
          }

          // Calculate coordinate along path
          const totalSegments = path.coordinates.length - 1;
          const floatIndex = train.position * totalSegments;
          const segmentIndex = Math.floor(floatIndex);
          const segmentProgress = floatIndex - segmentIndex;

          const startCoord = path.coordinates[segmentIndex];
          const endCoord = path.coordinates[Math.min(segmentIndex + 1, path.coordinates.length - 1)];

          if (startCoord && endCoord) {
            // Interpolate between points
            const lng = startCoord[0] + (endCoord[0] - startCoord[0]) * segmentProgress;
            const lat = startCoord[1] + (endCoord[1] - startCoord[1]) * segmentProgress;

            trainSource.features[idx].geometry.coordinates = [lng, lat];
            
            // Store current train position for Urban Entity Behavior Engine
            const props = trainSource.features[idx].properties as any;
            props.currentLng = lng;
            props.currentLat = lat;
            props.segmentProgress = segmentProgress;
            props.nearStation = false;

            // Check if near station (for intelligent station behavior)
            const distanceThreshold = 0.15; // 15% of segment for approach detection
            if (segmentProgress < distanceThreshold || segmentProgress > (1 - distanceThreshold)) {
              props.nearStation = true;
              
              // Identify which station is nearby
              const nearStationCoord = segmentProgress < distanceThreshold ? startCoord : endCoord;
              props.nearStationCoord = nearStationCoord;
            }
          }
        });

        // Update source
        const source = map.getSource("metro-trains") as maplibregl.GeoJSONSource;
        if (source) {
          source.setData(trainSource);
        }

        if (map && !map._removed) {
          requestAnimationFrame(animateTrains);
        }
      };

      animateTrains();

      console.log("🚆 Metro Train Simulation active");
      console.log("✅ Living digital twin - metro infrastructure is alive");
      
      // Return train data for Urban Entity Behavior Engine
      return {
        trains,
        trainSource,
        metroLinePaths
      };

    } catch (error) {
      console.error("❌ Failed to add Metro Intelligence Layer:", error);
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── DIGITAL TWIN INTELLIGENCE SYSTEM ──────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  // Transforms the map from "3D night map" into "Living futuristic urban digital twin"
  // Adds intelligent visual layers without modifying existing geometry or UI
  
  function addDigitalTwinIntelligence(map: maplibregl.Map, stations: any[]) {
    try {
      console.log("🧠 Initializing Digital Twin Intelligence System...");

      // ═══════════════════════════════════════════════════════════════════════════
      // 1. DIGITAL TWIN GROUND LAYER - Subtle Data Surface
      // ═══════════════════════════════════════════════════════════════════════════
      
      // Create very subtle digital grid overlay
      const gridSize = 0.01; // ~1km grid cells
      const bounds = map.getBounds();
      const gridFeatures: any[] = [];
      
      const minLng = Math.floor(bounds.getWest() / gridSize) * gridSize;
      const maxLng = Math.ceil(bounds.getEast() / gridSize) * gridSize;
      const minLat = Math.floor(bounds.getSouth() / gridSize) * gridSize;
      const maxLat = Math.ceil(bounds.getNorth() / gridSize) * gridSize;
      
      // Horizontal lines
      for (let lat = minLat; lat <= maxLat; lat += gridSize) {
        gridFeatures.push({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [[minLng, lat], [maxLng, lat]]
          },
          properties: { type: "grid" }
        });
      }
      
      // Vertical lines
      for (let lng = minLng; lng <= maxLng; lng += gridSize) {
        gridFeatures.push({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [[lng, minLat], [lng, maxLat]]
          },
          properties: { type: "grid" }
        });
      }

      map.addSource("digital-ground-grid", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: gridFeatures
        }
      });

      map.addLayer({
        id: "digital-ground-grid-layer",
        type: "line",
        source: "digital-ground-grid",
        paint: {
          "line-color": "#0d3f5c",
          "line-width": 0.3,
          "line-opacity": 0.04
        }
      }, "futuristic-3d-buildings");

      console.log("✅ Added subtle digital ground grid");

      // ═══════════════════════════════════════════════════════════════════════════
      // 2. LANDMARK INTELLIGENCE SYSTEM - Milad Tower + Major Landmarks
      // ═══════════════════════════════════════════════════════════════════════════
      
      // Define major landmarks (coordinates approximate - can be refined)
      const landmarks = [
        {
          id: "milad-tower",
          name: "Milad Tower",
          nameFa: "برج میلاد",
          coordinates: [51.375, 35.745],
          importance: "critical",
          type: "tower"
        },
        {
          id: "azadi-tower",
          name: "Azadi Tower",
          nameFa: "برج آزادی",
          coordinates: [51.338, 35.700],
          importance: "high",
          type: "monument"
        }
      ];

      map.addSource("city-landmarks", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: landmarks.map(lm => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: lm.coordinates
            },
            properties: {
              id: lm.id,
              name: lm.name,
              nameFa: lm.nameFa,
              importance: lm.importance,
              type: lm.type
            }
          }))
        }
      });

      // Landmark awareness beacon (breathing effect)
      map.addLayer({
        id: "landmark-awareness-glow",
        type: "circle",
        source: "city-landmarks",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 40,
            14, 80,
            18, 140
          ],
          "circle-color": [
            "match",
            ["get", "importance"],
            "critical", "#1a4d6b",
            "high", "#153f58",
            "#122e45"
          ],
          "circle-opacity": 0.05,
          "circle-blur": 1.5
        }
      });

      // Landmark core beacon
      map.addLayer({
        id: "landmark-beacon-core",
        type: "circle",
        source: "city-landmarks",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 4,
            14, 6,
            18, 9
          ],
          "circle-color": "#2d5f7e",
          "circle-opacity": 0.3,
          "circle-blur": 0.5
        }
      });

      // Animate landmark breathing
      let landmarkPhase = 0;
      const animateLandmarks = () => {
        landmarkPhase = (landmarkPhase + 0.006) % (Math.PI * 2); // Slower
        const breathe = 0.04 + Math.sin(landmarkPhase) * 0.02; // 0.02 to 0.06 (calmer)

        if (map.getLayer("landmark-awareness-glow")) {
          map.setPaintProperty("landmark-awareness-glow", "circle-opacity", breathe);
        }

        if (map && !map._removed) {
          requestAnimationFrame(animateLandmarks);
        }
      };
      animateLandmarks();

      console.log("✅ Landmark intelligence system active");

      // ═══════════════════════════════════════════════════════════════════════════
      // 3. SMART STATION INTERACTION LAYER - Intelligent Station States
      // ═══════════════════════════════════════════════════════════════════════════
      
      // Enhance existing station markers with state system
      const stationStates: Record<string, "idle" | "train_approaching" | "train_arrival"> = {};
      
      // Initialize all stations as idle
      stations.forEach(s => stationStates[s.id] = "idle");

      // Add station interaction layer
      map.addSource("smart-stations", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: stations.map(s => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [s.coordinates.lng, s.coordinates.lat]
            },
            properties: {
              id: s.id,
              state: "idle",
              color: s.colors[0] || "#0ea5e9",
              isInterchange: s.lines.length > 1
            }
          }))
        }
      });

      // Smart station interaction ring (expands on activity)
      map.addLayer({
        id: "smart-station-interaction-ring",
        type: "circle",
        source: "smart-stations",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 15,
            14, 22,
            18, 32
          ],
          "circle-color": ["get", "color"],
          "circle-opacity": 0.03,
          "circle-stroke-width": 0.5,
          "circle-stroke-color": ["get", "color"],
          "circle-stroke-opacity": 0.15
        }
      });

      console.log("✅ Smart station interaction layer added");

      // ═══════════════════════════════════════════════════════════════════════════
      // 4. URBAN INTELLIGENCE LAYER - Building Activity States
      // ═══════════════════════════════════════════════════════════════════════════
      
      // Identify important buildings (interchange stations = important hubs)
      const importantBuildings = stations
        .filter(s => s.lines.length > 1)
        .map(s => ({
          coordinates: [s.coordinates.lng, s.coordinates.lat],
          id: s.id,
          name: s.name
        }));

      if (importantBuildings.length > 0) {
        map.addSource("urban-intelligence-zones", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: importantBuildings.map(building => ({
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: building.coordinates
              },
              properties: {
                id: building.id,
                name: building.name,
                activityLevel: 0.5
              }
            }))
          }
        });

        // Urban activity awareness field
        map.addLayer({
          id: "urban-awareness-field",
          type: "circle",
          source: "urban-intelligence-zones",
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              10, 60,
              14, 100,
              18, 160
            ],
            "circle-color": "#1a3d56",
            "circle-opacity": 0.04,
            "circle-blur": 2
          }
        });

        console.log("✅ Urban intelligence zones active");
      }

      // ═══════════════════════════════════════════════════════════════════════════
      // 5. ATMOSPHERIC DEPTH ENHANCEMENT - Scanning Texture Layer
      // ═══════════════════════════════════════════════════════════════════════════
      
      // Add scanning texture animation phase
      let scanPhase = 0;
      const animateScan = () => {
        scanPhase = (scanPhase + 0.008) % (Math.PI * 2); // Slower
        const scanIntensity = 0.025 + Math.sin(scanPhase) * 0.015; // 0.01 to 0.04 (reduced)

        // Modulate digital grid opacity for scanning effect
        if (map.getLayer("digital-ground-grid-layer")) {
          map.setPaintProperty("digital-ground-grid-layer", "line-opacity", scanIntensity);
        }

        // Modulate urban awareness field
        if (map.getLayer("urban-awareness-field")) {
          const fieldIntensity = 0.03 + Math.sin(scanPhase * 0.7) * 0.01; // Reduced
          map.setPaintProperty("urban-awareness-field", "circle-opacity", fieldIntensity);
        }

        if (map && !map._removed) {
          requestAnimationFrame(animateScan);
        }
      };
      animateScan();

      console.log("✅ Atmospheric scanning texture active");

      // ═══════════════════════════════════════════════════════════════════════════
      // 6. METRO TRAIN INTELLIGENCE ENHANCEMENT - Energy Trails
      // ═══════════════════════════════════════════════════════════════════════════
      
      // Add subtle trail effect to existing trains (refined)
      if (map.getLayer("metro-train-glow")) {
        // Balanced glow for nervous system effect
        map.setPaintProperty("metro-train-glow", "circle-opacity", 0.08); // Reduced
        map.setPaintProperty("metro-train-glow", "circle-blur", 1.8); // Softer
      }

      if (map.getLayer("metro-train-core")) {
        // Refined core brightness
        map.setPaintProperty("metro-train-core", "circle-opacity", 0.75); // Slightly reduced
      }

      console.log("✅ Metro train intelligence enhanced");

      // ═══════════════════════════════════════════════════════════════════════════
      // DIGITAL TWIN SYSTEM STATUS
      // ═══════════════════════════════════════════════════════════════════════════
      
      console.log("🧠 Digital Twin Intelligence System ACTIVE");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("✅ Digital ground layer: Subtle data surface");
      console.log("✅ Landmark intelligence: City awareness beacons");
      console.log("✅ Smart stations: Intelligent node states");
      console.log("✅ Urban intelligence: Building activity zones");
      console.log("✅ Atmospheric depth: Scanning texture animation");
      console.log("✅ Metro intelligence: Enhanced energy visualization");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("🌃 TEHRAN DIGITAL TWIN: Living futuristic urban system");

    } catch (error) {
      console.error("❌ Failed to initialize Digital Twin Intelligence:", error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── URBAN ENTITY BEHAVIOR ENGINE ──────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  // Transforms passive objects into living intelligent entities
  // Adds state-based behavior without modifying existing geometry
  
  function addUrbanEntityBehavior(map: maplibregl.Map, stations: any[], trainData: any) {
    try {
      console.log("🧬 Initializing Urban Entity Behavior Engine...");

      // ═══════════════════════════════════════════════════════════════════════════
      // ENTITY STATE SYSTEM - Core Architecture
      // ═══════════════════════════════════════════════════════════════════════════
      
      type StationState = "idle" | "train_approaching" | "train_arrival";
      
      interface UrbanEntity {
        id: string;
        type: "landmark" | "metro_station" | "transport_node" | "important_building";
        importance: number;
        activityLevel: number;
        state: string;
        position: [number, number];
        lastStateChange: number;
      }

      // Entity registry
      const entityRegistry: Record<string, UrbanEntity> = {};

      // Initialize station entities
      stations.forEach(station => {
        entityRegistry[station.id] = {
          id: station.id,
          type: "metro_station",
          importance: station.lines.length > 1 ? 0.8 : 0.5,
          activityLevel: 0.3,
          state: "idle",
          position: [station.coordinates.lng, station.coordinates.lat],
          lastStateChange: Date.now()
        };
      });

      console.log(`📊 Registered ${Object.keys(entityRegistry).length} urban entities`);

      // ═══════════════════════════════════════════════════════════════════════════
      // 1. INTELLIGENT STATION BEHAVIOR - Living Transport Nodes
      // ═══════════════════════════════════════════════════════════════════════════
      
      // Create station state visualization source
      const stationStateSource = {
        type: "FeatureCollection" as const,
        features: stations.map(s => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [s.coordinates.lng, s.coordinates.lat]
          },
          properties: {
            id: s.id,
            state: "idle",
            color: s.colors[0] || "#0ea5e9",
            activityLevel: 0.3,
            isInterchange: s.lines.length > 1
          }
        }))
      };

      map.addSource("station-behavior-state", {
        type: "geojson",
        data: stationStateSource
      });

      // Station behavior: Approach ring (expands when train approaching)
      map.addLayer({
        id: "station-approach-ring",
        type: "circle",
        source: "station-behavior-state",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 12,
            14, 18,
            18, 26
          ],
          "circle-color": ["get", "color"],
          "circle-opacity": 0.0, // Will be animated based on state
          "circle-stroke-width": 1,
          "circle-stroke-color": ["get", "color"],
          "circle-stroke-opacity": 0.0 // Will be animated
        }
      });

      // Station behavior: Energy pulse (shows activity level)
      map.addLayer({
        id: "station-energy-pulse",
        type: "circle",
        source: "station-behavior-state",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 8,
            14, 12,
            18, 18
          ],
          "circle-color": ["get", "color"],
          "circle-opacity": 0.15, // Base idle state
          "circle-blur": 0.8
        }
      });

      console.log("✅ Intelligent station behavior layers added");

      // ═══════════════════════════════════════════════════════════════════════════
      // 2. TRAIN TRAIL VISUALIZATION - City Nervous System
      // ═══════════════════════════════════════════════════════════════════════════
      
      if (trainData && trainData.trains) {
        // Create trail points for each train (5 points per trail)
        const trailPoints: any[] = [];
        const trailLength = 5;
        
        trainData.trains.forEach((train: any, trainIdx: number) => {
          for (let i = 0; i < trailLength; i++) {
            trailPoints.push({
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [0, 0] // Will be updated in animation
              },
              properties: {
                trainIdx,
                trailIdx: i,
                opacity: 1 - (i / trailLength), // Fade towards tail
                color: train.color
              }
            });
          }
        });

        map.addSource("train-trails", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: trailPoints
          }
        });

        // Trail visualization
        map.addLayer({
          id: "train-trail-glow",
          type: "circle",
          source: "train-trails",
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              10, 2,
              14, 3,
              18, 4
            ],
            "circle-color": ["get", "color"],
            "circle-opacity": [
              "*",
              ["get", "opacity"],
              0.3
            ],
            "circle-blur": 1.2
          }
        }, "metro-train-glow");

        console.log("✅ Train trail visualization added");
      }

      // ═══════════════════════════════════════════════════════════════════════════
      // 3. CITY PULSE SYSTEM - Global Urban Heartbeat
      // ═══════════════════════════════════════════════════════════════════════════
      
      let cityPulsePhase = 0;
      
      const animateCityPulse = () => {
        cityPulsePhase = (cityPulsePhase + 0.004) % (Math.PI * 2); // Slower
        
        // Modulate landmark awareness (calmer)
        if (map.getLayer("landmark-awareness-glow")) {
          const landmarkPulse = 0.04 + Math.sin(cityPulsePhase * 0.8) * 0.015; // Reduced
          map.setPaintProperty("landmark-awareness-glow", "circle-opacity", landmarkPulse);
        }
        
        // Modulate urban activity fields (subtler)
        if (map.getLayer("urban-awareness-field")) {
          const urbanPulse = 0.03 + Math.sin(cityPulsePhase * 1.2) * 0.01; // Reduced
          map.setPaintProperty("urban-awareness-field", "circle-opacity", urbanPulse);
        }

        if (map && !map._removed) {
          requestAnimationFrame(animateCityPulse);
        }
      };
      animateCityPulse();

      console.log("✅ City pulse system active");

      // ═══════════════════════════════════════════════════════════════════════════
      // 4. BEHAVIORAL ANIMATION ENGINE - State-based Intelligence
      // ═══════════════════════════════════════════════════════════════════════════
      
      let behaviorFrame = 0;
      
      const updateEntityBehavior = () => {
        behaviorFrame++;
        
        // Update station states based on train proximity
        if (trainData && trainData.trainSource) {
          const trains = trainData.trainSource.features;
          
          stations.forEach((station, stationIdx) => {
            const entity = entityRegistry[station.id];
            if (!entity) return;
            
            let nearestDistance = Infinity;
            let hasApproachingTrain = false;
            
            // Check distance to all trains on same line
            trains.forEach((train: any) => {
              if (!train.properties.nearStation) return;
              
              const trainPos = train.geometry.coordinates;
              const stationPos = [station.coordinates.lng, station.coordinates.lat];
              
              // Simple distance calculation
              const dx = trainPos[0] - stationPos[0];
              const dy = trainPos[1] - stationPos[1];
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < nearestDistance) {
                nearestDistance = distance;
              }
              
              // Approaching threshold
              if (distance < 0.005) { // ~500m
                hasApproachingTrain = true;
              }
            });
            
            // Update station state
            const currentState = entity.state;
            let newState: StationState = "idle";
            
            if (hasApproachingTrain) {
              if (nearestDistance < 0.002) { // ~200m - arrival
                newState = "train_arrival";
              } else {
                newState = "train_approaching";
              }
            }
            
            // State transition
            if (newState !== currentState) {
              entity.state = newState;
              entity.lastStateChange = Date.now();
              stationStateSource.features[stationIdx].properties.state = newState;
            }
            
            // Update activity level based on state
            let targetActivity = 0.3; // idle
            if (newState === "train_approaching") targetActivity = 0.6;
            if (newState === "train_arrival") targetActivity = 0.9;
            
            // Smooth transition
            const currentActivity = stationStateSource.features[stationIdx].properties.activityLevel;
            const newActivity = currentActivity + (targetActivity - currentActivity) * 0.1;
            stationStateSource.features[stationIdx].properties.activityLevel = newActivity;
          });
          
          // Update station visualization
          const stationSource = map.getSource("station-behavior-state") as maplibregl.GeoJSONSource;
          if (stationSource) {
            stationSource.setData(stationStateSource);
          }
        }
        
        // Animate station rings based on activity
        const stationPulse = Math.sin(behaviorFrame * 0.03);
        stations.forEach((_station, idx) => {
          const activity = stationStateSource.features[idx].properties.activityLevel;
          
          // Approach ring opacity (shows when train approaching)
          const ringOpacity = Math.max(0, (activity - 0.4) * 0.4); // 0 at idle, 0.2 at max
          const strokeOpacity = Math.max(0, (activity - 0.4) * 0.6);
          
          // Update via paint properties (affects all stations)
          if (map.getLayer("station-approach-ring") && idx === 0) {
            // Only update once per frame
            map.setPaintProperty("station-approach-ring", "circle-opacity", ringOpacity * (0.8 + stationPulse * 0.2));
            map.setPaintProperty("station-approach-ring", "circle-stroke-opacity", strokeOpacity);
          }
          
          // Energy pulse (breathing effect based on activity)
          const pulseOpacity = 0.15 + activity * 0.15 + stationPulse * 0.05;
          if (map.getLayer("station-energy-pulse") && idx === 0) {
            map.setPaintProperty("station-energy-pulse", "circle-opacity", pulseOpacity);
          }
        });
        
        // Update train trails
        if (trainData && trainData.trains && trainData.trainSource) {
          const trailSource = map.getSource("train-trails") as maplibregl.GeoJSONSource;
          if (trailSource) {
            const trailFeatures: any[] = [];
            const trailLength = 5;
            const trailSpacing = 0.02; // spacing along path
            
            trainData.trains.forEach((train: any, trainIdx: number) => {
              const path = trainData.metroLinePaths[train.lineId];
              if (!path || !path.coordinates) return;
              
              // Generate trail points behind train
              for (let i = 0; i < trailLength; i++) {
                let trailPos = train.position - (i * trailSpacing);
                
                // Wrap around
                if (trailPos < 0) trailPos += 1;
                if (trailPos > 1) trailPos -= 1;
                
                // Calculate trail point coordinate
                const totalSegments = path.coordinates.length - 1;
                const floatIndex = trailPos * totalSegments;
                const segmentIndex = Math.floor(floatIndex);
                const segmentProgress = floatIndex - segmentIndex;
                
                const startCoord = path.coordinates[segmentIndex];
                const endCoord = path.coordinates[Math.min(segmentIndex + 1, path.coordinates.length - 1)];
                
                if (startCoord && endCoord) {
                  const lng = startCoord[0] + (endCoord[0] - startCoord[0]) * segmentProgress;
                  const lat = startCoord[1] + (endCoord[1] - startCoord[1]) * segmentProgress;
                  
                  trailFeatures.push({
                    type: "Feature",
                    geometry: {
                      type: "Point",
                      coordinates: [lng, lat]
                    },
                    properties: {
                      trainIdx,
                      trailIdx: i,
                      opacity: 1 - (i / trailLength),
                      color: train.color
                    }
                  });
                }
              }
            });
            
            trailSource.setData({
              type: "FeatureCollection",
              features: trailFeatures
            });
          }
        }

        if (map && !map._removed) {
          requestAnimationFrame(updateEntityBehavior);
        }
      };
      
      updateEntityBehavior();

      console.log("✅ Behavioral animation engine active");

      // ═══════════════════════════════════════════════════════════════════════════
      // 5. INFRASTRUCTURE DATA FLOW - Smart City Nervous System
      // ═══════════════════════════════════════════════════════════════════════════
      
      // Create subtle data particles flowing along metro lines
      if (trainData && trainData.metroLinePaths) {
        const dataFlowParticles: any[] = [];
        const particlesPerLine = 8; // Subtle amount
        
        Object.keys(trainData.metroLinePaths).forEach(lineId => {
          const path = trainData.metroLinePaths[Number(lineId)];
          if (!path || !path.coordinates || path.coordinates.length < 2) return;
          
          for (let i = 0; i < particlesPerLine; i++) {
            dataFlowParticles.push({
              lineId: Number(lineId),
              position: i / particlesPerLine,
              speed: 0.0003 + Math.random() * 0.0002, // Very slow
              color: trainData.trains.find((t: any) => t.lineId === Number(lineId))?.color || "#0ea5e9"
            });
          }
        });

        const dataFlowSource = {
          type: "FeatureCollection" as const,
          features: dataFlowParticles.map((p, idx) => ({
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates: [0, 0]
            },
            properties: {
              id: `data-${idx}`,
              color: p.color,
              opacity: 0.4
            }
          }))
        };

        map.addSource("infrastructure-data-flow", {
          type: "geojson",
          data: dataFlowSource
        });

        // Ultra-subtle data particles
        map.addLayer({
          id: "data-flow-particles",
          type: "circle",
          source: "infrastructure-data-flow",
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              10, 1.5,
              14, 2,
              18, 2.5
            ],
            "circle-color": ["get", "color"],
            "circle-opacity": 0.15,
            "circle-blur": 0.8
          }
        }, "metro-train-glow");

        // Animate data flow particles
        const animateDataFlow = () => {
          dataFlowParticles.forEach((particle, idx) => {
            const path = trainData.metroLinePaths[particle.lineId];
            if (!path || !path.coordinates) return;

            particle.position = (particle.position + particle.speed) % 1;

            const totalSegments = path.coordinates.length - 1;
            const floatIndex = particle.position * totalSegments;
            const segmentIndex = Math.floor(floatIndex);
            const segmentProgress = floatIndex - segmentIndex;

            const startCoord = path.coordinates[segmentIndex];
            const endCoord = path.coordinates[Math.min(segmentIndex + 1, path.coordinates.length - 1)];

            if (startCoord && endCoord) {
              const lng = startCoord[0] + (endCoord[0] - startCoord[0]) * segmentProgress;
              const lat = startCoord[1] + (endCoord[1] - startCoord[1]) * segmentProgress;
              dataFlowSource.features[idx].geometry.coordinates = [lng, lat];
            }
          });

          const flowSource = map.getSource("infrastructure-data-flow") as maplibregl.GeoJSONSource;
          if (flowSource) {
            flowSource.setData(dataFlowSource);
          }

          if (map && !map._removed) {
            requestAnimationFrame(animateDataFlow);
          }
        };
        animateDataFlow();

        console.log("✅ Infrastructure data flow active");
      }

      // ═══════════════════════════════════════════════════════════════════════════
      // 6. DYNAMIC CITY ACTIVITY FIELDS - Invisible Intelligence Zones
      // ═══════════════════════════════════════════════════════════════════════════
      
      // Create activity intensity zones (not visible circles, but data presence)
      const activityZones = stations
        .filter(s => s.lines.length > 1) // Interchange stations
        .map(s => ({
          coordinates: [s.coordinates.lng, s.coordinates.lat],
          intensity: 0.5 + Math.random() * 0.3,
          phase: Math.random() * Math.PI * 2
        }));

      if (activityZones.length > 0) {
        map.addSource("city-activity-zones", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: activityZones.map((zone, idx) => ({
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: zone.coordinates
              },
              properties: {
                id: `activity-${idx}`,
                intensity: zone.intensity,
                phase: zone.phase
              }
            }))
          }
        });

        // Ultra-subtle atmospheric distortion (not circles)
        map.addLayer({
          id: "activity-field-distortion",
          type: "circle",
          source: "city-activity-zones",
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              10, 80,
              14, 130,
              18, 200
            ],
            "circle-color": "#0d2840",
            "circle-opacity": 0.02, // Almost invisible
            "circle-blur": 3
          }
        });

        // Animate activity field breathing
        let activityPhase = 0;
        const animateActivityFields = () => {
          activityPhase = (activityPhase + 0.003) % (Math.PI * 2);
          
          const breathe = 0.02 + Math.sin(activityPhase) * 0.01; // 0.01 to 0.03
          
          if (map.getLayer("activity-field-distortion")) {
            map.setPaintProperty("activity-field-distortion", "circle-opacity", breathe);
          }

          if (map && !map._removed) {
            requestAnimationFrame(animateActivityFields);
          }
        };
        animateActivityFields();

        console.log("✅ Dynamic city activity fields active");
      }

      // ═══════════════════════════════════════════════════════════════════════════
      // 7. DIGITAL TWIN ATMOSPHERIC SCAN LAYER - Continuous Monitoring
      // ═══════════════════════════════════════════════════════════════════════════
      
      // Create moving scan plane suggestion (not visible plane, but effect)
      let scanPlanePhase = 0;
      
      const animateScanPlane = () => {
        scanPlanePhase = (scanPlanePhase + 0.002) % (Math.PI * 2);
        
        // Modulate digital grid with scan effect
        if (map.getLayer("digital-ground-grid-layer")) {
          const scanIntensity = 0.04 + Math.sin(scanPlanePhase) * 0.015; // 0.025 to 0.055
          map.setPaintProperty("digital-ground-grid-layer", "line-opacity", scanIntensity);
        }

        // Occasional data refresh wave (every 20 seconds)
        const refreshWave = Math.abs(Math.sin(scanPlanePhase * 0.1));
        if (refreshWave > 0.95 && map.getLayer("activity-field-distortion")) {
          // Brief refresh pulse
          map.setPaintProperty("activity-field-distortion", "circle-opacity", 0.05);
        }

        if (map && !map._removed) {
          requestAnimationFrame(animateScanPlane);
        }
      };
      animateScanPlane();

      console.log("✅ Digital twin atmospheric scan layer active");

      // ═══════════════════════════════════════════════════════════════════════════
      // 8. URBAN TIME SIMULATION - Deterministic City Rhythm
      // ═══════════════════════════════════════════════════════════════════════════
      
      let urbanTimePhase = 0;
      
      const updateUrbanTime = () => {
        urbanTimePhase = (urbanTimePhase + 0.003) % (Math.PI * 2); // Slower
        
        // Activity changes (subtle deterministic wave)
        const activityWave = Math.sin(urbanTimePhase);
        
        // Infrastructure intensity modulation (refined)
        if (map.getLayer("metro-train-glow")) {
          const trainIntensity = 0.08 + activityWave * 0.015; // Reduced range
          map.setPaintProperty("metro-train-glow", "circle-opacity", trainIntensity);
        }

        // Station base activity (calmer)
        if (map.getLayer("station-energy-pulse")) {
          const stationBase = 0.15 + activityWave * 0.02; // Reduced
          map.setPaintProperty("station-energy-pulse", "circle-opacity", stationBase);
        }

        // Landmark awareness (minimal)
        if (map.getLayer("landmark-beacon-core")) {
          const landmarkActivity = 0.3 + activityWave * 0.03; // Reduced
          map.setPaintProperty("landmark-beacon-core", "circle-opacity", landmarkActivity);
        }

        if (map && !map._removed) {
          requestAnimationFrame(updateUrbanTime);
        }
      };
      updateUrbanTime();

      console.log("✅ Urban time simulation active");

      // ═══════════════════════════════════════════════════════════════════════════
      // 9. BUILDING INTELLIGENCE LAYER - Landmark Recognition
      // ═══════════════════════════════════════════════════════════════════════════
      
      // For major landmarks, add subtle material response
      // This layer suggests "the building is recognized by the system"
      
      // Milad Tower beacon (soft scientific recognition)
      map.addSource("landmark-recognition", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [51.375, 35.745] // Milad Tower
              },
              properties: {
                name: "Milad Tower",
                type: "critical_landmark"
              }
            }
          ]
        }
      });

      // Subtle scanning reflection layer
      map.addLayer({
        id: "landmark-scanning-field",
        type: "circle",
        source: "landmark-recognition",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 25,
            14, 45,
            18, 70
          ],
          "circle-color": "#1a4560",
          "circle-opacity": 0.03, // Almost imperceptible
          "circle-blur": 2.5
        }
      });

      // Animate landmark recognition
      let landmarkScanPhase = 0;
      const animateLandmarkScan = () => {
        landmarkScanPhase = (landmarkScanPhase + 0.006) % (Math.PI * 2);
        
        const scanReflection = 0.03 + Math.sin(landmarkScanPhase) * 0.015; // 0.015 to 0.045
        
        if (map.getLayer("landmark-scanning-field")) {
          map.setPaintProperty("landmark-scanning-field", "circle-opacity", scanReflection);
        }

        if (map && !map._removed) {
          requestAnimationFrame(animateLandmarkScan);
        }
      };
      animateLandmarkScan();

      console.log("✅ Building intelligence layer active");

      // ═══════════════════════════════════════════════════════════════════════════
      // 10. PREMIUM LANDMARK 3D SYSTEM - DEBUG MODE
      // ═══════════════════════════════════════════════════════════════════════════
      // Following official MapLibre CustomLayer pattern with full debugging
      
      // FILTERED DEBUG LOGGER
      const miladLog = {
        info: (...args: any[]) => console.log('%c[MILAD]', 'background: #2563eb; color: white; font-weight: bold; padding: 2px 6px; border-radius: 3px;', ...args),
        success: (...args: any[]) => console.log('%c[MILAD]', 'background: #16a34a; color: white; font-weight: bold; padding: 2px 6px; border-radius: 3px;', ...args),
        error: (...args: any[]) => console.error('%c[MILAD]', 'background: #dc2626; color: white; font-weight: bold; padding: 2px 6px; border-radius: 3px;', ...args),
        warn: (...args: any[]) => console.warn('%c[MILAD]', 'background: #ea580c; color: white; font-weight: bold; padding: 2px 6px; border-radius: 3px;', ...args),
      };
      
      try {
        miladLog.info("🏗️ Starting Milad Tower 3D integration (DEBUG MODE)...");
        
        // CRITICAL: Map is ALREADY idle at this point, execute immediately
        const add3DModel = () => {
          miladLog.success("✅ Executing 3D layer setup...");
        
        // Import Three.js and GLTFLoader
        import('three').then((THREE) => {
          import('three/examples/jsm/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
            
            // Milad Tower coordinates - FINAL OPTIMIZED POSITION
            const modelOrigin: [number, number] = [51.375377281551806, 35.74455351604652]; // Tuned via drag mode
            const modelAltitude = 0;
            // Try zero rotation first to see raw model orientation
            const modelRotate = [Math.PI / 2, 0, 0]; // X rotation needed for Z-up to Y-up conversion
            
            miladLog.info("📍 Model origin:", modelOrigin);
            
            // Convert to Mercator
            const modelAsMercatorCoordinate = maplibregl.MercatorCoordinate.fromLngLat(
              modelOrigin,
              modelAltitude
            );
            
            // Transformation parameters (following official pattern)
            const modelTransform = {
              translateX: modelAsMercatorCoordinate.x,
              translateY: modelAsMercatorCoordinate.y,
              translateZ: modelAsMercatorCoordinate.z,
              rotateX: modelRotate[0],
              rotateY: modelRotate[1],
              rotateZ: modelRotate[2],
              scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
            };
            
            miladLog.info("🔢 Transform:", {
              x: modelTransform.translateX.toFixed(6),
              y: modelTransform.translateY.toFixed(6),
              scale: modelTransform.scale.toExponential(4)
            });

            // Remove existing layer/source if present (reload safety)
            try { map.removeLayer('3d-model'); } catch(_) {}
            try { map.removeLayer('milad-circle'); } catch(_) {}
            try { map.removeSource('milad-marker'); } catch(_) {}

            // Custom Layer
            const customLayer: maplibregl.CustomLayerInterface = {
              id: '3d-model',
              type: 'custom',
              renderingMode: '3d',
              
              onAdd(this: any, map: maplibregl.Map, gl: WebGLRenderingContext) {
                miladLog.success("✅ onAdd() called - Three.js initializing");
                
                this.camera = new THREE.Camera();
                this.scene = new THREE.Scene();
                this.map = map;
                
                // TEST CUBE FIRST - 100m x 100m x 100m (in meter units)
                // REMOVED - cube test passed! Three.js rendering works.
                // miladLog.warn("🟥 Adding TEST RED CUBE");
                miladLog.success("✅ Skipping test cube - rendering pipeline confirmed working");

                // Lights for MeshStandardMaterial
                const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
                dirLight.position.set(100, 200, 100);
                this.scene.add(dirLight);
                const dirLight2 = new THREE.DirectionalLight(0x4a9eff, 0.8);
                dirLight2.position.set(-100, 100, -100);
                this.scene.add(dirLight2);
                const ambientLight = new THREE.AmbientLight(0x404060, 1.0);
                this.scene.add(ambientLight);

                // Renderer - share GL context
                this.renderer = new THREE.WebGLRenderer({
                  canvas: map.getCanvas(),
                  context: gl,
                  antialias: true
                });
                this.renderer.autoClear = false;
                miladLog.success("✅ Renderer ready");

                // Load GLB - using correct path
                miladLog.info("📦 Loading GLB: /assets/landmarks/miladtower.glb");
                const loader = new GLTFLoader();
                loader.load(
                  '/assets/landmarks/miladtower.glb',
                  (gltf) => {
                    miladLog.success("✅ GLB loaded!");
                    this.model = gltf.scene;

                    const box = new THREE.Box3().setFromObject(this.model);
                    const size = box.getSize(new THREE.Vector3());
                    miladLog.info("📦 MODEL SIZE:", size.x.toFixed(4), size.y.toFixed(4), size.z.toFixed(4));

                    // CORRECT scaling for MapLibre Mercator pipeline:
                    // modelTransform.scale = meterInMercatorCoordinateUnits (~3e-8)
                    // The render() multiplies everything by modelTransform.scale
                    // So model units must equal METERS (1 model unit = 1 meter)
                    // targetHeight(m) / modelHeight(units) = meters per unit
                    const modelHeight = Math.max(size.x, size.y, size.z);
                    
                    // FINAL SCALE: Optimized via drag mode
                    // Height: 1200m (2.76x real height for perfect coverage)
                    const targetHeight = 1200; // meters - final tuned value
                    const metersPerUnit = targetHeight / modelHeight;
                    
                    // UNIFORM SCALE: No special width multiplier needed
                    miladLog.info("📏 Final scale: UNIFORM");
                    miladLog.info(`   Height: ${targetHeight}m`);
                    
                    this.model.scale.setScalar(metersPerUnit);

                    // Apply NVIDIA Omniverse dark graphite material
                    miladLog.info("🎨 Applying premium dark graphite material");
                    this.model.traverse((obj: any) => {
                      if (obj.isMesh) {
                        obj.material = new THREE.MeshStandardMaterial({
                          color: 0x14263a,
                          metalness: 0.6,
                          roughness: 0.3,
                          emissive: 0x0a1a2d,
                          emissiveIntensity: 0.08
                        });
                      }
                    });

                    this.scene.add(this.model);
                    miladLog.success("✅ Model in scene. Total children:", this.scene.children.length);
                    
                    // ═══════════════════════════════════════════════════════════════
                    // DRAG MODE: Interactive GLB Positioning (Shift+D)
                    // ═══════════════════════════════════════════════════════════════
                    createGLBDragController({
                      map,
                      model: this.model,
                      modelHeight,
                      modelTransform,
                      maplibregl,
                      miladLog,
                      initialPosition: modelOrigin,
                      initialAltitude: modelAltitude,
                      targetHeight
                    });
                    
                    map.triggerRepaint();
                  },
                  undefined,
                  (err) => miladLog.error("❌ GLB failed:", err)
                );
              },

              render(this: any, _gl: WebGLRenderingContext | WebGL2RenderingContext, options: maplibregl.CustomRenderMethodInput) {
                if (!this.renderer) return;

                if (!this.renderCount) this.renderCount = 0;
                this.renderCount++;

                // Log first render options structure
                if (this.renderCount === 1) {
                  miladLog.success("🎬 FIRST RENDER - inspecting options:");
                  miladLog.info("   typeof options:", typeof options);
                  if (options) {
                    miladLog.info("   options keys:", JSON.stringify(Object.keys(options)));
                  }
                }

                // Extract matrix - MapLibre 5.24.0 uses modelViewProjectionMatrix (mat4 type)
                // mat4 is an array-like object from gl-matrix, convert to Array for Three.js
                const matrixArray = Array.from(options.modelViewProjectionMatrix);

                const rotX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1,0,0), modelTransform.rotateX);
                const rotY = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0,1,0), modelTransform.rotateY);
                const rotZ = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0,0,1), modelTransform.rotateZ);

                // modelTransform.scale = meterInMercatorCoordinateUnits
                // This converts meters → Mercator units in the projection matrix
                const m = new THREE.Matrix4().fromArray(matrixArray);
                const l = new THREE.Matrix4()
                  .makeTranslation(modelTransform.translateX, modelTransform.translateY, modelTransform.translateZ)
                  .scale(new THREE.Vector3(modelTransform.scale, -modelTransform.scale, modelTransform.scale))
                  .multiply(rotX).multiply(rotY).multiply(rotZ);

                this.camera.projectionMatrix = m.multiply(l);
                this.renderer.resetState();
                this.renderer.render(this.scene, this.camera);
                this.map.triggerRepaint();

                if (this.renderCount % 100 === 0) {
                  miladLog.info(`🔄 Render count: ${this.renderCount}`);
                  miladLog.info("   Scene children:", this.scene.children.length);
                  if (this.testCube) miladLog.info("   Test cube visible:", this.testCube.visible);
                }
              }
            };

            // Add layer with full error capture
            miladLog.info("➕ Attempting map.addLayer()...");
            try {
              map.addLayer(customLayer);
              miladLog.success("✅ map.addLayer() succeeded");
            } catch (layerErr) {
              miladLog.error("❌ map.addLayer() threw:", layerErr);
            }

            // Verify after 200ms
            setTimeout(() => {
              const exists = map.getStyle().layers.find(l => l.id === '3d-model');
              miladLog.info("🔍 Layer in style?", exists ? "✅ YES" : "❌ NO (custom layers not in style array - this is normal)");
            }, 200);
            
            miladLog.success("🏙️ Milad Tower 3D integration complete");
            
          }).catch(error => {
            miladLog.error("❌ GLTFLoader import failed:", error);
          });
        }).catch(error => {
          miladLog.error("❌ Three.js import failed:", error);
        });
        
        }; // End of add3DModel function
        
        // Map is ALREADY idle - execute immediately with small delay
        miladLog.info("⚡ Map already idle, executing in 500ms...");
        setTimeout(() => {
          add3DModel();
        }, 500);
        
      } catch (error) {
        miladLog.error("❌ Setup error:", error);
      }

      // ═══════════════════════════════════════════════════════════════════════════
      // URBAN ENTITY BEHAVIOR ENGINE STATUS
      // ═══════════════════════════════════════════════════════════════════════════
      
      console.log("🧬 Urban Entity Behavior Engine ACTIVE");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("✅ Entity state system: Architecture initialized");
      console.log("✅ Intelligent stations: Train proximity detection");
      console.log("✅ Train trails: City nervous system visualization");
      console.log("✅ City pulse: Global urban heartbeat");
      console.log("✅ Behavior engine: State-based animation");
      console.log("✅ Infrastructure data flow: Smart city nervous system");
      console.log("✅ Dynamic activity fields: Invisible intelligence zones");
      console.log("✅ Atmospheric scan layer: Continuous monitoring");
      console.log("✅ Urban time simulation: Deterministic city rhythm");
      console.log("✅ Building intelligence: Landmark recognition");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("🏙️ DIGITAL TWIN COMMAND CENTER: City understands itself");

    } catch (error) {
      console.error("❌ Failed to initialize Urban Entity Behavior:", error);
    }
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
