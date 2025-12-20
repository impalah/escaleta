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

    it('should check if beat belongs to group', () => {
      const project = service.createExampleProject()
      const beat = project.beats[0]
      
      const group = service.createBeatGroup(project, 'Test Group')
      let updated = service.addBeatGroup(project, { ...group, beatIds: [beat.id] })
      const groupId = updated.beatGroups[0].id
      
      const belongs = service.belongsToBeatGroup(updated, beat.id, groupId)
      
      expect(belongs).toBe(true)
    })
  })

  describe('BeatBlock operations', () => {
    it('should create a beat block', () => {
      const project = service.createExampleProject()
      
      // Create two groups first
      const group1 = service.createBeatGroup(project, 'Group 1')
      let updated = service.addBeatGroup(project, { ...group1, position: { x: 100, y: 200 } })
      const group1Id = updated.beatGroups[0].id
      
      const group2 = service.createBeatGroup(updated, 'Group 2')
      updated = service.addBeatGroup(updated, { ...group2, position: { x: 350, y: 200 } })
      const group2Id = updated.beatGroups[1].id
      
      // Create block with these groups
      updated = service.createBlock(updated, [group1Id, group2Id], 'Test Block')
      
      expect(updated.blocks.length).toBe(1)
      expect(updated.blocks[0].name).toBe('Test Block')
      expect(updated.blocks[0].groupIds).toEqual([group1Id, group2Id])
    })

    it('should delete a beat block', () => {
      const project = service.createExampleProject()
      
      const group1 = service.createBeatGroup(project, 'Group 1')
      let updated = service.addBeatGroup(project, { ...group1, position: { x: 100, y: 200 } })
      const group1Id = updated.beatGroups[0].id
      
      const group2 = service.createBeatGroup(updated, 'Group 2')
      updated = service.addBeatGroup(updated, { ...group2, position: { x: 350, y: 200 } })
      const group2Id = updated.beatGroups[1].id
      
      updated = service.createBlock(updated, [group1Id, group2Id], 'Test Block')
      const blockId = updated.blocks[0].id
      
      updated = service.deleteBlock(updated, blockId)
      
      expect(updated.blocks.length).toBe(0)
    })
  })

  describe('Lane utility methods', () => {
    it('should get lane for block', () => {
      const project = service.createExampleProject()
      
      // Create groups
      const group1 = service.createBeatGroup(project, 'Group 1')
      let updated = service.addBeatGroup(project, { ...group1, position: { x: 100, y: 200 } })
      const group1Id = updated.beatGroups[0].id
      
      const group2 = service.createBeatGroup(updated, 'Group 2')
      updated = service.addBeatGroup(updated, { ...group2, position: { x: 350, y: 200 } })
      const group2Id = updated.beatGroups[1].id
      
      // Create block
      updated = service.createBlock(updated, [group1Id, group2Id])
      const blockId = updated.blocks[0].id
      
      // Create lane
      updated = service.createLane(updated, [blockId])
      
      const lane = service.getLaneForBlock(updated, blockId)
      expect(lane).toBeDefined()
      expect(lane?.blockIds).toContain(blockId)
    })

    it('should check if block is first in lane', () => {
      const project = service.createExampleProject()
      
      // Create groups for first block
      const group1 = service.createBeatGroup(project, 'Group 1')
      let updated = service.addBeatGroup(project, { ...group1, position: { x: 100, y: 200 } })
      const group1Id = updated.beatGroups[0].id
      
      const group2 = service.createBeatGroup(updated, 'Group 2')
      updated = service.addBeatGroup(updated, { ...group2, position: { x: 350, y: 200 } })
      const group2Id = updated.beatGroups[1].id
      
      // Create groups for second block
      const group3 = service.createBeatGroup(updated, 'Group 3')
      updated = service.addBeatGroup(updated, { ...group3, position: { x: 600, y: 200 } })
      const group3Id = updated.beatGroups[2].id
      
      const group4 = service.createBeatGroup(updated, 'Group 4')
      updated = service.addBeatGroup(updated, { ...group4, position: { x: 850, y: 200 } })
      const group4Id = updated.beatGroups[3].id
      
      // Create blocks
      updated = service.createBlock(updated, [group1Id, group2Id])
      const block1Id = updated.blocks[0].id
      
      updated = service.createBlock(updated, [group3Id, group4Id])
      const block2Id = updated.blocks[1].id
      
      // Create lane
      updated = service.createLane(updated, [block1Id, block2Id])
      
      expect(service.isFirstBlockInLane(updated, block1Id)).toBe(true)
      expect(service.isFirstBlockInLane(updated, block2Id)).toBe(false)
    })
  })
})
