/**
 * HomePage — Main landing page of Tehran Metro app.
 * Apple Maps + Linear inspired design.
 */
import { motion } from "framer-motion";
import { Search, Navigation, Star, Clock, ArrowLeftRight, MapPin, Zap } from "lucide-react";
import { useMetroStore } from "@/store/metro.store";
import { MetroDataService } from "@/services/metro-data.service";
import { MetroRouteService } from "@/services/metro-route.service";
import { LineBadge } from "@/components/shared/LineBadge";
import { Button } from "@/components/ui/button";
import type { Station } from "@/types/metro";
import { cn } from "@/lib/utils";

// ─── Animation Variants ────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

// ─── Home Page ────────────────────────────────────────────────────────────────

export function HomePage() {
  const { originStation, destinationStation, openSearch, swapOriginDestination } =
    useMetroStore();
  const stats = MetroDataService.getStats();

  return (
    <div className="flex min-h-full flex-col pb-24" dir="rtl">
      {/* Hero Section */}
      <HeroSection stats={stats} />

      {/* Route Planner Card */}
      <motion.div
        className="px-4 -mt-6 relative z-10"
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

      {/* Content Sections */}
      <motion.div
        className="mt-6 px-4 space-y-6"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <NearbyStationsSection />
        <FavoritesSection />
        <RecentRoutesSection />
        <QuickStatsSection stats={stats} />
      </motion.div>
    </div>
  );
}

// ─── Hero Section ──────────────────────────────────────────────────────────

function HeroSection({ stats }: { stats: ReturnType<typeof MetroDataService.getStats> }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-emerald-500/10 via-background to-background px-4 pt-14 pb-14">
      {/* Background glow */}
      <div className="absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute -top-10 left-1/3 h-40 w-40 rounded-full bg-cyan-500/10 blur-2xl" />

      <motion.div
        className="relative"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        {/* Title */}
        <motion.div variants={fadeUp} custom={0} className="text-center mb-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-xs text-emerald-400 mb-4">
            <Zap className="h-3 w-3" />
            <span>مترو تهران</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            مسیریابی مترو
          </h1>
          <p className="mt-2 text-base text-foreground/50">
            سریع‌ترین مسیر رو پیدا کن
          </p>
        </motion.div>

        {/* Stats pills */}
        <motion.div variants={fadeUp} custom={1} className="flex justify-center gap-3 mt-5 flex-wrap">
          <StatPill value={stats.totalStations} label="ایستگاه" />
          <StatPill value={stats.totalLines} label="خط" />
          <StatPill value={stats.interchangeCount} label="تبادلی" />
        </motion.div>
      </motion.div>
    </div>
  );
}

function StatPill({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border/50 bg-surface px-3 py-1.5">
      <span className="text-sm font-semibold text-foreground">{value}</span>
      <span className="text-xs text-foreground/40">{label}</span>
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
  const { setCurrentRoute, addRecentRoute } = useMetroStore();

  const canRoute = origin && destination;

  const handleRoute = () => {
    if (!origin || !destination) return;
    const route = MetroRouteService.calculate(origin.id, destination.id);
    if (route) {
      setCurrentRoute(route);
      addRecentRoute(origin.id, destination.id);
      // Stay on home page — RouteSheet slides up from bottom
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-2xl backdrop-blur-xl">
      {/* Origin */}
      <button
        onClick={onOpenOrigin}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl p-3 text-right transition-all duration-200",
          origin ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-surface hover:bg-white/5 border border-transparent"
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        {origin ? (
          <div className="flex-1 min-w-0">
            <p className="text-xs text-emerald-400/70 mb-0.5">مبدا</p>
            <p className="text-sm font-medium text-foreground truncate">{origin.nameFa}</p>
          </div>
        ) : (
          <p className="flex-1 text-sm text-foreground/40">مبدا را انتخاب کنید</p>
        )}
        <Search className="h-4 w-4 shrink-0 text-foreground/30" />
      </button>

      {/* Swap & connector */}
      <div className="relative flex items-center justify-center my-2">
        <div className="absolute inset-x-6 h-px bg-border/50" />
        <button
          onClick={onSwap}
          className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card hover:bg-surface transition-colors"
        >
          <ArrowLeftRight className="h-3.5 w-3.5 text-foreground/50 rotate-90" />
        </button>
      </div>

      {/* Destination */}
      <button
        onClick={onOpenDestination}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl p-3 text-right transition-all duration-200",
          destination ? "bg-cyan-500/10 border border-cyan-500/20" : "bg-surface hover:bg-white/5 border border-transparent"
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/20">
          <MapPin className="h-4 w-4 text-cyan-400" />
        </div>
        {destination ? (
          <div className="flex-1 min-w-0">
            <p className="text-xs text-cyan-400/70 mb-0.5">مقصد</p>
            <p className="text-sm font-medium text-foreground truncate">{destination.nameFa}</p>
          </div>
        ) : (
          <p className="flex-1 text-sm text-foreground/40">مقصد را انتخاب کنید</p>
        )}
        <Search className="h-4 w-4 shrink-0 text-foreground/30" />
      </button>

      {/* Route Button */}
      <Button
        onClick={handleRoute}
        disabled={!canRoute}
        size="lg"
        className={cn(
          "mt-3 w-full font-semibold transition-all duration-300",
          canRoute
            ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/25"
            : "bg-surface text-foreground/20 cursor-not-allowed"
        )}
      >
        {canRoute ? "یافتن مسیر" : "انتخاب مبدا و مقصد"}
      </Button>
    </div>
  );
}

// ─── Nearby Stations ──────────────────────────────────────────────────────

function NearbyStationsSection() {
  const { userLocation, openStationSheet, setActiveTab } = useMetroStore();

  // Show top 5 stations or nearest if location available
  const stations = userLocation
    ? MetroDataService.getNearestStations(userLocation.lat, userLocation.lng, 5)
    : MetroDataService.getAllStations().slice(0, 8);

  return (
    <motion.section variants={fadeUp}>
      <SectionHeader
        icon={<Navigation className="h-4 w-4" />}
        title={userLocation ? "ایستگاه‌های نزدیک" : "ایستگاه‌های معروف"}
        action={{ label: "همه", onClick: () => setActiveTab("map") }}
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
          className="mt-3 flex w-full items-center gap-3 rounded-xl border border-dashed border-border/50 bg-surface/50 p-4 text-sm text-foreground/30 transition-colors hover:bg-surface"
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
  const { recentRoutes, setOrigin, setDestination, setCurrentRoute } = useMetroStore();

  if (recentRoutes.length === 0) return null;

  return (
    <motion.section variants={fadeUp}>
      <SectionHeader icon={<Clock className="h-4 w-4" />} title="مسیرهای اخیر" />
      <div className="mt-3 space-y-2">
        {recentRoutes.slice(0, 3).map((r, idx) => {
          const origin = MetroDataService.getStation(r.originId);
          const dest = MetroDataService.getStation(r.destinationId);
          if (!origin || !dest) return null;
          return (
            <button
              key={idx}
              className="flex w-full items-center gap-3 rounded-xl border border-border/40 bg-surface/60 p-3 text-right transition-colors hover:bg-surface"
              onClick={() => {
                setOrigin(origin);
                setDestination(dest);
                const route = MetroRouteService.calculate(origin.id, dest.id);
                if (route) setCurrentRoute(route);
              }}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5">
                <Clock className="h-4 w-4 text-foreground/30" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {origin.nameFa} <span className="text-foreground/40">←</span> {dest.nameFa}
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

function QuickStatsSection({ stats }: { stats: ReturnType<typeof MetroDataService.getStats> }) {
  return (
    <motion.section variants={fadeUp} className="pb-2">
      <SectionHeader icon={<Zap className="h-4 w-4" />} title="آمار سریع" />
      <div className="mt-3 grid grid-cols-2 gap-3">
        <StatCard label="ایستگاه فعال" value={stats.activeStations} color="emerald" />
        <StatCard label="ایستگاه تبادلی" value={stats.interchangeCount} color="amber" />
        <StatCard label="ایستگاه پایانه" value={stats.terminalCount} color="cyan" />
        <StatCard label="اتصالات" value={stats.totalConnections} color="purple" />
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
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-foreground/40">{icon}</span>
        <h2 className="text-sm font-semibold text-foreground/80">{title}</h2>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

function StationChip({ station, onClick }: { station: Station; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex shrink-0 items-center gap-2 rounded-2xl border border-border/50 bg-surface/60 px-3 py-2 transition-all hover:bg-surface hover:border-border"
    >
      <div
        className="h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: station.colors[0] ?? "#888" }}
      />
      <span className="text-sm text-foreground/70 whitespace-nowrap">{station.nameFa}</span>
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
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-xl border border-border/40 bg-surface/60 p-3 text-right transition-all hover:bg-surface"
    >
      <div className="flex items-center gap-2 w-full">
        <div
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: station.colors[0] ?? "#888" }}
        />
        <span className="text-sm font-medium text-foreground truncate flex-1">
          {label ?? station.nameFa}
        </span>
        <Star className="h-3 w-3 text-amber-400/70 shrink-0" />
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
  color,
}: {
  label: string;
  value: number;
  color: "emerald" | "cyan" | "amber" | "purple";
}) {
  const colorMap = {
    emerald: "from-emerald-500/10 border-emerald-500/20 text-emerald-400",
    cyan: "from-cyan-500/10 border-cyan-500/20 text-cyan-400",
    amber: "from-amber-500/10 border-amber-500/20 text-amber-400",
    purple: "from-purple-500/10 border-purple-500/20 text-purple-400",
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-gradient-to-br to-transparent p-4",
        colorMap[color]
      )}
    >
      <p className={cn("text-2xl font-bold", colorMap[color].split(" ").pop())}>{value}</p>
      <p className="mt-1 text-xs text-foreground/50">{label}</p>
    </div>
  );
}
