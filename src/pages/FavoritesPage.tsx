/**
 * FavoritesPage — Saved stations and quick access.
 */
import { motion } from "framer-motion";
import { Star, Search, X, MapPin } from "lucide-react";
import { useMetroStore } from "@/store/metro.store";
import { MetroDataService } from "@/services/metro-data.service";
import { LineBadge } from "@/components/shared/LineBadge";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

export function FavoritesPage() {
  const { favorites, removeFavorite, openStationSheet, openSearch, setOrigin, setDestination } =
    useMetroStore();

  const hasFavorites = favorites.length > 0;

  return (
    <div className="flex min-h-full flex-col pb-24 pt-6 px-4" dir="rtl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">علاقه‌مندی‌ها</h1>
          <p className="text-sm text-foreground/40 mt-0.5">
            {hasFavorites ? `${favorites.length} ایستگاه ذخیره شده` : "هنوز ایستگاهی ذخیره نشده"}
          </p>
        </div>
        <Button
          variant="glass"
          size="sm"
          onClick={() => openSearch("general")}
          className="gap-2"
        >
          <Search className="h-4 w-4" />
          افزودن
        </Button>
      </motion.div>

      {/* Empty State */}
      {!hasFavorites && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-1 flex-col items-center justify-center gap-4 py-20"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 border border-amber-500/20">
            <Star className="h-10 w-10 text-amber-400/60" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground/70">هنوز خالیه</h2>
            <p className="mt-1 text-sm text-foreground/40">
              ایستگاه‌های مورد علاقه خودت رو اینجا ذخیره کن
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => openSearch("general")}
            className="gap-2"
          >
            <Search className="h-4 w-4" />
            جستجوی ایستگاه
          </Button>
        </motion.div>
      )}

      {/* Favorites Grid */}
      {hasFavorites && (
        <motion.div
          className="space-y-2"
          initial="hidden"
          animate="visible"
        >
          {favorites.map((fav, idx) => {
            const station = MetroDataService.getStation(fav.stationId);
            if (!station) return null;

            return (
              <motion.div
                key={fav.stationId}
                variants={fadeUp}
                custom={idx}
                layout
                className="group flex items-center gap-3 rounded-2xl border border-border/40 bg-surface/60 p-3.5 transition-all hover:bg-surface"
              >
                {/* Color indicator */}
                <div
                  className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${station.colors[0]}20`, border: `1px solid ${station.colors[0]}40` }}
                >
                  <MapPin className="h-5 w-5" style={{ color: station.colors[0] }} />
                </div>

                {/* Info */}
                <button
                  className="flex-1 min-w-0 text-right"
                  onClick={() => openStationSheet(station)}
                >
                  <p className="text-sm font-semibold text-foreground truncate">
                    {fav.label ?? station.nameFa}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {station.lines.map((l) => (
                      <LineBadge key={l} lineId={l} size="xs" showLabel />
                    ))}
                  </div>
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setOrigin(station); }}
                    className="rounded-lg px-2 py-1 text-xs text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    title="انتخاب به عنوان مبدا"
                  >
                    مبدا
                  </button>
                  <button
                    onClick={() => { setDestination(station); }}
                    className="rounded-lg px-2 py-1 text-xs text-cyan-400/70 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                    title="انتخاب به عنوان مقصد"
                  >
                    مقصد
                  </button>
                  <button
                    onClick={() => removeFavorite(fav.stationId)}
                    className="rounded-lg p-1.5 text-foreground/20 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="حذف از علاقه‌مندی‌ها"
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
