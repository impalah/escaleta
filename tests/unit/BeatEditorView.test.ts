import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BeatEditorView from '@/presentation/views/BeatEditorView.vue'

// Mock all child components
vi.mock('@/presentation/components/BeatCard.vue', () => ({
  default: {
    name: 'BeatCard',
    template: '<div class="beat-card">{{ beat.title }}</div>',
    props: ['beat', 'beatType']
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
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    })),
    saveCurrentProject: vi.fn(),
    updateBeat: vi.fn((project, beatId, updates) => ({
      ...project,
      beats: project.beats.map((b: { id: string }) =>
        b.id === beatId ? { ...b, ...updates } : b
      )
    })),
    createBeat: vi.fn((typeId, project) => ({
      id: 'new-beat',
      title: 'New Beat',
      description: '',
      typeId,
      position: { x: 600, y: 100 },
      links: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))
  }
}))

describe('BeatEditorView', () => {
  it('should load and display project data', () => {
    const wrapper = mount(BeatEditorView)
    // Check that beats are rendered
    expect(wrapper.text()).toContain('Beat 1')
    expect(wrapper.text()).toContain('Beat 2')
  })

  it('should render beat cards with titles', () => {
    const wrapper = mount(BeatEditorView)
    expect(wrapper.text()).toContain('Beat 1')
    expect(wrapper.text()).toContain('Beat 2')
  })

  it('should have canvas container', () => {
    const wrapper = mount(BeatEditorView)
    expect(wrapper.find('.beat-canvas').exists()).toBe(true)
  })
})
