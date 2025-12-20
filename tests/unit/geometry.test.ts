import { describe, it, expect } from 'vitest'
import {
  calculateNextBeatPosition,
  calculateNextGroupPosition,
  calculateBeatYPositionInGroup,
  calculateBlockWidth,
  calculateBlockHeight,
  calculateNextBeatOrder,
  calculateNextGroupOrder,
  LAYOUT_CONSTANTS
} from '@/domain/operations/geometry'
import type { Project, Block } from '@/domain/entities'

const createMockProject = (): Project => ({
  id: 'project-1',
  name: 'Test',
  description: '',
  beats: [
    { id: 'b1', title: 'Beat 1', description: '', typeId: 'news', order: 1, position: { x: 100, y: 100 }, links: [], createdAt: '', updatedAt: '' },
    { id: 'b2', title: 'Beat 2', description: '', typeId: 'news', order: 2, position: { x: 100, y: 200 }, links: [], createdAt: '', updatedAt: '' }
  ],
  beatTypes: [],
  beatGroups: [
    { id: 'g1', name: 'Group 1', description: '', beatIds: ['b1', 'b2'], position: { x: 100, y: 100 }, collapsed: false, order: 1, createdAt: '', updatedAt: '' }
  ],
  blocks: [],
  lanes: [],
  createdAt: '',
  updatedAt: ''
})

describe('geometry', () => {
  describe('LAYOUT_CONSTANTS', () => {
    it('should have all required constants', () => {
      expect(LAYOUT_CONSTANTS.BEAT_HEIGHT).toBe(80)
      expect(LAYOUT_CONSTANTS.GROUP_HEADER_HEIGHT).toBe(50)
      expect(LAYOUT_CONSTANTS.BLOCK_HEADER_HEIGHT).toBe(50)
      expect(LAYOUT_CONSTANTS.LANE_HEADER_HEIGHT).toBe(50)
      expect(LAYOUT_CONSTANTS.GAP).toBe(10)
    })
  })

  describe('calculateNextBeatPosition', () => {
    it('should calculate position for first beat', () => {
      const pos = calculateNextBeatPosition(0)
      expect(pos).toEqual({ x: 100, y: 100 })
    })

    it('should calculate position for beat in first row', () => {
      const pos = calculateNextBeatPosition(2)
      expect(pos).toEqual({ x: 1000, y: 100 })
    })

    it('should calculate position for beat in second row', () => {
      const pos = calculateNextBeatPosition(4)
      expect(pos).toEqual({ x: 100, y: 250 })
    })

    it('should handle grid wrapping correctly', () => {
      const pos7 = calculateNextBeatPosition(7)
      expect(pos7).toEqual({ x: 1450, y: 250 })
    })
  })

  describe('calculateNextGroupPosition', () => {
    it('should calculate position for first group', () => {
      const pos = calculateNextGroupPosition(0)
      expect(pos).toEqual({ x: 100, y: 50 })
    })

    it('should calculate position for group in first row', () => {
      const pos = calculateNextGroupPosition(2)
      expect(pos).toEqual({ x: 1100, y: 50 })
    })

    it('should calculate position for group in second row', () => {
      const pos = calculateNextGroupPosition(3)
      expect(pos).toEqual({ x: 100, y: 250 })
    })
  })

  describe('calculateBeatYPositionInGroup', () => {
    it('should calculate Y position for first beat in group', () => {
      const y = calculateBeatYPositionInGroup(100, 0)
      expect(y).toBe(160) // 100 + 50 (header) + 10 (gap)
    })

    it('should calculate Y position for second beat in group', () => {
      const y = calculateBeatYPositionInGroup(100, 1)
      expect(y).toBe(250) // 100 + 50 + 10 + (1 * (80 + 10))
    })

    it('should calculate Y position for third beat in group', () => {
      const y = calculateBeatYPositionInGroup(100, 2)
      expect(y).toBe(340) // 100 + 50 + 10 + (2 * 90)
    })
  })

  describe('calculateBlockWidth', () => {
    it('should return minimum width for 0 groups', () => {
      const width = calculateBlockWidth(0)
      expect(width).toBe(424) // GROUP_WIDTH
    })

    it('should calculate width for 1 group', () => {
      const width = calculateBlockWidth(1)
      expect(width).toBe(424) // 1 * 424
    })

    it('should calculate width for multiple groups', () => {
      const width = calculateBlockWidth(3)
      expect(width).toBe(1292) // (3 * 424) + (2 * 10)
    })

    it('should include gaps between groups', () => {
      const width = calculateBlockWidth(4)
      expect(width).toBe(1726) // (4 * 424) + (3 * 10)
    })
  })

  describe('calculateBlockHeight', () => {
    it('should return header height for block with no groups', () => {
      const project = createMockProject()
      const block: Block = {
        id: 'block-1',
        name: 'Block',
        groupIds: [],
        position: { x: 100, y: 100 },
        createdAt: '',
        updatedAt: ''
      }

      const height = calculateBlockHeight(project, block)
      expect(height).toBe(50) // BLOCK_HEADER_HEIGHT
    })

    it('should calculate height including groups and beats', () => {
      const project = createMockProject()
      const block: Block = {
        id: 'block-1',
        name: 'Block',
        groupIds: ['g1'],
        position: { x: 100, y: 100 },
        createdAt: '',
        updatedAt: ''
      }

      const height = calculateBlockHeight(project, block)
      expect(height).toBeGreaterThan(50)
    })

    it('should include padding in height calculation', () => {
      const project = createMockProject()
      project.beatGroups[0].position = { x: 100, y: 150 } // Below block header
      project.beats[0].position = { x: 100, y: 210 }
      project.beats[1].position = { x: 100, y: 300 }

      const block: Block = {
        id: 'block-1',
        name: 'Block',
        groupIds: ['g1'],
        position: { x: 100, y: 100 },
        createdAt: '',
        updatedAt: ''
      }

      const height = calculateBlockHeight(project, block)
      // Should be: (maxY - blockY) + padding
      // maxY = 300 (beat2.y) + 80 (BEAT_HEIGHT) = 380
      // height = (380 - 100) + 15 = 295
      expect(height).toBe(295)
    })
  })

  describe('calculateNextBeatOrder', () => {
    it('should return 1 for empty project', () => {
      const project: Project = {
        id: 'p1',
        name: 'Test',
        description: '',
        beats: [],
        beatTypes: [],
        beatGroups: [],
        blocks: [],
        lanes: [],
        createdAt: '',
        updatedAt: ''
      }

      expect(calculateNextBeatOrder(project)).toBe(1)
    })

    it('should return max order + 1', () => {
      const project = createMockProject()
      project.beats[0].order = 5
      project.beats[1].order = 3

      expect(calculateNextBeatOrder(project)).toBe(6)
    })

    it('should handle negative orders', () => {
      const project = createMockProject()
      project.beats[0].order = -1
      project.beats[1].order = 0

      expect(calculateNextBeatOrder(project)).toBe(1)
    })
  })

  describe('calculateNextGroupOrder', () => {
    it('should return 1 for project with no groups', () => {
      const project: Project = {
        id: 'p1',
        name: 'Test',
        description: '',
        beats: [],
        beatTypes: [],
        beatGroups: [],
        blocks: [],
        lanes: [],
        createdAt: '',
        updatedAt: ''
      }

      expect(calculateNextGroupOrder(project)).toBe(1)
    })

    it('should return max order + 1', () => {
      const project = createMockProject()
      project.beatGroups[0].order = 7

      expect(calculateNextGroupOrder(project)).toBe(8)
    })
  })
})
