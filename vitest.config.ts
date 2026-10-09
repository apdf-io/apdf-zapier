import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/test/**/*.test.ts'],
    setupFiles: ['src/test/support/setup.ts'],
    // All files share one Apdf workspace and its rate limit.
    fileParallelism: false,
    // The integration tests wait on a real Apdf: queued PDF jobs and automation webhooks.
    testTimeout: 120000,
    hookTimeout: 60000,
  },
});
