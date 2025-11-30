import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProjectService } from '@/application/ProjectService'
import type { Project } from '@/domain/entities'

// Mock the storage service
vi.mock('@/infrastructure/LocalStorageService', () => ({
  storageService: {
    saveProject: vi.fn(),
    loadProject: vi.fn(),
    clearProject: vi.fn(),
    hasProject: vi.fn()
  }
}))

describe('ProjectService', () => {
  let service: ProjectService

  beforeEach(() => {
    service = new ProjectService()
    vi.clearAllMocks()
  })

  describe('createExampleProject', () => {
    it('should create a project with beats', () => {
      const project = service.createExampleProject()

      expect(project.id).toBeDefined()
      expect(project.name).toBe('Example News Show')
      expect(project.beats.length).toBeGreaterThan(0)
      expect(project.beatTypes.length).toBeGreaterThan(0)
    })

    it('should create beats with valid structure', () => {
      const project = service.createExampleProject()

      project.beats.forEach(beat => {
        expect(beat.id).toBeDefined()
        expect(beat.title).toBeDefined()
        expect(beat.description).toBeDefined()
        expect(beat.typeId).toBeDefined()
        expect(beat.position).toHaveProperty('x')
        expect(beat.position).toHaveProperty('y')
        expect(Array.isArray(beat.links)).toBe(true)
        expect(beat.createdAt).toBeDefined()
        expect(beat.updatedAt).toBeDefined()
      })
    })

    it('should create at least 5 beats', () => {
      const project = service.createExampleProject()
      expect(project.beats.length).toBeGreaterThanOrEqual(5)
    })
  })

  describe('createNewProject', () => {
    it('should create an empty project with given name', () => {
      const project = service.createNewProject('Test Project', 'Test Description')

      expect(project.name).toBe('Test Project')
      expect(project.description).toBe('Test Description')
      expect(project.beats).toEqual([])
      expect(project.beatTypes.length).toBeGreaterThan(0)
    })
  })

  describe('createBeat', () => {
    it('should create a new beat with default values', () => {
      const project = service.createExampleProject()
      const typeId = project.beatTypes[0].id

      const beat = service.createBeat(typeId, project)

      expect(beat.id).toBeDefined()
      expect(beat.typeId).toBe(typeId)
      expect(beat.title).toContain(project.beatTypes[0].name)
      expect(beat.position).toHaveProperty('x')
      expect(beat.position).toHaveProperty('y')
    })

    it('should position new beat to the right of existing beats', () => {
      const project = service.createExampleProject()
      const maxX = Math.max(...project.beats.map(b => b.position.x))

      const typeId = project.beatTypes[0].id
      const newBeat = service.createBeat(typeId, project)

      expect(newBeat.position.x).toBeGreaterThan(maxX)
    })
  })

  describe('updateBeat', () => {
    it('should update beat properties', () => {
      const project = service.createExampleProject()
      const beatId = project.beats[0].id

      const updated = service.updateBeat(project, beatId, {
        title: 'Updated Title',
        description: 'Updated Description'
      })

      const updatedBeat = updated.beats.find(b => b.id === beatId)
      expect(updatedBeat?.title).toBe('Updated Title')
      expect(updatedBeat?.description).toBe('Updated Description')
    })

    it('should update the updatedAt timestamp', async () => {
      const project = service.createExampleProject()
      const beatId = project.beats[0].id
      const originalTimestamp = project.beats[0].updatedAt

      // Wait a bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10))

      const updated = service.updateBeat(project, beatId, { title: 'New Title' })

      const updatedBeat = updated.beats.find(b => b.id === beatId)
      expect(updatedBeat?.updatedAt).not.toBe(originalTimestamp)
    })
  })

  describe('deleteBeat', () => {
    it('should remove the specified beat', () => {
      const project = service.createExampleProject()
      const initialCount = project.beats.length
      const beatId = project.beats[0].id

      const updated = service.deleteBeat(project, beatId)

      expect(updated.beats.length).toBe(initialCount - 1)
      expect(updated.beats.find(b => b.id === beatId)).toBeUndefined()
    })
  })

  describe('saveCurrentProject', () => {
    it('should call storage service to save project', async () => {
      const project = service.createExampleProject()
      const { storageService: mockStorage } = await import('@/infrastructure/LocalStorageService')

      service.saveCurrentProject(project)

      expect(mockStorage.saveProject).toHaveBeenCalledWith(project)
    })
  })

  describe('loadCurrentProject', () => {
    it('should load project from storage if exists', async () => {
      const savedProject: Project = service.createExampleProject()
      const { storageService: mockStorage } = await import('@/infrastructure/LocalStorageService')
      vi.mocked(mockStorage.loadProject).mockReturnValue(savedProject)

      const loaded = service.loadCurrentProject()

      expect(loaded).toEqual(savedProject)
    })

    it('should create example project if no saved project exists', async () => {
      const { storageService: mockStorage } = await import('@/infrastructure/LocalStorageService')
      vi.mocked(mockStorage.loadProject).mockReturnValue(null)

      const loaded = service.loadCurrentProject()

      expect(loaded.name).toBe('Example News Show')
      expect(mockStorage.saveProject).toHaveBeenCalled()
    })
  })
})
