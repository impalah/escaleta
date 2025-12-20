import { describe, it, expect, beforeEach } from 'vitest'
import { BeatManagementService } from '@/application/services/BeatManagementService'
import { BlockManagementService } from '@/application/services/BlockManagementService'
import { LaneManagementService } from '@/application/services/LaneManagementService'
import { LocalStorageService } from '@/infrastructure/LocalStorageService'
import type { Project } from '@/domain/entities'

const createMockProject = (): Project => ({
  id: 'project-1',
  name: 'Test Project',
  description: 'Test',
  beats: [],
  beatTypes: [{ id: 'news', name: 'News', color: '#2196F3', icon: 'mdi-newspaper' }],
  beatGroups: [],
  blocks: [],
  lanes: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
})

describe('Service integration tests', () => {
  let storageService: LocalStorageService
  let beatService: BeatManagementService
  let blockService: BlockManagementService
  let laneService: LaneManagementService

  beforeEach(() => {
    storageService = new LocalStorageService()
    beatService = new BeatManagementService(storageService)
    blockService = new BlockManagementService(storageService)
    laneService = new LaneManagementService(storageService)
  })

  describe('BeatManagementService', () => {
    it('should create beat', () => {
      const project = createMockProject()
      const updated = beatService.createBeat(project, 'news')
      expect(updated.beats).toHaveLength(1)
    })

    it('should update beat', () => {
      let project = createMockProject()
      project = beatService.createBeat(project, 'news')
      const beatId = project.beats[0].id

      const updated = beatService.updateBeat(project, beatId, { title: 'Updated Title' })
      expect(updated.beats[0].title).toBe('Updated Title')
    })

    it('should delete beat', () => {
      let project = createMockProject()
      project = beatService.createBeat(project, 'news')
      const beatId = project.beats[0].id

      const updated = beatService.deleteBeat(project, beatId)
      expect(updated.beats).toHaveLength(0)
    })

    it('should create beat group', () => {
      const project = createMockProject()
      const updated = beatService.createBeatGroup(project, 'Group 1')
      expect(updated.beatGroups).toHaveLength(1)
    })

    it('should add beats to group', () => {
      let project = createMockProject()
      project = beatService.createBeat(project, 'news')
      project = beatService.createBeatGroup(project, 'Group 1')
      
      const beatId = project.beats[0].id
      const groupId = project.beatGroups[0].id
      
      const updated = beatService.addBeatsToGroup(project, groupId, [beatId])
      expect(updated.beatGroups[0].beatIds).toContain(beatId)
    })

    it('should insert beat before in group', () => {
      let project = createMockProject()
      project = beatService.createBeat(project, 'news')
      project = beatService.createBeat(project, 'news')
      project = beatService.createBeat(project, 'news')
      const [b1, b2, b3] = project.beats.map(b => b.id)
      project = beatService.createBeatGroup(project, 'Group 1', [b1, b3])
      const groupId = project.beatGroups[0].id

      const updated = beatService.insertBeatBeforeInGroup(project, groupId, b2, b3)
      expect(updated.beatGroups[0].beatIds).toEqual([b1, b2, b3])
    })

    it('should remove beat from group', () => {
      let project = createMockProject()
      project = beatService.createBeat(project, 'news')
      project = beatService.createBeatGroup(project, 'Group 1')
      const beatId = project.beats[0].id
      const groupId = project.beatGroups[0].id
      project = beatService.addBeatsToGroup(project, groupId, [beatId])

      const updated = beatService.removeBeatFromGroup(project, beatId, groupId)
      expect(updated.beatGroups[0].beatIds).not.toContain(beatId)
    })

    it('should delete beat group', () => {
      let project = createMockProject()
      project = beatService.createBeatGroup(project, 'Group 1')
      const groupId = project.beatGroups[0].id

      const updated = beatService.deleteBeatGroup(project, groupId)
      expect(updated.beatGroups).toHaveLength(0)
    })

    it('should update beat group', () => {
      let project = createMockProject()
      project = beatService.createBeatGroup(project, 'Old Name')
      const groupId = project.beatGroups[0].id

      const updated = beatService.updateBeatGroup(project, groupId, { name: 'New Name' })
      expect(updated.beatGroups[0].name).toBe('New Name')
    })

    it('should get sorted beats', () => {
      let project = createMockProject()
      project = beatService.createBeat(project, 'news')
      project = beatService.createBeat(project, 'news')

      const sorted = beatService.getSortedBeats(project)
      expect(sorted).toHaveLength(2)
    })
  })

  describe('BlockManagementService', () => {
    it('should create block', () => {
      let project = createMockProject()
      project = beatService.createBeatGroup(project, 'G1')
      project = beatService.createBeatGroup(project, 'G2')
      const [g1, g2] = project.beatGroups.map(g => g.id)

      const updated = blockService.createBlock(project, [g1, g2])
      expect(updated.blocks).toHaveLength(1)
    })

    it('should update block', () => {
      let project = createMockProject()
      project = beatService.createBeatGroup(project, 'G1')
      project = beatService.createBeatGroup(project, 'G2')
      const [g1, g2] = project.beatGroups.map(g => g.id)
      project = blockService.createBlock(project, [g1, g2], 'Old Name')
      const blockId = project.blocks[0].id

      const updated = blockService.updateBlock(project, blockId, { name: 'New Name' })
      expect(updated.blocks[0].name).toBe('New Name')
    })

    it('should delete block', () => {
      let project = createMockProject()
      project = beatService.createBeatGroup(project, 'G1')
      project = beatService.createBeatGroup(project, 'G2')
      const [g1, g2] = project.beatGroups.map(g => g.id)
      project = blockService.createBlock(project, [g1, g2])
      const blockId = project.blocks[0].id

      const updated = blockService.deleteBlock(project, blockId)
      expect(updated.blocks).toHaveLength(0)
    })

    it('should add group to block', () => {
      let project = createMockProject()
      project = beatService.createBeatGroup(project, 'G1')
      project = beatService.createBeatGroup(project, 'G2')
      project = beatService.createBeatGroup(project, 'G3')
      const [g1, g2, g3] = project.beatGroups.map(g => g.id)
      project = blockService.createBlock(project, [g1, g2])
      const blockId = project.blocks[0].id

      const updated = blockService.addGroupToBlock(project, blockId, g3)
      expect(updated.blocks[0].groupIds).toContain(g3)
    })

    it('should remove group from block', () => {
      let project = createMockProject()
      project = beatService.createBeatGroup(project, 'G1')
      project = beatService.createBeatGroup(project, 'G2')
      project = beatService.createBeatGroup(project, 'G3')
      const [g1, g2, g3] = project.beatGroups.map(g => g.id)
      project = blockService.createBlock(project, [g1, g2, g3])
      const blockId = project.blocks[0].id

      const updated = blockService.removeGroupFromBlock(project, blockId, g1)
      expect(updated.blocks[0].groupIds).not.toContain(g1)
    })

    it('should get block for group', () => {
      let project = createMockProject()
      project = beatService.createBeatGroup(project, 'G1')
      project = beatService.createBeatGroup(project, 'G2')
      const [g1, g2] = project.beatGroups.map(g => g.id)
      project = blockService.createBlock(project, [g1, g2])

      const block = blockService.getBlockForGroup(project, g1)
      expect(block).toBeDefined()
      expect(block?.groupIds).toContain(g1)
    })

    it('should reposition groups in block', () => {
      let project = createMockProject()
      project = beatService.createBeatGroup(project, 'G1')
      project = beatService.createBeatGroup(project, 'G2')
      const [g1, g2] = project.beatGroups.map(g => g.id)
      project = blockService.createBlock(project, [g1, g2])
      const blockId = project.blocks[0].id

      const updated = blockService.repositionGroupsInBlock(project, blockId)
      expect(updated.beatGroups).toHaveLength(2)
    })

    it('should get block width', () => {
      const mockBlock = {
        id: 'block1',
        groupIds: ['g1', 'g2', 'g3'],
        name: 'Test Block',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const width = blockService.getBlockWidth(mockBlock)
      expect(width).toBeGreaterThan(0)
    })
  })

  describe('LaneManagementService', () => {
    it('should create lane', () => {
      let project = createMockProject()
      project = beatService.createBeatGroup(project, 'G1')
      project = beatService.createBeatGroup(project, 'G2')
      const [g1, g2] = project.beatGroups.map(g => g.id)
      project = blockService.createBlock(project, [g1, g2])
      const blockId = project.blocks[0].id

      const updated = laneService.createLane(project, [blockId])
      expect(updated.lanes).toHaveLength(1)
    })

    it('should update lane', () => {
      let project = createMockProject()
      project = beatService.createBeatGroup(project, 'G1')
      project = beatService.createBeatGroup(project, 'G2')
      const [g1, g2] = project.beatGroups.map(g => g.id)
      project = blockService.createBlock(project, [g1, g2])
      const blockId = project.blocks[0].id
      project = laneService.createLane(project, [blockId], 'Old Lane')
      const laneId = project.lanes[0].id

      const updated = laneService.updateLane(project, laneId, { name: 'New Lane' })
      expect(updated.lanes[0].name).toBe('New Lane')
    })

    it('should delete lane', () => {
      let project = createMockProject()
      project = beatService.createBeatGroup(project, 'G1')
      project = beatService.createBeatGroup(project, 'G2')
      const [g1, g2] = project.beatGroups.map(g => g.id)
      project = blockService.createBlock(project, [g1, g2])
      const blockId = project.blocks[0].id
      project = laneService.createLane(project, [blockId])
      const laneId = project.lanes[0].id

      const updated = laneService.deleteLane(project, laneId)
      expect(updated.lanes).toHaveLength(0)
    })

    it('should add block to lane', () => {
      let project = createMockProject()
      project = beatService.createBeatGroup(project, 'G1')
      project = beatService.createBeatGroup(project, 'G2')
      project = beatService.createBeatGroup(project, 'G3')
      project = beatService.createBeatGroup(project, 'G4')
      const [g1, g2, g3, g4] = project.beatGroups.map(g => g.id)
      project = blockService.createBlock(project, [g1, g2])
      project = blockService.createBlock(project, [g3, g4])
      const [b1, b2] = project.blocks.map(b => b.id)
      project = laneService.createLane(project, [b1])
      const laneId = project.lanes[0].id

      const updated = laneService.addBlockToLane(project, laneId, b2)
      expect(updated.lanes[0].blockIds).toContain(b2)
    })

    it('should remove block from lane', () => {
      let project = createMockProject()
      project = beatService.createBeatGroup(project, 'G1')
      project = beatService.createBeatGroup(project, 'G2')
      project = beatService.createBeatGroup(project, 'G3')
      project = beatService.createBeatGroup(project, 'G4')
      const [g1, g2, g3, g4] = project.beatGroups.map(g => g.id)
      project = blockService.createBlock(project, [g1, g2])
      project = blockService.createBlock(project, [g3, g4])
      const [b1, b2] = project.blocks.map(b => b.id)
      project = laneService.createLane(project, [b1, b2])

      const updated = laneService.removeBlockFromLane(project, b1)
      expect(updated.lanes).toHaveLength(0) // Lane deleted when <= 1 block
    })

    it('should not delete lane when multiple blocks remain', () => {
      let project = createMockProject()
      // Create 6 groups (2 per block)
      project = beatService.createBeatGroup(project, 'G1')
      project = beatService.createBeatGroup(project, 'G2')
      project = beatService.createBeatGroup(project, 'G3')
      project = beatService.createBeatGroup(project, 'G4')
      project = beatService.createBeatGroup(project, 'G5')
      project = beatService.createBeatGroup(project, 'G6')
      const [g1, g2, g3, g4, g5, g6] = project.beatGroups.map(g => g.id)
      // Create 3 blocks with 2 groups each
      project = blockService.createBlock(project, [g1, g2])
      project = blockService.createBlock(project, [g3, g4])
      project = blockService.createBlock(project, [g5, g6])
      const [b1, b2, b3] = project.blocks.map(b => b.id)
      project = laneService.createLane(project, [b1, b2, b3])

      const updated = laneService.removeBlockFromLane(project, b1)
      expect(updated.lanes).toHaveLength(1)
      expect(updated.lanes[0].blockIds).toEqual([b2, b3])
    })

    it('should get lane for block', () => {
      let project = createMockProject()
      project = beatService.createBeatGroup(project, 'G1')
      project = beatService.createBeatGroup(project, 'G2')
      const [g1, g2] = project.beatGroups.map(g => g.id)
      project = blockService.createBlock(project, [g1, g2])
      const blockId = project.blocks[0].id
      project = laneService.createLane(project, [blockId], 'Test Lane')

      const lane = laneService.getLaneForBlock(project, blockId)
      expect(lane).toBeDefined()
      expect(lane?.blockIds).toContain(blockId)
    })

    it('should check if block is first in lane', () => {
      let project = createMockProject()
      project = beatService.createBeatGroup(project, 'G1')
      project = beatService.createBeatGroup(project, 'G2')
      project = beatService.createBeatGroup(project, 'G3')
      project = beatService.createBeatGroup(project, 'G4')
      const [g1, g2, g3, g4] = project.beatGroups.map(g => g.id)
      project = blockService.createBlock(project, [g1, g2])
      project = blockService.createBlock(project, [g3, g4])
      const [b1, b2] = project.blocks.map(b => b.id)
      project = laneService.createLane(project, [b1, b2])

      expect(laneService.isFirstBlockInLane(project, b1)).toBe(true)
      expect(laneService.isFirstBlockInLane(project, b2)).toBe(false)
    })

    it('should get block height', () => {
      let project = createMockProject()
      project = beatService.createBeatGroup(project, 'G1')
      project = beatService.createBeatGroup(project, 'G2')
      const [g1, g2] = project.beatGroups.map(g => g.id)
      project = blockService.createBlock(project, [g1, g2])
      const blockId = project.blocks[0].id

      const height = laneService.getBlockHeight(project, blockId)
      expect(height).toBeGreaterThan(0)
    })
  })
})
