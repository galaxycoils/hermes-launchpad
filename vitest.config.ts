import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    passWithNoTests: false,
    setupFiles: ['tests/setup.ts'],
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['tests/unit/**/*.test.{ts,tsx}'],
        },
      },
      {
        test: {
          name: 'client',
          environment: 'jsdom',
          include: ['tests/client/**/*.test.{ts,tsx}'],
        },
      },
      {
        test: {
          name: 'integration',
          environment: 'jsdom',
          include: ['tests/integration/**/*.test.{ts,tsx}'],
        },
      },
      {
        test: {
          name: 'worker',
          environment: 'node',
          include: ['tests/worker/**/*.test.{ts,js}'],
        },
      },
    ],
  },
})
