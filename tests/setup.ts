import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Mock CSS imports globally
vi.mock('*.css', () => ({}))
vi.mock('vuetify/styles', () => ({}))
vi.mock('@mdi/font/css/materialdesignicons.css', () => ({}))

// Stub all Vuetify components globally
config.global.stubs = {
  VApp: true,
  VAppBar: true,
  VToolbarTitle: { template: '<div><slot /></div>' },
  VSpacer: true,
  VBtn: true,
  VIcon: true,
  VTooltip: true,
  VMenu: true,
  VList: true,
  VListItem: true,
  VDivider: true,
  VSheet: { template: '<div class="v-sheet"><slot /></div>' },
  VContainer: { template: '<div><slot /></div>' },
  VDialog: true,
  VCard: true,
  VCardTitle: true,
  VCardText: true,
  VCardActions: true,
  VTextField: true,
  VSelect: true,
  VTextarea: true
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})
