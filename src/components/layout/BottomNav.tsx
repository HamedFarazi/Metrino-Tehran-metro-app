/**
 * BottomNav — Interactive mobile menu dock.
 * Desktop: FloatingDock with magnetic hover.
 * Mobile: InteractiveMenu with bounce animation.
 */
import { Home, Search, Map, Star } from "lucide-react";
import { InteractiveMenu } from "@/components/ui/modern-mobile-menu";
import { FloatingDock } from "@/components/ui/floating-dock";
import { useMetroStore } from "@/store/metro.store";

export function BottomNav() {
  const { activeTab, setActiveTab, openSearch } = useMetroStore();

  // Map tab names to index
  const tabOrder = ["home", "search", "map", "favorites"] as const;
  const activeIndex = tabOrder.indexOf(activeTab as (typeof tabOrder)[number]);

  const items = [
    {
      label: "home",
      labelFa: "خانه",
      icon: Home,
      onClick: () => setActiveTab("home"),
    },
    {
      label: "search",
      labelFa: "جستجو",
      icon: Search,
      onClick: () => openSearch("general"),
    },
    {
      label: "map",
      labelFa: "نقشه",
      icon: Map,
      onClick: () => setActiveTab("map"),
    },
    {
      label: "favorites",
      labelFa: "علاقه‌مندی",
      icon: Star,
      onClick: () => setActiveTab("favorites"),
    },
  ];

  // FloatingDock items (desktop)
  const dockItems = items.map((item) => ({
    title: item.labelFa,
    href: "#",
    icon: (
      <item.icon
        className="h-full w-full"
        style={{
          color:
            activeTab === item.label
              ? "oklch(66% 0.17 163)"
              : "oklch(55% 0.01 260)",
        }}
      />
    ),
    onClick: item.onClick,
  }));

  return (
    <nav
      className="fixed bottom-5 inset-x-0 z-40 flex justify-center pointer-events-none"
      aria-label="Navigation"
    >
      <div className="pointer-events-auto">
        {/* Mobile: InteractiveMenu */}
        <div className="md:hidden">
          <InteractiveMenu
            items={items}
            activeIndex={activeIndex >= 0 ? activeIndex : 0}
          />
        </div>

        {/* Desktop: FloatingDock */}
        <div className="hidden md:block">
          <FloatingDock items={dockItems} />
        </div>
      </div>
    </nav>
  );
}
