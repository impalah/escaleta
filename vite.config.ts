import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000
  },
  build: {
    chunkSizeWarningLimit: 1000 // Increase limit to 1000 kB (Vuetify bundles are large)
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    exclude: [
      'node_modules/**',
      'tests/e2e/**' // Exclude Playwright E2E tests
    ],
    server: {
      deps: {
        inline: ['vuetify']
      }
    },
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'tests/**',
        '**/*.config.*',
        '**/env.d.ts',
        'src/main.ts',
        'src/plugins/**',
        'src/App.vue',
        '**/*.cjs',
        'src/presentation/**', // Exclude all presentation layer (UI components/views)
        'src/composables/useDraggable.ts' // Exclude DOM event handling (tested via E2E)
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  }
})
