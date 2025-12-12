import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.ts', 'tests/unit/**/*.test.ts'],
    // Run test files sequentially to avoid MongoDB race conditions
    fileParallelism: false,
    // Also run tests within files sequentially
    sequence: {
      concurrent: false,
    },
  },
})
