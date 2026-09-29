import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// WarGrid — BGMI scrims & tournament booking (mobile-first, 9:16)
export default defineConfig({
  // relative base so the same build runs at any web path AND inside the
  // Capacitor WebView (https://localhost) without rebasing
  base: "./",
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: false,
    open: false,
    // Allow the Arena live-preview host (and any other origin) to load the dev server
    allowedHosts: true,
  },
  // the live preview serves the production build so the PWA (service worker,
  // manifest, install prompt) behaves exactly like a deployed app
  preview: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: false,
    allowedHosts: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
