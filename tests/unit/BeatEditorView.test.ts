import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'
import BeatEditorView from '@/presentation/views/BeatEditorView.vue'
import esES from '@/i18n/locales/es-ES'
import enUS from '@/i18n/locales/en-US'

// Create i18n instance for tests
const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'es-ES': esES,
    'en-US': enUS
  }
})

// Create router instance for tests
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'canvas', component: { template: '<div></div>' } },
    { path: '/canvas', name: 'canvas', component: { template: '<div></div>' } },
    { path: '/grid', name: 'grid', component: { template: '<div></div>' } }
  ]
})

// Mock AppToolbar component
vi.mock('@/presentation/components/AppToolbar.vue', () => ({
  default: {
    name: 'AppToolbar',
    template: '<div class="app-toolbar"></div>',
    props: ['projectName', 'showZoomControls'],
    emits: ['new-project', 'save', 'export-json', 'export-script', 'zoom-in', 'zoom-out', 'change-language', 'add-beat', 'create-group']
  }
}))

// Mock all child components
vi.mock('@/presentation/components/BeatCard.vue', () => ({
  default: {
    name: 'BeatCard',
    template: '<div class="beat-card">{{ beat.title }}</div>',
    props: ['beat', 'beatType', 'isGroupDragging', 'isHovered', 'isInGroup', 'zIndex'],
    emits: ['click', 'dragstart', 'dragmove', 'dragend', 'delete']
  }
}))

vi.mock('@/presentation/components/BeatGroupCard.vue', () => ({
  default: {
    name: 'BeatGroupCard',
    template: '<div class="beat-group-card">{{ group.name }}</div>',
    props: ['group', 'zoom', 'isHovered', 'zIndex'],
    emits: ['click', 'dragstart', 'dragmove', 'dragend', 'delete']
  }
}))

vi.mock('@/presentation/components/PropertiesPanel.vue', () => ({
  default: {
    name: 'PropertiesPanel',
    template: '<div class="properties-panel"></div>',
    props: ['selectedEntity', 'beatTypes'],
    emits: ['update-project', 'update-beat', 'update-group']
  }
}))

vi.mock('@/presentation/components/BeatGridView.vue', () => ({
  default: {
    name: 'BeatGridView',
    template: '<div class="beat-grid-view"></div>',
    props: ['beats', 'beatTypes'],
    emits: ['beat-click']
  }
}))

vi.mock('@/presentation/components/BeatEditDialog.vue', () => ({
  default: {
    name: 'BeatEditDialog',
    template: '<div class="beat-edit-dialog"></div>',
    props: ['modelValue', 'beat', 'beatTypes']
  }
}))

vi.mock('@/presentation/components/BeatTypeSelectDialog.vue', () => ({
  default: {
    name: 'BeatTypeSelectDialog',
    template: '<div class="beat-type-select-dialog"></div>',
    props: ['modelValue', 'beatTypes']
  }
}))

// Mock the project service
vi.mock('@/application/ProjectService', () => ({
  projectService: {
    loadCurrentProject: vi.fn(() => ({
      id: 'test-project',
      name: 'Test Project',
      description: 'Test',
      beats: [
        {
          id: 'beat-1',
          title: 'Beat 1',
          description: 'Description 1',
          typeId: 'news',
          position: { x: 100, y: 100 },
          links: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'beat-2',
          title: 'Beat 2',
          description: 'Description 2',
          typeId: 'vtr',
          position: { x: 350, y: 100 },
          links: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ],
      beatTypes: [
        { id: 'news', name: 'Noticia', color: '#2196F3', icon: 'mdi-newspaper' },
        { id: 'vtr', name: 'VTR', color: '#9C27B0', icon: 'mdi-video' }
      ],
      beatGroups: [], // Add beatGroups to prevent undefined errors
      blocks: [], // Add blocks to prevent undefined errors
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    })),
    saveCurrentProject: vi.fn(),
    updateBeat: vi.fn((_project, beatId, updates) => ({
      ..._project,
      beats: _project.beats.map((b: { id: string }) =>
        b.id === beatId ? { ...b, ...updates } : b
      )
    })),
    createBeat: vi.fn((typeId, _project) => ({
      id: 'new-beat',
      title: 'New Beat',
      description: '',
      typeId,
      position: { x: 600, y: 100 },
      links: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })),
    deleteBeat: vi.fn((project, beatId) => ({
      ...project,
      beats: project.beats.filter((b: { id: string }) => b.id !== beatId)
    })),
    getGroupForBeat: vi.fn(() => null),
    removeBeatFromGroup: vi.fn((project) => project),
    belongsToBeatGroup: vi.fn(() => false),
    belongsToBlock: vi.fn(() => false), // Add belongsToBlock mock
    getBlockForBeat: vi.fn(() => undefined), // Add getBlockForBeat mock
    deleteBeatGroup: vi.fn((project, groupId) => ({
      ...project,
      beatGroups: project.beatGroups.filter((g: { id: string }) => g.id !== groupId)
    })),
    updateBeatGroup: vi.fn((project, groupId, updates) => ({
      ...project,
      beatGroups: project.beatGroups.map((g: { id: string }) =>
        g.id === groupId ? { ...g, ...updates } : g
      )
    }))
  }
}))

describe('BeatEditorView', () => {
  it('should load and display project data', async () => {
    await router.push('/canvas')
    await router.isReady()
    
    const wrapper = mount(BeatEditorView, {
      global: {
        plugins: [i18n, router]
      }
    })
    // Check that beats are rendered
    expect(wrapper.text()).toContain('Beat 1')
    expect(wrapper.text()).toContain('Beat 2')
  })

  it('should render beat cards with titles', async () => {
    await router.push('/canvas')
    await router.isReady()
    
    const wrapper = mount(BeatEditorView, {
      global: {
        plugins: [i18n, router]
      }
    })
    expect(wrapper.text()).toContain('Beat 1')
    expect(wrapper.text()).toContain('Beat 2')
  })

  it('should have canvas container', async () => {
    await router.push('/canvas')
    await router.isReady()
    
    const wrapper = mount(BeatEditorView, {
      global: {
        plugins: [i18n, router]
      }
    })
    expect(wrapper.find('.beat-canvas').exists()).toBe(true)
  })
})
