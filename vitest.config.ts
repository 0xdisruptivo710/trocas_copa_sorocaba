import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: [],
    testTimeout: 30000,
    env: {
      // Vitest doesn't auto-load .env.local; pull explicitly
      ...Object.fromEntries(
        Object.entries(process.env).filter(
          ([k]) =>
            k.startsWith("NEXT_PUBLIC_") ||
            k.startsWith("SUPABASE_"),
        ),
      ),
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
