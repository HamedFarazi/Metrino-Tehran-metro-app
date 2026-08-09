/**
 * SearchPanel — Raycast-inspired instant search.
 * Opens as a full-screen overlay with keyboard navigation.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, MapPin, ArrowRight, Clock } from "lucide-react";
import { MetroDataService } from "@/services/metro-data.service";
import { MetroRouteService } from "@/services/metro-route.service";
import { useMetroStore } from "@/store/metro.store";
import type { Station } from "@/types/metro";
import { cn } from "@/lib/utils";
import { LineBadge } from "@/components/shared/LineBadge";

export function SearchPanel() {
  const {
    isSearchOpen, searchMode, closeSearch,
    setOrigin, setDestination, openStationSheet,
    originStation, destinationStation,
    setCurrentRoute, addRecentRoute,
  } = useMetroStore();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Station[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isSearchOpen) {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  // Search on query change
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const found = MetroDataService.search(query, 12);
    setResults(found);
    setActiveIndex(0);
  }, [query]);

  const handleSelect = useCallback(
    (station: Station) => {
      if (searchMode === "origin") {
        setOrigin(station);
        // If destination already set, auto-calculate route
        if (destinationStation) {
          const route = MetroRouteService.calculate(station.id, destinationStation.id);
          if (route) {
            setCurrentRoute(route);
            addRecentRoute(station.id, destinationStation.id);
          }
        }
      } else if (searchMode === "destination") {
        setDestination(station);
        // If origin already set, auto-calculate route
        if (originStation) {
          const route = MetroRouteService.calculate(originStation.id, station.id);
          if (route) {
            setCurrentRoute(route);
            addRecentRoute(originStation.id, station.id);
          }
        }
      } else {
        openStationSheet(station);
      }
      closeSearch();
    },
    [
      searchMode, setOrigin, setDestination, openStationSheet, closeSearch,
      originStation, destinationStation, setCurrentRoute, addRecentRoute,
    ]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isSearchOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && results[activeIndex]) {
        handleSelect(results[activeIndex]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isSearchOpen, results, activeIndex, closeSearch, handleSelect]);

  const placeholder = {
    origin: "جستجوی ایستگاه مبدا…",
    destination: "جستجوی ایستگاه مقصد…",
    general: "جستجوی ایستگاه…",
  }[searchMode];

  const modeLabel = {
    origin: "انتخاب مبدا",
    destination: "انتخاب مقصد",
    general: "جستجو",
  }[searchMode];

  const modeColor = {
    origin: "text-emerald-400",
    destination: "text-cyan-400",
    general: "text-foreground/60",
  }[searchMode];

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
            onClick={closeSearch}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-1/2 top-[10%] z-50 w-full max-w-xl -translate-x-1/2"
          >
            <div className="mx-4 overflow-hidden rounded-2xl border border-white/10 bg-card/95 shadow-2xl backdrop-blur-2xl">
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
                <Search className="h-5 w-5 shrink-0 text-foreground/40" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent text-base text-foreground placeholder:text-foreground/30 focus:outline-none"
                  dir="rtl"
                />
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-medium", modeColor)}>
                    {modeLabel}
                  </span>
                  <button
                    onClick={closeSearch}
                    className="rounded-lg p-1 text-foreground/40 transition-colors hover:bg-white/10 hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {query && results.length === 0 && (
                  <div className="px-4 py-12 text-center text-sm text-foreground/40" dir="rtl">
                    <Search className="mx-auto mb-3 h-8 w-8 opacity-30" />
                    <p>ایستگاه‌ای با این نام پیدا نشد</p>
                    <p className="mt-1 text-xs opacity-60">به فارسی یا انگلیسی جستجو کنید</p>
                  </div>
                )}

                {!query && (
                  <QuickActions searchMode={searchMode} onClose={closeSearch} />
                )}

                {results.length > 0 && (
                  <ul className="p-2">
                    {results.map((station, idx) => (
                      <SearchResultItem
                        key={station.id}
                        station={station}
                        isActive={idx === activeIndex}
                        searchMode={searchMode}
                        onSelect={() => handleSelect(station)}
                        onHover={() => setActiveIndex(idx)}
                      />
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 border-t border-border/50 px-4 py-2.5 text-xs text-foreground/30">
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-white/5 px-1.5 py-0.5 font-mono">↑↓</kbd> جابه‌جایی
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-white/5 px-1.5 py-0.5 font-mono">↵</kbd> انتخاب
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-white/5 px-1.5 py-0.5 font-mono">Esc</kbd> بستن
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Search Result Item ───────────────────────────────────────────────────────

function SearchResultItem({
  station,
  isActive,
  searchMode,
  onSelect,
  onHover,
}: {
  station: Station;
  isActive: boolean;
  searchMode: string;
  onSelect: () => void;
  onHover: () => void;
}) {
  const actionIcon =
    searchMode === "origin" ? (
      <MapPin className="h-4 w-4 text-emerald-400" />
    ) : searchMode === "destination" ? (
      <ArrowRight className="h-4 w-4 text-cyan-400" />
    ) : (
      <MapPin className="h-4 w-4 text-foreground/40" />
    );

  return (
    <li>
      <button
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right transition-colors",
          isActive ? "bg-white/10" : "hover:bg-white/5"
        )}
        onClick={onSelect}
        onMouseEnter={onHover}
        dir="rtl"
      >
        {/* Station dot */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: station.colors[0] ?? "#888" }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">
              {station.nameFa}
            </span>
            {station.type === "interchange" && (
              <span className="text-xs text-amber-400/80">تبادلی</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {station.lines.map((lineId) => (
              <LineBadge key={lineId} lineId={lineId} size="xs" />
            ))}
            {station.isDisabled && (
              <span className="text-xs text-red-400">تعطیل</span>
            )}
          </div>
        </div>

        {/* Action icon */}
        <div className="shrink-0">{actionIcon}</div>
      </button>
    </li>
  );
}

// ─── Quick Actions (empty state) ─────────────────────────────────────────────

function QuickActions({
  searchMode,
  onClose,
}: {
  searchMode: string;
  onClose: () => void;
}) {
  const { recentRoutes, favorites, openStationSheet, setOrigin, setDestination, setOriginAndDestination } = useMetroStore();

  const hasFavorites = favorites.length > 0;
  const hasRecents = recentRoutes.length > 0;

  if (!hasFavorites && !hasRecents) {
    return (
      <div className="px-4 py-10 text-center text-sm text-foreground/30" dir="rtl">
        <Search className="mx-auto mb-3 h-8 w-8 opacity-20" />
        <p>نام ایستگاه را تایپ کنید</p>
        <p className="mt-1 text-xs">فارسی یا انگلیسی</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-4" dir="rtl">
      {hasFavorites && (
        <section>
          <p className="px-3 pb-1 text-xs font-medium text-foreground/40 uppercase tracking-wider">
            علاقه‌مندی‌ها
          </p>
          <ul>
            {favorites.slice(0, 3).map((fav) => {
              const station = MetroDataService.getStation(fav.stationId);
              if (!station) return null;
              return (
                <li key={fav.stationId}>
                  <button
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/5 transition-colors text-right"
                    onClick={() => {
                      if (searchMode === "origin") setOrigin(station);
                      else if (searchMode === "destination") setDestination(station);
                      else openStationSheet(station);
                      onClose();
                    }}
                  >
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: station.colors[0] }}
                    />
                    <span className="text-sm text-foreground/80">{station.nameFa}</span>
                    <div className="flex gap-1 mr-auto">
                      {station.lines.map((l) => (
                        <LineBadge key={l} lineId={l} size="xs" />
                      ))}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {hasRecents && (
        <section>
          <p className="px-3 pb-1 text-xs font-medium text-foreground/40 uppercase tracking-wider">
            اخیر
          </p>
          <ul>
            {recentRoutes.slice(0, 3).map((r, idx) => {
              const origin = MetroDataService.getStation(r.originId);
              const dest = MetroDataService.getStation(r.destinationId);
              if (!origin || !dest) return null;
              return (
                <li key={idx}>
                  <button
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 hover:bg-white/5 transition-colors text-right"
                    onClick={() => {
                      // Recent routes always set BOTH origin and destination
                      // regardless of searchMode — the full route is the intent
                      onClose();
                      requestAnimationFrame(() => {
                        setOriginAndDestination(origin, dest);
                      });
                    }}
                  >
                    <Clock className="h-3.5 w-3.5 shrink-0 text-foreground/30" />
                    <span className="text-sm text-foreground/60 truncate">
                      {origin.nameFa} → {dest.nameFa}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
