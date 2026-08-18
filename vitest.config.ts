import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const alias = { '@': fileURLToPath(new URL('./src', import.meta.url)) }
const project = (name: string, environment: 'jsdom' | 'node', include: string[]) => ({
  resolve: { alias },
  test: { name, environment, include },
})

export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  test: {
    globals: true,
    passWithNoTests: false,
    setupFiles: ['tests/setup.ts'],
    projects: [
      project('unit', 'jsdom', ['tests/unit/**/*.test.{ts,tsx}']),
      project('client', 'jsdom', ['tests/client/**/*.test.{ts,tsx}']),
      project('integration', 'jsdom', ['tests/integration/**/*.test.{ts,tsx}']),
      project('worker', 'node', ['tests/worker/**/*.test.{ts,js}']),
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        'src/service-worker.ts',
      ],
      thresholds: {
        lines: 29,
        branches: 44,
        functions: 23,
        statements: 29
      },
    },
  },
})
