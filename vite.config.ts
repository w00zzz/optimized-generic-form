import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { configDefaults } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/testing/setupTests.ts",
    exclude: [...configDefaults.exclude, "dist/**", "node_modules/**"],
  },
});
