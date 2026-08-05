/**
 * App — Root component.
 * Handles layout, routing between tabs, and global overlays.
 */
import { lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMetroStore } from "@/store/metro.store";
import { BottomNav } from "@/components/layout/BottomNav";
import { SearchPanel } from "@/features/search/SearchPanel";
import { StationSheet } from "@/features/station/StationSheet";
import { RouteSheet } from "@/features/route/RouteSheet";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load pages for performance
const HomePage = lazy(() =>
  import("@/pages/HomePage").then((m) => ({ default: m.HomePage }))
);
const MapPage = lazy(() =>
  import("@/pages/MapPage").then((m) => ({ default: m.MapPage }))
);
const FavoritesPage = lazy(() =>
  import("@/pages/FavoritesPage").then((m) => ({ default: m.FavoritesPage }))
);

// ─── Page Skeleton ────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 pt-14">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  );
}

// ─── Tab Content ──────────────────────────────────────────────────────────────

function TabContent() {
  const { activeTab } = useMetroStore();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="flex-1"
      >
        <Suspense fallback={<PageSkeleton />}>
          {activeTab === "home" && <HomePage />}
          {activeTab === "map" && <MapPage />}
          {activeTab === "favorites" && <FavoritesPage />}
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  return (
    <div className="relative flex h-svh w-full flex-col bg-background overflow-hidden">
      {/* Status Bar Spacer (mobile) */}
      <div className="h-safe-top" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <TabContent />
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Global Overlays — rendered in correct z-order */}
      <SearchPanel />
      <StationSheet />
      <RouteSheet />
    </div>
  );
}

export default App;
