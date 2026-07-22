import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 15000,
    hookTimeout: 30000,
    // Request lifecycle tests share one Mongo connection and clear collections between tests —
    // running files in parallel workers would race on the same test database.
    fileParallelism: false,
  },
});
