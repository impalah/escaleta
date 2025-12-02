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
        expect(beat.order).toBeDefined()
        expect(typeof beat.order).toBe('number')
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
      expect(beat.order).toBeDefined()
      expect(typeof beat.order).toBe('number')
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

    it('should assign next order number to new beat', () => {
      const project = service.createExampleProject()
      const maxOrder = Math.max(...project.beats.map(b => b.order))

      const typeId = project.beatTypes[0].id
      const newBeat = service.createBeat(typeId, project)

      expect(newBeat.order).toBe(maxOrder + 1)
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

  describe('getSortedBeats', () => {
    it('should return beats sorted by order field', () => {
      const project = service.createExampleProject()
      
      const sorted = service.getSortedBeats(project)

      // Check that beats are sorted by order
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].order).toBeLessThanOrEqual(sorted[i + 1].order)
      }
    })

    it('should not mutate original project beats array', () => {
      const project = service.createExampleProject()
      const originalOrder = project.beats.map(b => b.id)
      
      service.getSortedBeats(project)

      // Original array should remain unchanged
      const currentOrder = project.beats.map(b => b.id)
      expect(currentOrder).toEqual(originalOrder)
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

  describe('connectBeats', () => {
    it('should connect two beats bidirectionally', () => {
      const project = service.createExampleProject()
      const [beat1, beat2] = project.beats

      const updated = service.connectBeats(project, beat1.id, beat2.id)

      const updatedBeat1 = updated.beats.find(b => b.id === beat1.id)
      const updatedBeat2 = updated.beats.find(b => b.id === beat2.id)

      expect(updatedBeat1?.nextBeatId).toBe(beat2.id)
      expect(updatedBeat2?.prevBeatId).toBe(beat1.id)
    })

    it('should update timestamps when connecting beats', async () => {
      const project = service.createExampleProject()
      const [beat1, beat2] = project.beats
      const originalTimestamp1 = beat1.updatedAt
      const originalTimestamp2 = beat2.updatedAt

      await new Promise(resolve => setTimeout(resolve, 10))

      const updated = service.connectBeats(project, beat1.id, beat2.id)

      const updatedBeat1 = updated.beats.find(b => b.id === beat1.id)
      const updatedBeat2 = updated.beats.find(b => b.id === beat2.id)

      expect(updatedBeat1?.updatedAt).not.toBe(originalTimestamp1)
      expect(updatedBeat2?.updatedAt).not.toBe(originalTimestamp2)
    })
  })

  describe('disconnectBeat', () => {
    it('should clear prevBeatId and nextBeatId from the beat', () => {
      const project = service.createExampleProject()
      const [beat1, beat2, beat3] = project.beats
      
      // Connect beats first
      let updated = service.connectBeats(project, beat1.id, beat2.id)
      updated = service.connectBeats(updated, beat2.id, beat3.id)

      // Disconnect middle beat
      updated = service.disconnectBeat(updated, beat2.id)

      const disconnectedBeat = updated.beats.find(b => b.id === beat2.id)
      expect(disconnectedBeat?.prevBeatId).toBeUndefined()
      expect(disconnectedBeat?.nextBeatId).toBeUndefined()
    })

    it('should clear nextBeatId from previous neighbor', () => {
      const project = service.createExampleProject()
      const [beat1, beat2] = project.beats
      
      let updated = service.connectBeats(project, beat1.id, beat2.id)
      updated = service.disconnectBeat(updated, beat2.id)

      const updatedBeat1 = updated.beats.find(b => b.id === beat1.id)
      expect(updatedBeat1?.nextBeatId).toBeUndefined()
    })

    it('should clear prevBeatId from next neighbor', () => {
      const project = service.createExampleProject()
      const [beat1, beat2] = project.beats
      
      let updated = service.connectBeats(project, beat1.id, beat2.id)
      updated = service.disconnectBeat(updated, beat1.id)

      const updatedBeat2 = updated.beats.find(b => b.id === beat2.id)
      expect(updatedBeat2?.prevBeatId).toBeUndefined()
    })

    it('should handle disconnecting a beat with no neighbors', () => {
      const project = service.createExampleProject()
      const beat = project.beats[0]

      const updated = service.disconnectBeat(project, beat.id)

      const disconnectedBeat = updated.beats.find(b => b.id === beat.id)
      expect(disconnectedBeat?.prevBeatId).toBeUndefined()
      expect(disconnectedBeat?.nextBeatId).toBeUndefined()
    })
  })

  describe('getBeatHeight', () => {
    it('should return fallback height when element not found', () => {
      const project = service.createExampleProject()
      const beatId = project.beats[0].id

      const height = service.getBeatHeight(beatId)

      expect(height).toBe(80) // Default fallback
    })
  })

  describe('isAfterBeat', () => {
    it('should return true when beatId is after afterBeatId in chain', () => {
      const project = service.createExampleProject()
      const [beat1, beat2, beat3] = project.beats
      
      // Create chain: beat1 -> beat2 -> beat3
      let updated = service.connectBeats(project, beat1.id, beat2.id)
      updated = service.connectBeats(updated, beat2.id, beat3.id)

      const result = service.isAfterBeat(updated, beat3.id, beat1.id)
      expect(result).toBe(true)
    })

    it('should return false when beatId is before afterBeatId in chain', () => {
      const project = service.createExampleProject()
      const [beat1, beat2, beat3] = project.beats
      
      let updated = service.connectBeats(project, beat1.id, beat2.id)
      updated = service.connectBeats(updated, beat2.id, beat3.id)

      const result = service.isAfterBeat(updated, beat1.id, beat3.id)
      expect(result).toBe(false)
    })

    it('should return false when beats are not connected', () => {
      const project = service.createExampleProject()
      const [beat1, beat2] = project.beats

      const result = service.isAfterBeat(project, beat2.id, beat1.id)
      expect(result).toBe(false)
    })

    it('should return false when chain exceeds 100 beats (safety limit)', () => {
      // This tests the safety limit that also protects against infinite loops
      let project = service.createExampleProject()
      
      // Create a very long chain
      const beats = Array.from({ length: 101 }, (_, i) => {
        const typeId = project.beatTypes[0].id
        return service.createBeat(typeId, project)
      })

      // Connect all beats in sequence
      for (let i = 0; i < beats.length - 1; i++) {
        project = service.connectBeats(project, beats[i].id, beats[i + 1].id)
      }

      // Should return false due to safety limit
      const result = service.isAfterBeat(project, beats[100].id, beats[0].id)
      expect(result).toBe(false)
    })
  })

  describe('connectToBottom', () => {
    it('should position beat below target when target has no next beat', () => {
      const project = service.createExampleProject()
      const [beat1, beat2] = project.beats
      
      const updated = service.connectToBottom(project, beat1.id, beat2.id)

      const movedBeat = updated.beats.find(b => b.id === beat1.id)
      const targetBeat = updated.beats.find(b => b.id === beat2.id)

      expect(movedBeat?.position.y).toBeGreaterThan(targetBeat!.position.y)
      expect(movedBeat?.prevBeatId).toBe(beat2.id)
      expect(targetBeat?.nextBeatId).toBe(beat1.id)
    })

    it('should disconnect beat from previous connections', () => {
      const project = service.createExampleProject()
      const [beat1, beat2, beat3] = project.beats
      
      // Connect beat1 -> beat3 first
      let updated = service.connectBeats(project, beat1.id, beat3.id)
      
      // Now connect beat1 to bottom of beat2
      updated = service.connectToBottom(updated, beat1.id, beat2.id)

      const beat3Updated = updated.beats.find(b => b.id === beat3.id)
      expect(beat3Updated?.prevBeatId).toBeUndefined()
    })

    it('should insert between beats when target has next beat', () => {
      const project = service.createExampleProject()
      const [beat1, beat2, beat3] = project.beats
      
      // Create chain: beat2 -> beat3
      let updated = service.connectBeats(project, beat2.id, beat3.id)
      
      // Insert beat1 between beat2 and beat3
      updated = service.connectToBottom(updated, beat1.id, beat2.id)

      const beat1Updated = updated.beats.find(b => b.id === beat1.id)
      const beat2Updated = updated.beats.find(b => b.id === beat2.id)
      const beat3Updated = updated.beats.find(b => b.id === beat3.id)

      expect(beat2Updated?.nextBeatId).toBe(beat1.id)
      expect(beat1Updated?.prevBeatId).toBe(beat2.id)
      expect(beat1Updated?.nextBeatId).toBe(beat3.id)
      expect(beat3Updated?.prevBeatId).toBe(beat1.id)
    })
  })

  describe('connectToTop', () => {
    it('should position beat above target when target has no previous beat', () => {
      const project = service.createExampleProject()
      const [beat1, beat2] = project.beats
      
      const updated = service.connectToTop(project, beat1.id, beat2.id)

      const movedBeat = updated.beats.find(b => b.id === beat1.id)
      const targetBeat = updated.beats.find(b => b.id === beat2.id)

      expect(movedBeat?.position.y).toBeLessThan(targetBeat!.position.y)
      expect(movedBeat?.nextBeatId).toBe(beat2.id)
      expect(targetBeat?.prevBeatId).toBe(beat1.id)
    })

    it('should disconnect beat from previous connections', () => {
      const project = service.createExampleProject()
      const [beat1, beat2, beat3] = project.beats
      
      let updated = service.connectBeats(project, beat1.id, beat3.id)
      updated = service.connectToTop(updated, beat1.id, beat2.id)

      const beat3Updated = updated.beats.find(b => b.id === beat3.id)
      expect(beat3Updated?.prevBeatId).toBeUndefined()
    })

    it('should insert between beats when target has previous beat', () => {
      const project = service.createExampleProject()
      const [beat1, beat2, beat3] = project.beats
      
      // Create chain: beat2 -> beat3
      let updated = service.connectBeats(project, beat2.id, beat3.id)
      
      // Insert beat1 between beat2 and beat3 (connect to top of beat3)
      updated = service.connectToTop(updated, beat1.id, beat3.id)

      const beat1Updated = updated.beats.find(b => b.id === beat1.id)
      const beat2Updated = updated.beats.find(b => b.id === beat2.id)
      const beat3Updated = updated.beats.find(b => b.id === beat3.id)

      expect(beat2Updated?.nextBeatId).toBe(beat1.id)
      expect(beat1Updated?.prevBeatId).toBe(beat2.id)
      expect(beat1Updated?.nextBeatId).toBe(beat3.id)
      expect(beat3Updated?.prevBeatId).toBe(beat1.id)
    })
  })

  describe('insertBetween', () => {
    it('should insert beat between two connected beats', () => {
      const project = service.createExampleProject()
      const [beat1, beat2, beat3] = project.beats
      
      // Create chain: beat1 -> beat3
      let updated = service.connectBeats(project, beat1.id, beat3.id)
      
      // Insert beat2 between them
      updated = service.insertBetween(updated, beat2.id, beat1.id, beat3.id)

      const beat1Updated = updated.beats.find(b => b.id === beat1.id)
      const beat2Updated = updated.beats.find(b => b.id === beat2.id)
      const beat3Updated = updated.beats.find(b => b.id === beat3.id)

      expect(beat1Updated?.nextBeatId).toBe(beat2.id)
      expect(beat2Updated?.prevBeatId).toBe(beat1.id)
      expect(beat2Updated?.nextBeatId).toBe(beat3.id)
      expect(beat3Updated?.prevBeatId).toBe(beat2.id)
    })

    it('should position inserted beat between prev and next beats', () => {
      const project = service.createExampleProject()
      const [beat1, beat2, beat3] = project.beats
      
      // Set specific positions
      let updated = service.updateBeat(project, beat1.id, { position: { x: 100, y: 100 } })
      updated = service.updateBeat(updated, beat3.id, { position: { x: 100, y: 300 } })
      
      updated = service.connectBeats(updated, beat1.id, beat3.id)
      updated = service.insertBetween(updated, beat2.id, beat1.id, beat3.id)

      const beat1Updated = updated.beats.find(b => b.id === beat1.id)
      const beat2Updated = updated.beats.find(b => b.id === beat2.id)
      const beat3Updated = updated.beats.find(b => b.id === beat3.id)

      expect(beat2Updated?.position.y).toBeGreaterThan(beat1Updated!.position.y)
      expect(beat2Updated?.position.y).toBeLessThan(beat3Updated!.position.y)
    })

    it('should shift subsequent beats downward', () => {
      const project = service.createExampleProject()
      const [beat1, beat2, beat3, beat4] = project.beats
      
      // Create chain: beat1 -> beat3 -> beat4
      let updated = service.connectBeats(project, beat1.id, beat3.id)
      updated = service.connectBeats(updated, beat3.id, beat4.id)
      
      const originalBeat3Y = updated.beats.find(b => b.id === beat3.id)!.position.y
      const originalBeat4Y = updated.beats.find(b => b.id === beat4.id)!.position.y
      
      // Insert beat2 between beat1 and beat3
      updated = service.insertBetween(updated, beat2.id, beat1.id, beat3.id)

      const beat3Updated = updated.beats.find(b => b.id === beat3.id)
      const beat4Updated = updated.beats.find(b => b.id === beat4.id)

      // beat3 and beat4 should be shifted down
      expect(beat3Updated?.position.y).toBeGreaterThan(originalBeat3Y)
      expect(beat4Updated?.position.y).toBeGreaterThan(originalBeat4Y)
    })
  })
})
