/**
 * HomePage — Main landing page of Tehran Metro app.
 * Apple Maps + Linear inspired design.
 */
import { useState, useRef, useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Search, Navigation, Star, Clock, ArrowLeftRight, MapPin, Zap, LocateFixed, Send,
  Flag, TrainFront, Activity, GitBranch,
} from "lucide-react";
import { useMetroStore } from "@/store/metro.store";
import { MetroDataService } from "@/services/metro-data.service";
import { MetroRouteService } from "@/services/metro-route.service";
import { LineBadge } from "@/components/shared/LineBadge";
import { MetroLinesAnimation } from "@/components/ui/metro-lines-animation";
import { ParticlesNetworkBackdrop } from "@/components/ui/particles-network-backdrop";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useThemeMode } from "@/hooks/useThemeMode";
import type { Station } from "@/types/metro";
import { cn } from "@/lib/utils";

// ─── Animation Variants ────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  }),
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

// ─── Home Page ────────────────────────────────────────────────────────────────

export function HomePage() {
  const { originStation, destinationStation, openSearch, swapOriginDestination } =
    useMetroStore();
  const stats = MetroDataService.getStats();
  const { isLight } = useThemeMode();

  return (
    <>
      {/* Mobile/Tablet Layout */}
      <div className="lg:hidden flex min-h-full flex-col pb-24" dir="rtl">
        {/* Hero Section */}
        <HeroSection stats={stats} />

        {/* Route Planner Card */}
        <motion.div
          className="px-4 -mt-4 sm:-mt-6 relative z-10"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
        >
          <RoutePlannerCard
            origin={originStation}
            destination={destinationStation}
            onOpenOrigin={() => openSearch("origin")}
            onOpenDestination={() => openSearch("destination")}
            onSwap={swapOriginDestination}
          />
        </motion.div>

        {/* Upper content */}
        <motion.div
          className="mt-6 px-4 space-y-6 relative z-10"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <NearbyStationsSection />
          <FavoritesSection />
        </motion.div>

        {/* Bottom zone — particles.js network (dark only) */}
        <div className="relative mt-4 flex-1 min-h-[180px] sm:min-h-[320px]">
          {!isLight && <ParticlesNetworkBackdrop />}
          <motion.div
            className="relative z-10 px-4 space-y-6 pb-6 pt-2"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <RecentRoutesSection />
            <QuickStatsSection stats={stats} />
          </motion.div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block min-h-screen" dir="rtl">
        {/* Hero Section - Full Width */}
        <DesktopHeroSection stats={stats} />

        {/* Main Content Grid */}
        <div className="mt-4 px-4 space-y-4">
          {/* Route Planner Card */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
          >
            <RoutePlannerCard
              origin={originStation}
              destination={destinationStation}
              onOpenOrigin={() => openSearch("origin")}
              onOpenDestination={() => openSearch("destination")}
              onSwap={swapOriginDestination}
            />
          </motion.div>

          {/* Current Stations */}
          <NearbyStationsSection />

          {/* Statistics - 4 columns */}
          <DesktopStatsSection stats={stats} />
        </div>
      </div>
    </>
  );
}

// ─── Desktop Hero Section ─────────────────────────────────────────────────

function DesktopHeroSection({ stats }: { stats: ReturnType<typeof MetroDataService.getStats> }) {
  const { isLight } = useThemeMode();

  return (
    <div
      className="relative overflow-hidden rounded-[28px] mx-4"
      style={{
        height: "300px",
        backgroundImage: isLight ? "url(/herosecLight1.png)" : "url(/herosecBack1.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: isLight
            ? "linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.30), rgba(255,255,255,0.05))"
            : "linear-gradient(90deg, rgba(3, 8, 23, 0.15), rgba(3, 8, 23, 0.35), rgba(3, 8, 23, 0.10))",
        }}
      />
      {isLight && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255,255,255,0.90), rgba(255,255,255,0.35) 45%, transparent 75%)",
            opacity: 0.55,
          }}
        />
      )}

      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none select-none">
        <MetroLinesAnimation className="w-full h-full" />
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center justify-center h-full px-8"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.div variants={fadeUp} custom={0} className="mb-4">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium"
            style={
              isLight
                ? {
                    background: "rgba(255,255,255,0.70)",
                    border: "1px solid rgba(124,92,252,0.18)",
                    color: "#6652D8",
                    boxShadow: "0 5px 20px rgba(90,80,180,0.06)",
                    backdropFilter: "blur(12px)",
                  }
                : {
                    background: "rgba(168, 85, 247, 0.12)",
                    border: "1px solid rgba(196, 181, 253, 0.35)",
                    color: "#C4B5FD",
                    boxShadow: "0 0 28px rgba(168, 85, 247, 0.18)",
                    backdropFilter: "blur(12px)",
                  }
            }
          >
            <Zap className="h-3.5 w-3.5" />
            <span>محدوده تهران</span>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} custom={1} className="text-center mb-3">
          <h1
            className="text-5xl font-extrabold tracking-tight mb-2"
            style={{
              backgroundImage: isLight
                ? "linear-gradient(90deg, #11152B, #7C5CFC)"
                : "linear-gradient(180deg, #FFFFFF 0%, #E9D5FF 45%, #A78BFA 100%)",
              backgroundColor: "transparent",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              lineHeight: "1.1",
            }}
          >
            مسیریابی مترو
          </h1>
          <p
            className="text-base font-normal"
            style={{ color: isLight ? "#667089" : "#A5B0C8", opacity: 0.95 }}
          >
            سریع‌ترین مسیر رو پیدا کن
          </p>
        </motion.div>

        <motion.div variants={fadeUp} custom={2} className="flex items-center gap-4 mt-4">
          <StatPill value={stats.totalStations} label="ایستگاه" icon={<MapPin className="h-3.5 w-3.5" />} color="#22D3EE" isLight={isLight} />
          <StatPill value={stats.totalLines} label="خط" icon={<Navigation className="h-3.5 w-3.5" />} color="#A78BFA" isLight={isLight} />
          <StatPill value={stats.interchangeCount} label="تبادل" icon={<ArrowLeftRight className="h-3.5 w-3.5" />} color="#2DD4BF" isLight={isLight} />
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Desktop Stats Section ────────────────────────────────────────────────

function DesktopStatsSection({ stats }: { stats: ReturnType<typeof MetroDataService.getStats> }) {
  return (
    <motion.section variants={fadeUp}>
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
        <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>آمار سریع</h2>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <DesktopStatCard label="ایستگاه تبادلی" value={stats.interchangeCount} color="amber" />
        <DesktopStatCard label="ایستگاه فعال"   value={stats.activeStations}   color="emerald" />
        <DesktopStatCard label="اتصالات"         value={stats.totalConnections} color="purple" />
        <DesktopStatCard label="ایستگاه پایانه" value={stats.terminalCount}    color="cyan" />
      </div>
    </motion.section>
  );
}

function DesktopStatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "emerald" | "cyan" | "amber" | "purple";
}) {
  const { isLight } = useThemeMode();
  const colorMap = {
    emerald: { accent: "#2DD4BF", glow: "rgba(45, 212, 191, 0.22)", border: "rgba(45, 212, 191, 0.28)" },
    cyan: { accent: "#38BDF8", glow: "rgba(56, 189, 248, 0.22)", border: "rgba(56, 189, 248, 0.28)" },
    amber: { accent: "#FBBF24", glow: "rgba(251, 191, 36, 0.20)", border: "rgba(251, 191, 36, 0.28)" },
    purple: { accent: "#A78BFA", glow: "rgba(167, 139, 250, 0.25)", border: "rgba(167, 139, 250, 0.30)" },
  };

  const { accent, glow, border } = colorMap[color];
  const { count, ref } = useCountUp(value);

  return (
    <div
      ref={ref}
      className="rounded-[22px] p-5 transition-all duration-200 flex flex-col items-center justify-center text-center"
      style={{
        background: isLight ? "var(--color-card)" : "var(--card-elevated)",
        border: isLight ? "1px solid var(--color-border)" : `1px solid ${border}`,
        height: "160px",
        boxShadow: isLight
          ? "var(--shadow-card-soft)"
          : `0 12px 36px rgba(0,0,0,0.28), 0 0 28px ${glow}`,
      }}
    >
      <p className="text-4xl font-bold tabular-nums mb-2" style={{ color: accent }}>
        {count}
      </p>
      <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
    </div>
  );
}

// ─── Mobile/Tablet Hero Section ────────────────────────────────────────────

function HeroSection({ stats }: { stats: ReturnType<typeof MetroDataService.getStats> }) {
  const { isLight } = useThemeMode();

  return (
    <div
      className="relative overflow-hidden px-4 pt-12 pb-16 sm:pt-14 sm:pb-20"
      style={{
        minHeight: "340px",
        backgroundColor: isLight ? "#EEF5FF" : undefined,
        backgroundImage: isLight ? "url(/herosecLight1.png)" : "url(/herosecBack1.png)",
        backgroundSize: "contain",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "scroll",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: isLight
            ? "linear-gradient(to bottom, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 40%, rgba(246,247,252,0.55) 100%)"
            : "linear-gradient(to bottom, rgba(5, 8, 20, 0.55) 0%, rgba(5, 8, 20, 0.28) 42%, rgba(5, 8, 20, 0.88) 100%)",
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center opacity-20 sm:opacity-25 pointer-events-none select-none">
        <MetroLinesAnimation className="w-full h-full" />
      </div>

      <motion.div
        className="relative z-10"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.div variants={fadeUp} custom={0} className="flex justify-center mb-5 sm:mb-6">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-medium"
            style={
              isLight
                ? {
                    background: "rgba(255,255,255,0.70)",
                    border: "1px solid rgba(124,92,252,0.18)",
                    color: "#6652D8",
                    boxShadow: "0 5px 20px rgba(90,80,180,0.06)",
                    backdropFilter: "blur(12px)",
                  }
                : {
                    background: "rgba(168, 85, 247, 0.12)",
                    border: "1px solid rgba(196, 181, 253, 0.35)",
                    color: "#C4B5FD",
                    boxShadow: "0 0 28px rgba(168, 85, 247, 0.18)",
                    backdropFilter: "blur(12px)",
                  }
            }
          >
            <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span>محدوده تهران</span>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} custom={1} className="text-center mb-2 sm:mb-3 px-2">
          <h1
            className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-2 sm:mb-3"
            style={{
              backgroundImage: isLight
                ? "linear-gradient(90deg, #11152B, #7C5CFC)"
                : "linear-gradient(180deg, #FFFFFF 0%, #E9D5FF 45%, #A78BFA 100%)",
              backgroundColor: "transparent",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              lineHeight: "1.1",
            }}
          >
            مسیریابی مترو
          </h1>
          <p
            className="text-sm sm:text-base font-normal"
            style={{ color: isLight ? "#667089" : "#A5B0C8", opacity: 0.95 }}
          >
            سریع‌ترین مسیر رو پیدا کن
          </p>
        </motion.div>

        <motion.div variants={fadeUp} custom={2} className="flex justify-center gap-2 sm:gap-3 mt-5 sm:mt-6 flex-wrap px-2">
          <StatPill value={stats.totalStations} label="ایستگاه" icon={<MapPin className="h-3.5 w-3.5" />} color="#22D3EE" isLight={isLight} />
          <StatPill value={stats.totalLines} label="خط" icon={<Navigation className="h-3.5 w-3.5" />} color="#A78BFA" isLight={isLight} />
          <StatPill value={stats.interchangeCount} label="تبادل" icon={<ArrowLeftRight className="h-3.5 w-3.5" />} color="#2DD4BF" isLight={isLight} />
        </motion.div>
      </motion.div>
    </div>
  );
}

function StatPill({
  value,
  label,
  icon,
  color,
  isLight = false,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
  color: string;
  isLight?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-1.5 sm:gap-2 rounded-full px-3 py-1.5 sm:px-4 sm:py-2"
      style={
        isLight
          ? {
              background: "rgba(255,255,255,0.78)",
              border: "1px solid rgba(100,110,150,0.12)",
              boxShadow: "0 5px 18px rgba(40,50,80,0.05)",
              backdropFilter: "blur(14px)",
            }
          : {
              background: "rgba(10, 16, 36, 0.65)",
              border: `1px solid ${color}44`,
              boxShadow: `0 0 20px ${color}22, inset 0 1px 0 rgba(255,255,255,0.06)`,
              backdropFilter: "blur(16px)",
            }
      }
    >
      <span style={{ color }}>{icon}</span>
      <span
        className="text-sm sm:text-base font-bold tabular-nums"
        style={{ color: isLight ? "#11152B" : "#F8FAFF" }}
      >
        {value}
      </span>
      <span className="text-[10px] sm:text-xs" style={{ color }}>{label}</span>
    </div>
  );
}

// ─── Route Planner Card ────────────────────────────────────────────────────

function RoutePlannerCard({
  origin,
  destination,
  onOpenOrigin,
  onOpenDestination,
  onSwap,
}: {
  origin: Station | null;
  destination: Station | null;
  onOpenOrigin: () => void;
  onOpenDestination: () => void;
  onSwap: () => void;
}) {
  const { setCurrentRoute, addRecentRoute, setAlternativeRoutes } = useMetroStore();
  const [routeError, setRouteError] = useState(false);

  const canRoute = origin && destination;

  const handleRoute = () => {
    if (!origin || !destination) return;
    setRouteError(false);
    const routes = MetroRouteService.calculateMultiple(origin.id, destination.id);
    if (routes.length > 0) {
      setAlternativeRoutes(routes);
      setCurrentRoute(routes[0].route);
      addRecentRoute(origin.id, destination.id);
    } else {
      setRouteError(true);
      setTimeout(() => setRouteError(false), 3000);
    }
  };

  return (
    <div
      className="rounded-[28px] p-5 sm:p-6"
      style={{
        background: "var(--glass-bg)",
        border: "1px solid var(--glass-border-strong)",
        boxShadow: "var(--shadow-card)",
        backdropFilter: "blur(24px) saturate(160%)",
      }}
    >
      {/* Origin */}
      <button
        onClick={onOpenOrigin}
        className="flex w-full items-center gap-3 rounded-2xl p-3.5 text-right transition-all duration-200"
        style={{
          background: origin ? "rgba(45, 212, 191, 0.14)" : "var(--input-bg)",
          border: origin ? "1px solid rgba(45, 212, 191, 0.40)" : "1px solid var(--input-border)",
          boxShadow: origin ? "0 0 24px rgba(45, 212, 191, 0.12)" : "inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{
            background: "rgba(45, 212, 191, 0.14)",
            boxShadow: "0 0 16px rgba(45, 212, 191, 0.25)",
          }}
        >
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#2DD4BF", boxShadow: "0 0 10px #2DD4BF" }} />
        </div>
        {origin ? (
          <div className="flex-1 min-w-0">
            <p className="text-xs mb-0.5" style={{ color: "#2DD4BF" }}>مبدا</p>
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{origin.nameFa}</p>
          </div>
        ) : (
          <p className="flex-1 text-sm" style={{ color: "var(--text-muted)" }}>مبدا را انتخاب کنید</p>
        )}
        <Search className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
      </button>

      {/* Swap + vertical dashed connector */}
      <div className="relative flex items-center justify-center my-2.5 h-10">
        <div
          className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2"
          style={{
            backgroundImage: "linear-gradient(to bottom, #2DD4BF 0%, transparent 40%, transparent 60%, #A78BFA 100%)",
            opacity: 0.55,
          }}
        />
        <div
          className="absolute left-1/2 top-1 bottom-1 w-px -translate-x-1/2 border-l border-dashed"
          style={{ borderColor: "rgba(167, 139, 250, 0.35)" }}
        />
        <button
          onClick={onSwap}
          className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
          style={{
            background: "var(--swap-bg)",
            border: "1px solid rgba(167, 139, 250, 0.45)",
            boxShadow: "0 0 20px rgba(139, 92, 246, 0.25)",
          }}
        >
          <ArrowLeftRight className="h-4 w-4 rotate-90" style={{ color: "#C4B5FD" }} />
        </button>
      </div>

      {/* Destination */}
      <button
        onClick={onOpenDestination}
        className="flex w-full items-center gap-3 rounded-2xl p-3.5 text-right transition-all duration-200"
        style={{
          background: destination ? "rgba(168, 85, 247, 0.14)" : "var(--input-bg)",
          border: destination ? "1px solid rgba(168, 85, 247, 0.40)" : "1px solid var(--input-border)",
          boxShadow: destination ? "0 0 24px rgba(168, 85, 247, 0.14)" : "inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{
            background: "rgba(168, 85, 247, 0.14)",
            boxShadow: "0 0 16px rgba(168, 85, 247, 0.25)",
          }}
        >
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#A78BFA", boxShadow: "0 0 10px #A78BFA" }} />
        </div>
        {destination ? (
          <div className="flex-1 min-w-0">
            <p className="text-xs mb-0.5" style={{ color: "#C4B5FD" }}>مقصد</p>
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{destination.nameFa}</p>
          </div>
        ) : (
          <p className="flex-1 text-sm" style={{ color: "var(--text-muted)" }}>مقصد را انتخاب کنید</p>
        )}
        <Search className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
      </button>

      {/* Route Button */}
      <button
        onClick={handleRoute}
        disabled={!canRoute}
        className="mt-5 w-full flex items-center justify-center gap-2.5 rounded-2xl py-3.5 text-base font-bold transition-all duration-200 disabled:cursor-not-allowed"
        style={{
          background: canRoute ? "var(--gradient-cta)" : "var(--input-bg)",
          color: canRoute ? "#FFFFFF" : "var(--text-muted)",
          border: canRoute ? "none" : "1px solid var(--input-border)",
          boxShadow: canRoute
            ? "0 12px 32px rgba(139, 92, 246, 0.35), 0 0 40px rgba(34, 211, 238, 0.12)"
            : "none",
          opacity: canRoute ? 1 : 0.85,
        }}
        onMouseEnter={(e) => {
          if (canRoute) {
            e.currentTarget.style.filter = "brightness(1.06)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }
        }}
        onMouseLeave={(e) => {
          if (canRoute) {
            e.currentTarget.style.filter = "brightness(1)";
            e.currentTarget.style.transform = "translateY(0)";
          }
        }}
        onMouseDown={(e) => {
          if (canRoute) e.currentTarget.style.transform = "scale(0.98)";
        }}
        onMouseUp={(e) => {
          if (canRoute) e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <Send className="h-4 w-4" />
        {canRoute
          ? routeError
            ? "مسیری پیدا نشد"
            : "سریع‌ترین مسیر رو پیدا کن"
          : "انتخاب مبدا و مقصد"}
      </button>
    </div>
  );
}

// ─── Nearby Stations ──────────────────────────────────────────────────────

function NearbyStationsSection() {
  const { userLocation, openStationSheet, setActiveTab } = useMetroStore();
  const { request, loading, supported } = useGeolocation();

  const stations = userLocation
    ? MetroDataService.getNearestStations(userLocation.lat, userLocation.lng, 6)
    : MetroDataService.getAllStations().slice(0, 8);

  const title = userLocation ? "ایستگاه‌های نزدیک" : "ایستگاه‌های پرکاربرد";

  return (
    <motion.section variants={fadeUp}>
      <SectionHeader
        icon={<Navigation className="h-4 w-4" />}
        title={title}
        action={
          !userLocation && supported
            ? {
                label: loading ? "در حال جستجو…" : "موقعیت من",
                onClick: request,
                icon: <LocateFixed className={cn("h-3.5 w-3.5", loading && "animate-pulse")} />,
              }
            : { label: "همه", onClick: () => setActiveTab("map") }
        }
      />
      <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {stations.map((station) => (
          <StationChip
            key={station.id}
            station={station}
            onClick={() => openStationSheet(station)}
          />
        ))}
      </div>
    </motion.section>
  );
}

// ─── Favorites Section ─────────────────────────────────────────────────────

function FavoritesSection() {
  const { favorites, openStationSheet, openSearch } = useMetroStore();

  if (favorites.length === 0) {
    return (
      <motion.section variants={fadeUp}>
        <SectionHeader
          icon={<Star className="h-4 w-4" />}
          title="علاقه‌مندی‌ها"
        />
        <button
          onClick={() => openSearch("general")}
          className="mt-3 flex w-full items-center gap-3 rounded-[14px] p-4 text-sm transition-all duration-200"
          style={{
            background: "var(--card-elevated)",
            border: "1px dashed var(--color-border)",
            color: "var(--text-muted)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--input-bg-hover)";
            e.currentTarget.style.borderColor = "rgba(124, 92, 252, 0.30)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--card-elevated)";
            e.currentTarget.style.borderColor = "var(--color-border)";
          }}
        >
          <Star className="h-4 w-4" />
          <span>ایستگاه مورد علاقه اضافه کنید</span>
        </button>
      </motion.section>
    );
  }

  return (
    <motion.section variants={fadeUp}>
      <SectionHeader
        icon={<Star className="h-4 w-4" />}
        title="علاقه‌مندی‌ها"
      />
      <div className="mt-3 grid grid-cols-2 gap-2">
        {favorites.slice(0, 4).map((fav) => {
          const station = MetroDataService.getStation(fav.stationId);
          if (!station) return null;
          return (
            <FavoriteCard
              key={fav.stationId}
              station={station}
              label={fav.label}
              onClick={() => openStationSheet(station)}
            />
          );
        })}
      </div>
    </motion.section>
  );
}

// ─── Recent Routes ─────────────────────────────────────────────────────────

function RecentRoutesSection() {
  const { recentRoutes, setOriginAndDestination, setCurrentRoute, setAlternativeRoutes } = useMetroStore();

  if (recentRoutes.length === 0) return null;

  return (
    <motion.section variants={fadeUp}>
      <SectionHeader icon={<Clock className="h-4 w-4" />} title="مسیرهای اخیر" />
      <div className="mt-3 flex flex-col gap-2">
        {recentRoutes.slice(0, 3).map((r, idx) => {
          const origin = MetroDataService.getStation(r.originId);
          const dest = MetroDataService.getStation(r.destinationId);
          if (!origin || !dest) return null;
          return (
            <button
              key={idx}
              type="button"
              className="flex w-full items-center gap-2.5 rounded-xl p-2.5 text-right transition-all duration-200 active:scale-[0.99]"
              style={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                height: "54px",
                boxShadow: "var(--shadow-card-soft, none)",
              }}
              onClick={() => {
                setOriginAndDestination(origin, dest);
                const routes = MetroRouteService.calculateMultiple(origin.id, dest.id);
                if (routes.length > 0) {
                  setAlternativeRoutes(routes);
                  setCurrentRoute(routes[0].route);
                }
              }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ background: "var(--component-active-bg)" }}
              >
                <Clock className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                  {origin.nameFa} <span style={{ color: "var(--text-muted)" }}>←</span> {dest.nameFa}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </motion.section>
  );
}

// ─── Quick Stats ───────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return { count, ref };
}

function QuickStatsSection({ stats }: { stats: ReturnType<typeof MetroDataService.getStats> }) {
  return (
    <motion.section variants={fadeUp} className="pb-2">
      <div className="mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
        <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
          آمار لحظه‌ای
        </h2>
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background: "var(--color-primary)",
            boxShadow: "0 0 8px color-mix(in srgb, var(--color-primary) 40%, transparent)",
            animation: "pulse 1.8s ease-in-out infinite",
          }}
        />
      </div>
      <div className="grid grid-cols-4 gap-1">
        <StatCard
          label="ایستگاه تبادلی"
          value={stats.interchangeCount}
          icon={<ArrowLeftRight className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="ایستگاه فعال"
          value={stats.activeStations}
          icon={<TrainFront className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="اتصالات"
          value={stats.totalConnections}
          icon={<GitBranch className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="ایستگاه پایانه"
          value={stats.terminalCount}
          icon={<Flag className="h-3.5 w-3.5" />}
        />
      </div>
    </motion.section>
  );
}

// ─── Shared Small Components ──────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  action?: { label: string; onClick: () => void; icon?: React.ReactNode };
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span style={{ color: "var(--color-primary)" }}>{icon}</span>
        <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{title}</h2>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: '#8B5CF6' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#A855F7'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#8B5CF6'}
        >
          {action.icon}
          {action.label}
        </button>
      )}
    </div>
  );
}

function StationChip({ station, onClick }: { station: Station; onClick: () => void }) {
  const { isLight } = useThemeMode();
  const statusColor = station.type === "interchange" ? "#2DD4BF" :
                     station.type === "terminal" ? "#FBBF24" : "#F43F5E";

  return (
    <button
      onClick={onClick}
      className="flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2.5 transition-all duration-200"
      style={{
        background: "var(--card-elevated)",
        border: isLight
          ? "1px solid var(--color-border)"
          : `1px solid ${statusColor}33`,
        boxShadow: isLight ? "none" : `0 0 18px ${statusColor}18`,
      }}
    >
      <div
        className="h-2 w-2 rounded-full shrink-0"
        style={{
          backgroundColor: statusColor,
          boxShadow: isLight ? "none" : `0 0 8px ${statusColor}`,
        }}
      />
      <span className="text-sm whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>
        {station.nameFa}
      </span>
      {station.type === "interchange" && (
        <div className="flex gap-0.5">
          {station.lines.map((l) => (
            <LineBadge key={l} lineId={l} size="xs" />
          ))}
        </div>
      )}
    </button>
  );
}

function FavoriteCard({
  station,
  label,
  onClick,
}: {
  station: Station;
  label?: string;
  onClick: () => void;
}) {
  const { isLight } = useThemeMode();
  const lineColor = station.colors[0] ?? "#888";

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-2.5 rounded-[20px] p-3.5 text-right transition-all duration-200"
      style={{
        background: "var(--card-elevated)",
        border: isLight ? "1px solid var(--color-border)" : `1px solid ${lineColor}40`,
        boxShadow: isLight
          ? "var(--shadow-card-soft)"
          : `0 10px 28px rgba(0,0,0,0.28), 0 0 20px ${lineColor}22`,
      }}
    >
      <div className="flex items-center gap-2 w-full">
        <div
          className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center"
          style={{
            background: `${lineColor}30`,
            border: `1px solid ${lineColor}60`,
            boxShadow: isLight ? "none" : `0 0 12px ${lineColor}40`,
          }}
        >
          <div
            className="h-2 w-2 rounded-full"
            style={{
              background: lineColor,
              boxShadow: isLight ? "none" : `0 0 8px ${lineColor}`,
            }}
          />
        </div>
        <span className="text-sm font-semibold truncate flex-1" style={{ color: "var(--text-primary)" }}>
          {label ?? station.nameFa}
        </span>
        <Star className="h-3.5 w-3.5 shrink-0" style={{ color: "#FBBF24", fill: "#FBBF24" }} />
      </div>
      <div className="flex gap-1">
        {station.lines.map((l) => (
          <LineBadge key={l} lineId={l} size="xs" />
        ))}
      </div>
    </button>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  const { count, ref } = useCountUp(value);

  return (
    <div
      ref={ref}
      className="flex flex-col items-center px-1 py-2 text-center"
    >
      <span className="mb-1.5" style={{ color: "var(--color-primary)", opacity: 0.85 }}>
        {icon}
      </span>
      <p
        className="text-lg font-bold tabular-nums leading-none sm:text-xl"
        style={{ color: "var(--text-primary)" }}
      >
        {count}
      </p>
      <p
        className="mt-1.5 text-[9px] font-medium leading-tight sm:text-[10px]"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>
    </div>
  );
}
