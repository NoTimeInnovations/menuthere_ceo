import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@convex": path.resolve(__dirname, "./convex"),
    },
  },
  server: {
    // The /explore feature's data lives in a Cloudflare Worker + D1. In dev,
    // proxy /api to `wrangler dev` (npm run dev:worker) so the browser hits the
    // same origin and there's no CORS/env juggling.
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
