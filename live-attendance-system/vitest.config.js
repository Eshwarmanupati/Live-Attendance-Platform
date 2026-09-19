import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    // Integration tests share one database, so they must not run concurrently.
    fileParallelism: false,
    setupFiles: ["./tests/setup.js"],
    env: {
      NODE_ENV: "test",
      // Overridable so CI can point at its own service container.
      MONGO_URI: process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/live-attendance-test",
      JWT_SECRET: "test-only-secret-that-is-definitely-long-enough-32",
      JWT_EXPIRES_IN: "1h",
      CLIENT_URL: "http://localhost:5173",
      LATE_AFTER_MINUTES: "10",
      // Lowest bcrypt cost the model allows, so the suite is not spent hashing.
      BCRYPT_ROUNDS: "4",
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.js"],
      exclude: ["src/server.js"],
    },
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
