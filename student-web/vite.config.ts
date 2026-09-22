import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Where the Laravel API actually runs in development.
 *
 * The dev server proxies every /api/* request to this target. Because the browser
 * only ever talks to http://localhost:5173, requests are same-origin and the API's
 * CORS rules are never involved - so the frozen backend needs no configuration change.
 */
const API_PROXY_TARGET = "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: API_PROXY_TARGET,
        changeOrigin: true
      }
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
    // Pinned so the test run does not depend on the shell's NODE_ENV. With
    // NODE_ENV=production, React loads its production build and Testing Library's
    // act() shim fails.
    env: { NODE_ENV: "test" }
  }
});
