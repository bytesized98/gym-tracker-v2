import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// ⚠️ Change "lift-log" below to match your actual GitHub repo name.
// GitHub Pages serves the repo at https://<username>.github.io/<repo-name>/
// so Vite's asset paths must be prefixed with that same base path.
export default defineConfig({
  base: "/lift-log/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png"],
      manifest: {
        name: "Lift Log",
        short_name: "Lift Log",
        description: "Personal progressive overload tracker with AI coaching",
        theme_color: "#080808",
        background_color: "#080808",
        display: "standalone",
        start_url: "/lift-log/",
        scope: "/lift-log/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ]
      }
    })
  ]
});
