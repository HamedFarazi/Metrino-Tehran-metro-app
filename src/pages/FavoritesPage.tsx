/**
 * FavoritesPage — Saved stations and quick access.
 */
import { motion } from "framer-motion";
import { Star, Search, X, MapPin } from "lucide-react";
import { useMetroStore } from "@/store/metro.store";
import { MetroDataService } from "@/services/metro-data.service";
import { LineBadge } from "@/components/shared/LineBadge";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

export function FavoritesPage() {
  const { favorites, removeFavorite, openStationSheet, openSearch, setOrigin, setDestination, setActiveTab } =
    useMetroStore();

  const hasFavorites = favorites.length > 0;

  return (
    <div className="flex min-h-full flex-col pb-24 pt-6 px-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>علاقه‌مندی‌ها</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {hasFavorites ? `${favorites.length} ایستگاه ذخیره شده` : "هنوز ایستگاهی ذخیره نشده"}
          </p>
        </div>
        <button
          onClick={() => openSearch("general")}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200"
          style={{
            background: "var(--component-active-bg)",
            border: "1px solid rgba(124, 92, 252, 0.25)",
            color: "var(--color-primary)",
          }}
        >
          <Search className="h-4 w-4" />
          افزودن
        </button>
      </motion.div>

      {!hasFavorites && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-1 flex-col items-center justify-center gap-4 py-20"
        >
          <div
            className="flex h-20 w-20 items-center justify-center rounded-3xl"
            style={{
              background: "rgba(245, 158, 11, 0.10)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
            }}
          >
            <Star className="h-10 w-10" style={{ color: "#F59E0B" }} />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-secondary)" }}>هنوز خالیه</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              ایستگاه‌های مورد علاقه خودت رو اینجا ذخیره کن
            </p>
          </div>
          <button
            onClick={() => openSearch("general")}
            className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all duration-200"
            style={{
              background: "var(--gradient-cta)",
              color: "#FFFFFF",
              boxShadow: "0 10px 25px rgba(108, 99, 245, 0.20)",
            }}
          >
            <Search className="h-4 w-4" />
            جستجوی ایستگاه
          </button>
        </motion.div>
      )}

      {hasFavorites && (
        <motion.div className="space-y-2.5" initial="hidden" animate="visible">
          {favorites.map((fav, idx) => {
            const station = MetroDataService.getStation(fav.stationId);
            if (!station) return null;

            return (
              <motion.div
                key={fav.stationId}
                variants={fadeUp}
                custom={idx}
                layout
                className="group flex items-center gap-3 rounded-[20px] p-4 transition-all duration-200"
                style={{
                  background: "var(--card-elevated)",
                  border: "1px solid var(--color-border)",
                  boxShadow: "var(--shadow-card-soft, 0 5px 18px rgba(40,50,80,0.05))",
                }}
              >
                <div
                  className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: `${station.colors[0]}20`,
                    border: `1.5px solid ${station.colors[0]}40`,
                  }}
                >
                  <MapPin className="h-5 w-5" style={{ color: station.colors[0] }} />
                </div>

                <button
                  className="flex-1 min-w-0 text-right"
                  onClick={() => openStationSheet(station)}
                >
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                    {fav.label ?? station.nameFa}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {station.lines.map((l) => (
                      <LineBadge key={l} lineId={l} size="xs" showLabel />
                    ))}
                  </div>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setOrigin(station); setActiveTab("home"); }}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-emerald-500/10"
                    style={{ color: "#10CFA3" }}
                  >
                    مبدا
                  </button>
                  <button
                    onClick={() => { setDestination(station); setActiveTab("home"); }}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-cyan-500/10"
                    style={{ color: "#16C7E8" }}
                  >
                    مقصد
                  </button>
                  <button
                    onClick={() => removeFavorite(fav.stationId)}
                    className="rounded-lg p-1.5 transition-colors hover:bg-rose-500/10"
                    title="حذف"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
