import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LocalStorageService } from '@/infrastructure/LocalStorageService'
import type { Project } from '@/domain/entities'

describe('LocalStorageService', () => {
  let service: LocalStorageService
  let mockLocalStorage: Record<string, string>

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {}

    global.localStorage = {
      getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key]
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {}
      }),
      length: 0,
      key: vi.fn()
    } as Storage

    service = new LocalStorageService()
  })

  describe('saveProject', () => {
    it('should save project to localStorage', () => {
      const project: Project = {
        id: 'test-id',
        name: 'Test Project',
        description: 'Test',
        beats: [],
        beatTypes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      service.saveProject(project)

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'escaleta.currentProject',
        expect.any(String)
      )
      expect(mockLocalStorage['escaleta.currentProject']).toBeDefined()
    })

    it('should serialize project correctly', () => {
      const project: Project = {
        id: 'test-id',
        name: 'Test Project',
        description: 'Test',
        beats: [],
        beatTypes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      service.saveProject(project)

      const saved = JSON.parse(mockLocalStorage['escaleta.currentProject'])
      expect(saved.id).toBe('test-id')
      expect(saved.name).toBe('Test Project')
    })
  })

  describe('loadProject', () => {
    it('should load project from localStorage', () => {
      const project: Project = {
        id: 'test-id',
        name: 'Test Project',
        description: 'Test',
        beats: [],
        beatTypes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      mockLocalStorage['escaleta.currentProject'] = JSON.stringify(project)

      const loaded = service.loadProject()

      expect(loaded).toEqual(project)
    })

    it('should return null if no project exists', () => {
      const loaded = service.loadProject()
      expect(loaded).toBeNull()
    })

    it('should return null if JSON is invalid', () => {
      mockLocalStorage['escaleta.currentProject'] = 'invalid json'

      const loaded = service.loadProject()

      expect(loaded).toBeNull()
    })
  })

  describe('clearProject', () => {
    it('should remove project from localStorage', () => {
      mockLocalStorage['escaleta.currentProject'] = 'some data'

      service.clearProject()

      expect(localStorage.removeItem).toHaveBeenCalledWith('escaleta.currentProject')
      expect(mockLocalStorage['escaleta.currentProject']).toBeUndefined()
    })
  })

  describe('hasProject', () => {
    it('should return true if project exists', () => {
      mockLocalStorage['escaleta.currentProject'] = 'some data'

      expect(service.hasProject()).toBe(true)
    })

    it('should return false if project does not exist', () => {
      expect(service.hasProject()).toBe(false)
    })
  })
})
