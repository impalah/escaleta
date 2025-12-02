import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Mock CSS imports globally
vi.mock('*.css', () => ({}))
vi.mock('vuetify/styles', () => ({}))
vi.mock('@mdi/font/css/materialdesignicons.css', () => ({}))

// Stub all Vuetify components globally
config.global.stubs = {
  VApp: { template: '<div><slot /></div>' },
  VAppBar: { template: '<div><slot /></div>' },
  VToolbarTitle: { template: '<div><slot /></div>' },
  VSpacer: { template: '<div></div>' },
  VBtn: { template: '<button><slot /></button>' },
  VIcon: { template: '<i><slot /></i>' },
  VTooltip: { template: '<div><slot /></div>' },
  VMenu: { template: '<div><slot /></div>' },
  VList: { template: '<div><slot /></div>' },
  VListItem: { template: '<div><slot /></div>' },
  VListItemTitle: { template: '<div><slot /></div>' },
  VDivider: { template: '<hr />' },
  VSheet: { template: '<div class="v-sheet"><slot /></div>' },
  VContainer: { template: '<div><slot /></div>' },
  VDialog: { template: '<div><slot /></div>' },
  VCard: { template: '<div><slot /></div>' },
  VCardTitle: { template: '<div><slot /></div>' },
  VCardText: { template: '<div><slot /></div>' },
  VCardActions: { template: '<div><slot /></div>' },
  VTextField: { template: '<input />' },
  VSelect: { template: '<select><slot /></select>' },
  VTextarea: { template: '<textarea></textarea>' },
  VBtnToggle: { template: '<div><slot /></div>' }
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
