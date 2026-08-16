/**
 * Global Metro App State — Zustand store.
 * Handles: route query, selected station, favorites, recent routes, UI state.
 * Now supports multiple alternative routes.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Station,
  Route,
  RouteOption,
  FavoriteStation,
  RecentRoute,
  AppTab,
  UserLocation,
  MapMode,
} from "@/types/metro";

interface MetroState {
  // ── Navigation ─────────────────────────────────────────────────────────────
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;

  // ── Route Query ────────────────────────────────────────────────────────────
  originStation: Station | null;
  destinationStation: Station | null;
  setOrigin: (station: Station | null) => void;
  setDestination: (station: Station | null) => void;
  setOriginAndDestination: (origin: Station, destination: Station) => void;
  swapOriginDestination: () => void;
  clearRoute: () => void;

  // ── Calculated Routes ──────────────────────────────────────────────────────
  currentRoute: Route | null;
  setCurrentRoute: (route: Route | null) => void;
  alternativeRoutes: RouteOption[];
  setAlternativeRoutes: (routes: RouteOption[]) => void;
  selectRouteOption: (option: RouteOption) => void;

  // ── Station Detail ─────────────────────────────────────────────────────────
  selectedStation: Station | null;
  setSelectedStation: (station: Station | null) => void;
  
  // ── Selected Station Coordinates ───────────────────────────────────────────
  selectedStationCoordinates: { lng: number; lat: number } | null;
  setSelectedStationCoordinates: (coords: { lng: number; lat: number } | null) => void;

  // ── Map Mode ────────────────────────────────────────────────────────────────
  mapMode: MapMode;
  setMapMode: (mode: MapMode) => void;

  // ── User Location ──────────────────────────────────────────────────────────
  userLocation: UserLocation | null;
  setUserLocation: (loc: UserLocation | null) => void;

  // ── Favorites (persisted) ──────────────────────────────────────────────────
  favorites: FavoriteStation[];
  addFavorite: (stationId: string, label?: string) => void;
  removeFavorite: (stationId: string) => void;
  isFavorite: (stationId: string) => boolean;

  // ── Recent Routes (persisted) ─────────────────────────────────────────────
  recentRoutes: RecentRoute[];
  addRecentRoute: (originId: string, destinationId: string) => void;
  clearRecentRoutes: () => void;

  // ── Search Panel ───────────────────────────────────────────────────────────
  isSearchOpen: boolean;
  searchMode: "origin" | "destination" | "general";
  openSearch: (mode?: "origin" | "destination" | "general") => void;
  closeSearch: () => void;

  // ── Station Sheet ──────────────────────────────────────────────────────────
  isStationSheetOpen: boolean;
  openStationSheet: (station: Station) => void;
  closeStationSheet: () => void;
}

export const useMetroStore = create<MetroState>()(
  persist(
    (set, get) => ({
      // ── Navigation ──────────────────────────────────────────────────────────
      activeTab: "home",
      setActiveTab: (tab) => set({ activeTab: tab }),

      // ── Route Query ─────────────────────────────────────────────────────────
      originStation: null,
      destinationStation: null,
      setOrigin: (station) => set({ originStation: station }),
      setDestination: (station) => set({ destinationStation: station }),
      setOriginAndDestination: (origin, destination) =>
        set({ originStation: origin, destinationStation: destination }),
      swapOriginDestination: () =>
        set((state) => ({
          originStation: state.destinationStation,
          destinationStation: state.originStation,
        })),
      clearRoute: () =>
        set({ originStation: null, destinationStation: null, currentRoute: null, alternativeRoutes: [] }),

      // ── Calculated Routes ───────────────────────────────────────────────────
      currentRoute: null,
      setCurrentRoute: (route) => set({ currentRoute: route }),
      alternativeRoutes: [],
      setAlternativeRoutes: (routes) => set({ alternativeRoutes: routes }),
      selectRouteOption: (option) => set({ currentRoute: option.route }),

      // ── Station Detail ──────────────────────────────────────────────────────
      selectedStation: null,
      setSelectedStation: (station) => set({ selectedStation: station }),
      

      
      // ── Selected Station Coordinates ───────────────────────────────────────
      selectedStationCoordinates: null,
      setSelectedStationCoordinates: (coords) => set({ selectedStationCoordinates: coords }),

      // ── Map Mode ────────────────────────────────────────────────────────────
      mapMode: "offline",
      setMapMode: (mode) => set({ mapMode: mode }),

      // ── User Location ───────────────────────────────────────────────────────
      userLocation: null,
      setUserLocation: (loc) => set({ userLocation: loc }),

      // ── Favorites ───────────────────────────────────────────────────────────
      favorites: [],
      addFavorite: (stationId, label) => {
        const { favorites } = get();
        if (favorites.some((f) => f.stationId === stationId)) return;
        set({
          favorites: [...favorites, { stationId, label, addedAt: Date.now() }],
        });
      },
      removeFavorite: (stationId) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.stationId !== stationId),
        })),
      isFavorite: (stationId) =>
        get().favorites.some((f) => f.stationId === stationId),

      // ── Recent Routes ───────────────────────────────────────────────────────
      recentRoutes: [],
      addRecentRoute: (originId, destinationId) => {
        const existing = get().recentRoutes;
        const filtered = existing.filter(
          (r) => !(r.originId === originId && r.destinationId === destinationId)
        );
        set({
          recentRoutes: [
            { originId, destinationId, usedAt: Date.now() },
            ...filtered,
          ].slice(0, 10),
        });
      },
      clearRecentRoutes: () => set({ recentRoutes: [] }),

      // ── Search Panel ────────────────────────────────────────────────────────
      isSearchOpen: false,
      searchMode: "general",
      openSearch: (mode = "general") =>
        set({ isSearchOpen: true, searchMode: mode }),
      closeSearch: () => set({ isSearchOpen: false }),

      // ── Station Sheet ───────────────────────────────────────────────────────
      isStationSheetOpen: false,
      openStationSheet: (station) =>
        set({ 
          selectedStation: station, 
          isStationSheetOpen: true,
          selectedStationCoordinates: { lng: station.coordinates.lng, lat: station.coordinates.lat }
        }),
      closeStationSheet: () => set({ 
        isStationSheetOpen: false,
        selectedStationCoordinates: null
      }),
    }),
    {
      name: "tehran-metro-store",
      partialize: (state) => ({
        favorites: state.favorites,
        recentRoutes: state.recentRoutes,
        mapMode: state.mapMode,
      }),
    }
  )
);
