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

  describe('BeatGroup operations', () => {
    it('should create a beat group', () => {
      const project = service.createExampleProject()
      
      const group = service.createBeatGroup(project, 'Test Group')
      const updated = service.addBeatGroup(project, group)
      
      expect(updated.beatGroups.length).toBe(1)
      expect(updated.beatGroups[0].name).toBe('Test Group')
      expect(updated.beatGroups[0].description).toBe('')
      expect(updated.beatGroups[0].beatIds).toEqual([])
    })

    it('should drop beat into group and position it correctly', () => {
      const project = service.createExampleProject()
      const beat = project.beats[0]
      
      // Create a group at position (100, 200)
      const group = service.createBeatGroup(project, 'Test Group')
      let updated = service.addBeatGroup(project, { ...group, position: { x: 100, y: 200 } })
      const groupId = updated.beatGroups[0].id
      
      // Drop beat into group
      updated = service.dropBeatIntoGroup(updated, beat.id, groupId)
      
      expect(updated.beatGroups[0].beatIds).toContain(beat.id)
      
      // Beat should be positioned with group's X coordinate
      const updatedBeat = updated.beats.find(b => b.id === beat.id)
      expect(updatedBeat?.position.x).toBe(100) // Group X
      expect(updatedBeat?.position.y).toBe(260) // GROUP_HEIGHT (50) + GAP (10) + groupY (200)
    })

    it('should remove beat from group and reposition remaining beats', () => {
      const project = service.createExampleProject()
      const [beat1, beat2, beat3] = project.beats
      
      // Create group and add beats
      const group = service.createBeatGroup(project, 'Test Group')
      let updated = service.addBeatGroup(project, { ...group, position: { x: 100, y: 200 } })
      const groupId = updated.beatGroups[0].id
      
      updated = service.dropBeatIntoGroup(updated, beat1.id, groupId)
      updated = service.dropBeatIntoGroup(updated, beat2.id, groupId)
      updated = service.dropBeatIntoGroup(updated, beat3.id, groupId)
      
      expect(updated.beatGroups[0].beatIds.length).toBe(3)
      
      // Remove middle beat
      updated = service.removeBeatFromGroup(updated, beat2.id, groupId)
      
      expect(updated.beatGroups[0].beatIds.length).toBe(2)
      expect(updated.beatGroups[0].beatIds).not.toContain(beat2.id)
      
      // Remaining beats should be repositioned
      const updatedBeat3 = updated.beats.find(b => b.id === beat3.id)
      // beat3 should now be in position 1 (after beat1) instead of position 2
      expect(updatedBeat3?.position.y).toBe(350) // 200 + 50 + 10 + (1 * (80 + 10))
    })

    it('should get group for beat', () => {
      const project = service.createExampleProject()
      const beat = project.beats[0]
      
      const group = service.createBeatGroup(project, 'Test Group')
      let updated = service.addBeatGroup(project, group)
      const groupId = updated.beatGroups[0].id
      updated = service.dropBeatIntoGroup(updated, beat.id, groupId)
      
      const foundGroup = service.getGroupForBeat(updated, beat.id)
      
      expect(foundGroup).toBeDefined()
      expect(foundGroup?.id).toBe(groupId)
    })

    it('should delete beat group', () => {
      const project = service.createExampleProject()
      
      const group = service.createBeatGroup(project, 'Test Group')
      let updated = service.addBeatGroup(project, group)
      const groupId = updated.beatGroups[0].id
      
      updated = service.deleteBeatGroup(updated, groupId)
      
      expect(updated.beatGroups.length).toBe(0)
    })

    it('should update beat group', () => {
      const project = service.createExampleProject()
      
      const group = service.createBeatGroup(project, 'Test Group')
      let updated = service.addBeatGroup(project, group)
      const groupId = updated.beatGroups[0].id
      
      updated = service.updateBeatGroup(updated, groupId, { name: 'Updated Name' })
      
      expect(updated.beatGroups[0].name).toBe('Updated Name')
    })

    it('should insert beat into group at specific position (new beat to group)', () => {
      const project = service.createExampleProject()
      const [beat1, beat2, beat3, beat4] = project.beats
      
      // Create group with 3 beats
      const group = service.createBeatGroup(project, 'Test Group')
      let updated = service.addBeatGroup(project, { ...group, position: { x: 100, y: 200 } })
      const groupId = updated.beatGroups[0].id
      
      updated = service.dropBeatIntoGroup(updated, beat1.id, groupId)
      updated = service.dropBeatIntoGroup(updated, beat2.id, groupId)
      updated = service.dropBeatIntoGroup(updated, beat3.id, groupId)
      
      expect(updated.beatGroups[0].beatIds).toEqual([beat1.id, beat2.id, beat3.id])
      
      // Insert beat4 before beat2 (index 1)
      updated = service.insertBeatIntoGroupAtPosition(updated, beat4.id, beat2.id, groupId)
      
      // Check order: beat1, beat4, beat2, beat3
      expect(updated.beatGroups[0].beatIds).toEqual([beat1.id, beat4.id, beat2.id, beat3.id])
      
      // Check positions are correct
      const updatedBeat4 = updated.beats.find(b => b.id === beat4.id)
      const updatedBeat2 = updated.beats.find(b => b.id === beat2.id)
      
      expect(updatedBeat4?.position.x).toBe(100) // Group X
      expect(updatedBeat4?.position.y).toBe(260 + 90) // Second position (index 1)
      expect(updatedBeat2?.position.y).toBe(260 + 90 + 90) // Third position (index 2)
    })

    it('should reorder beat within same group', () => {
      const project = service.createExampleProject()
      const [beat1, beat2, beat3] = project.beats
      
      // Create group with 3 beats
      const group = service.createBeatGroup(project, 'Test Group')
      let updated = service.addBeatGroup(project, { ...group, position: { x: 100, y: 200 } })
      const groupId = updated.beatGroups[0].id
      
      updated = service.dropBeatIntoGroup(updated, beat1.id, groupId)
      updated = service.dropBeatIntoGroup(updated, beat2.id, groupId)
      updated = service.dropBeatIntoGroup(updated, beat3.id, groupId)
      
      expect(updated.beatGroups[0].beatIds).toEqual([beat1.id, beat2.id, beat3.id])
      
      // Move beat3 to before beat1 (beginning)
      updated = service.insertBeatIntoGroupAtPosition(updated, beat3.id, beat1.id, groupId)
      
      // Check order: beat3, beat1, beat2
      expect(updated.beatGroups[0].beatIds).toEqual([beat3.id, beat1.id, beat2.id])
      expect(updated.beatGroups[0].beatIds.length).toBe(3) // No duplicates
    })

    it('should move beat from one group to another at specific position', () => {
      const project = service.createExampleProject()
      const [beat1, beat2, beat3, beat4] = project.beats
      
      // Create two groups
      const group1 = service.createBeatGroup(project, 'Group 1')
      let updated = service.addBeatGroup(project, { ...group1, position: { x: 100, y: 200 } })
      const groupId1 = updated.beatGroups[0].id
      
      const group2 = service.createBeatGroup(updated, 'Group 2')
      updated = service.addBeatGroup(updated, { ...group2, position: { x: 600, y: 200 } })
      const groupId2 = updated.beatGroups[1].id
      
      // Add beats to group1
      updated = service.dropBeatIntoGroup(updated, beat1.id, groupId1)
      updated = service.dropBeatIntoGroup(updated, beat2.id, groupId1)
      
      // Add beats to group2
      updated = service.dropBeatIntoGroup(updated, beat3.id, groupId2)
      updated = service.dropBeatIntoGroup(updated, beat4.id, groupId2)
      
      expect(updated.beatGroups[0].beatIds).toEqual([beat1.id, beat2.id])
      expect(updated.beatGroups[1].beatIds).toEqual([beat3.id, beat4.id])
      
      // Move beat2 from group1 to group2, insert before beat4
      updated = service.insertBeatIntoGroupAtPosition(updated, beat2.id, beat4.id, groupId2)
      
      // Check group1 only has beat1
      expect(updated.beatGroups[0].beatIds).toEqual([beat1.id])
      
      // Check group2 has beat3, beat2, beat4 in that order
      expect(updated.beatGroups[1].beatIds).toEqual([beat3.id, beat2.id, beat4.id])
      
      // Check beat2 position matches group2
      const updatedBeat2 = updated.beats.find(b => b.id === beat2.id)
      expect(updatedBeat2?.position.x).toBe(600) // Group 2 X
    })

    it('should handle inserting beat at same position (no-op)', () => {
      const project = service.createExampleProject()
      const [beat1, beat2] = project.beats
      
      // Create group with 2 beats
      const group = service.createBeatGroup(project, 'Test Group')
      let updated = service.addBeatGroup(project, { ...group, position: { x: 100, y: 200 } })
      const groupId = updated.beatGroups[0].id
      
      updated = service.dropBeatIntoGroup(updated, beat1.id, groupId)
      updated = service.dropBeatIntoGroup(updated, beat2.id, groupId)
      
      // Try to insert beat1 at its own position
      const before = updated.beatGroups[0].beatIds
      updated = service.insertBeatIntoGroupAtPosition(updated, beat1.id, beat1.id, groupId)
      
      // Should remain unchanged
      expect(updated.beatGroups[0].beatIds).toEqual(before)
    })
  })

  describe('Block Operations', () => {
    it('should create a new block with default properties', () => {
      const project = service.createExampleProject()
      const block = service.createBlock(project, 'Test Block')

      expect(block.id).toBeDefined()
      expect(block.name).toBe('Test Block')
      expect(block.description).toBe('')
      expect(block.backgroundColor).toMatch(/^#[0-9A-F]{6}$/i)
      expect(block.position).toBeDefined()
      expect(block.size).toEqual({ width: 600, height: 400 })
      expect(block.groupIds).toEqual([])
      expect(block.order).toBe(1) // First block has order 1
    })

    it('should add a block to project', () => {
      const project = service.createExampleProject()
      const block = service.createBlock(project, 'Test Block')
      const updated = service.addBlock(project, block)

      expect(updated.blocks).toHaveLength(1)
      expect(updated.blocks[0].id).toBe(block.id)
      expect(updated.blocks[0].name).toBe('Test Block')
    })

    it('should update a block', () => {
      const project = service.createExampleProject()
      const block = service.createBlock(project, 'Test Block')
      let updated = service.addBlock(project, block)

      updated = service.updateBlock(updated, block.id, {
        name: 'Updated Block',
        description: 'New description',
        backgroundColor: '#FF0000'
      })

      const updatedBlock = updated.blocks.find(b => b.id === block.id)
      expect(updatedBlock).toBeDefined()
      expect(updatedBlock!.name).toBe('Updated Block')
      expect(updatedBlock!.description).toBe('New description')
      expect(updatedBlock!.backgroundColor).toBe('#FF0000')
    })

    it('should delete a block', () => {
      const project = service.createExampleProject()
      const block = service.createBlock(project, 'Test Block')
      let updated = service.addBlock(project, block)

      expect(updated.blocks).toHaveLength(1)

      updated = service.deleteBlock(updated, block.id)

      expect(updated.blocks).toHaveLength(0)
    })

    it('should create blocks at grid positions', () => {
      const project = service.createExampleProject()
      const block1 = service.createBlock(project, 'Block 1')
      const block2 = service.createBlock({ ...project, blocks: [block1] }, 'Block 2')
      const block3 = service.createBlock({ ...project, blocks: [block1, block2] }, 'Block 3')

      // First block at (50, 50)
      expect(block1.position).toEqual({ x: 50, y: 50 })
      // Second block at (750, 50) - 700px horizontal spacing
      expect(block2.position).toEqual({ x: 750, y: 50 })
      // Third block at (50, 550) - wraps to next row with 500px vertical spacing
      expect(block3.position).toEqual({ x: 50, y: 550 })
    })
  })
})
