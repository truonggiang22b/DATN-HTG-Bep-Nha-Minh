import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Run test files sequentially to avoid DB state conflicts between suites
    fileParallelism: false,
    // Run tests within each file sequentially (no parallel workers per file)
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
    // Timeout for slow Supabase auth calls
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
