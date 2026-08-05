import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      // Generate sw.js automatically
      injectRegister: "auto",
      // Dev mode — also serve SW in development for testing
      devOptions: {
        enabled: true,
        type: "module",
      },
      manifest: {
        name: "مترو تهران — مسیریابی",
        short_name: "مترو تهران",
        description: "مسیریابی هوشمند مترو تهران",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#09090b",
        theme_color: "#09090b",
        lang: "fa",
        dir: "rtl",
        scope: "/",
        icons: [
          {
            src: "/icons/icon.jpg",
            sizes: "512x512",
            type: "image/jpeg",
            purpose: "any",
          },
          {
            src: "/icons/icon.jpg",
            sizes: "192x192",
            type: "image/jpeg",
            purpose: "maskable",
          },
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        // Cache all static assets
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
        // Cache strategies
        runtimeCaching: [
          {
            // Map tiles — network first with cache fallback
            urlPattern: /^https:\/\/tiles\.openfreemap\.org\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "map-tiles",
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            // Fonts
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  optimizeDeps: {
    include: ["maplibre-gl"],
  },
});
