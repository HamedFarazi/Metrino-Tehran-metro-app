/**
 * App — Root component.
 * Handles layout, routing between tabs, and global overlays.
 */
import { lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMetroStore } from "@/store/metro.store";
import { BottomNav } from "@/components/layout/BottomNav";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { DesktopRightRail } from "@/components/layout/DesktopRightRail";
import { SearchPanel } from "@/features/search/SearchPanel";
import { StationSheet } from "@/features/station/StationSheet";
import { RouteSheet } from "@/features/route/RouteSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const HomePage = lazy(() =>
  import("@/pages/HomePage").then((m) => ({ default: m.HomePage }))
);
const MapPage = lazy(() =>
  import("@/pages/MapPage").then((m) => ({ default: m.MapPage }))
);
const FavoritesPage = lazy(() =>
  import("@/pages/FavoritesPage").then((m) => ({ default: m.FavoritesPage }))
);

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

function GlobalOverlays() {
  return (
    <>
      <SearchPanel />
      <StationSheet />
      <RouteSheet />
    </>
  );
}

function App() {
  const { activeTab } = useMetroStore();
  const isMap = activeTab === "map";

  return (
    <>
      {/* Mobile / Tablet */}
      <div className="lg:hidden relative flex h-svh w-full flex-col overflow-hidden">
        <div className="h-safe-top" />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <TabContent />
        </main>
        <BottomNav />
        <GlobalOverlays />
      </div>

      {/* Desktop — Map: fullscreen + mobile-style bottom dock (no sidebars) */}
      {isMap ? (
        <div className="hidden lg:block relative h-svh w-full overflow-hidden">
          <TabContent />
          <BottomNav />
          <GlobalOverlays />
        </div>
      ) : (
        /* Desktop — Home / Favorites: sidebar + main + right rail */
        <div className="hidden lg:block min-h-screen">
          <div
            className="max-w-[1800px] mx-auto p-[14px]"
            style={{
              display: "grid",
              gridTemplateColumns: "120px minmax(0, 1fr) 360px",
              gap: "14px",
              minHeight: "calc(100vh - 28px)",
            }}
          >
            <DesktopSidebar />
            <main className={cn("overflow-y-auto scrollbar-thin")}>
              <TabContent />
            </main>
            <DesktopRightRail />
          </div>
          <GlobalOverlays />
        </div>
      )}
    </>
  );
}

export default App;
