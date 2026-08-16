/**
 * DesktopRightRail — Right information panel for desktop
 * Contains: Popular Stations, Favorites, Recent Routes
 */
import { Navigation, Star, Clock } from "lucide-react";
import { useMetroStore } from "@/store/metro.store";
import { MetroDataService } from "@/services/metro-data.service";
import { LineBadge } from "@/components/shared/LineBadge";
import { MetroRouteService } from "@/services/metro-route.service";
import type { Station } from "@/types/metro";

export function DesktopRightRail() {
  const { 
    userLocation, 
    favorites, 
    recentRoutes,
    openStationSheet,
    setOriginAndDestination,
    setCurrentRoute,
    setAlternativeRoutes,
  } = useMetroStore();

  // Popular/Nearby stations
  const stations = userLocation
    ? MetroDataService.getNearestStations(userLocation.lat, userLocation.lng, 8)
    : MetroDataService.getAllStations()
        .filter(s => s.type === "interchange" || s.type === "terminal")
        .slice(0, 8);

  return (
    <aside
      className="hidden lg:flex flex-col sticky top-[14px] gap-4 overflow-y-auto scrollbar-thin"
      style={{
        width: "360px",
        height: "calc(100vh - 28px)",
      }}
    >
      {/* Popular Stations */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Navigation className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
          <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            ایستگاه‌های پرکاربرد
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {stations.map((station) => (
            <StationChip
              key={station.id}
              station={station}
              onClick={() => openStationSheet(station)}
            />
          ))}
        </div>
      </section>

      <div className="h-px" style={{ background: "var(--color-border)" }} />

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4" style={{ color: "#FBBF24" }} />
          <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            علاقه‌مندی‌ها
          </h3>
        </div>
        {favorites.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            هنوز ایستگاهی ذخیره نشده
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
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
        )}
      </section>

      {recentRoutes.length > 0 && (
        <>
          <div className="h-px" style={{ background: "var(--color-border)" }} />

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                مسیرهای اخیر
              </h3>
            </div>
            <div className="flex flex-col gap-2">
              {recentRoutes.slice(0, 3).map((r, idx) => {
                const origin = MetroDataService.getStation(r.originId);
                const dest = MetroDataService.getStation(r.destinationId);
                if (!origin || !dest) return null;
                return (
                  <button
                    key={idx}
                    className="flex items-center gap-2.5 rounded-xl p-2.5 text-right transition-all duration-200"
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
                      className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "var(--component-active-bg)" }}
                    >
                      <Clock className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {origin.nameFa} <span style={{ color: "var(--text-muted)" }}>←</span> {dest.nameFa}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}
    </aside>
  );
}

// Helper components

function StationChip({ station, onClick }: { station: Station; onClick: () => void }) {
  const statusColor = station.type === "interchange" ? "#10CFA3" :
                     station.type === "terminal" ? "#F59E0B" : "#EF476F";

  return (
    <button
      onClick={onClick}
      className="flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 transition-all duration-200"
      style={{
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        boxShadow: "0 3px 10px rgba(30,40,70,0.03)",
      }}
    >
      <div
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: statusColor }}
      />
      <span className="text-xs whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>
        {station.nameFa}
      </span>
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
  const lineColor = station.colors[0] ?? "#888";

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-[18px] p-2.5 text-right transition-all duration-200"
      style={{
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        height: "80px",
        boxShadow: "0 5px 18px rgba(40,50,80,0.05)",
      }}
    >
      <div className="flex items-center gap-1.5 w-full">
        <Star className="h-3 w-3 shrink-0" style={{ color: "#F4B740", fill: "#F4B740" }} />
        <span className="text-xs font-semibold truncate flex-1" style={{ color: "var(--text-primary)" }}>
          {label ?? station.nameFa}
        </span>
      </div>
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center"
        style={{
          background: `${lineColor}30`,
          border: `1px solid ${lineColor}60`,
        }}
      >
        <div className="w-2 h-2 rounded-full" style={{ background: lineColor }} />
      </div>
      <div className="flex gap-1">
        {station.lines.slice(0, 2).map((l) => (
          <LineBadge key={l} lineId={l} size="xs" />
        ))}
      </div>
    </button>
  );
}
