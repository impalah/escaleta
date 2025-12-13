import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PositionCalculationService } from '@/services/PositionCalculationService'
import type { Beat, BeatGroup, Project } from '@/domain/entities'

// Mock ProjectService
vi.mock('@/application/ProjectService', () => ({
  projectService: {
    getGroupForBeat: vi.fn()
  }
}))

import { projectService } from '@/application/ProjectService'

describe('PositionCalculationService', () => {
  let service: PositionCalculationService
  let mockBeat: Beat
  let mockGroup: BeatGroup
  let mockProject: Project

  beforeEach(() => {
    service = new PositionCalculationService()
    
    mockBeat = {
      id: 'beat1',
      title: 'Beat 1',
      description: '',
      typeId: 'news',
      order: 0,
      position: { x: 100, y: 200 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    mockGroup = {
      id: 'group1',
      name: 'Group 1',
      beatIds: ['beat1'],
      position: { x: 300, y: 400 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    mockProject = {
      id: 'test-project',
      name: 'Test Project',
      description: 'Test',
      beats: [mockBeat],
      beatTypes: [],
      beatGroups: [mockGroup],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    vi.clearAllMocks()
  })

  describe('getAbsoluteBeatPosition', () => {
    it('should return beat position when beat is standalone (not in group)', () => {
      vi.mocked(projectService.getGroupForBeat).mockReturnValue(null)

      const result = service.getAbsoluteBeatPosition(mockBeat, mockProject)

      expect(result).toEqual({ x: 100, y: 200 })
      expect(projectService.getGroupForBeat).toHaveBeenCalledWith(mockProject, 'beat1')
    })

    it('should return beat position when beat is in group', () => {
      vi.mocked(projectService.getGroupForBeat).mockReturnValue(mockGroup)

      const result = service.getAbsoluteBeatPosition(mockBeat, mockProject)

      expect(result).toEqual({ x: 100, y: 200 })
      expect(projectService.getGroupForBeat).toHaveBeenCalledWith(mockProject, 'beat1')
    })
  })

  describe('getAbsoluteGroupPosition', () => {
    it('should return group position as-is', () => {
      const result = service.getAbsoluteGroupPosition(mockGroup)

      expect(result).toEqual({ x: 300, y: 400 })
    })
  })

  describe('calculateBeatPositionInGroup', () => {
    it('should calculate position for first beat in group', () => {
      const result = service.calculateBeatPositionInGroup(mockGroup, 0)

      // y = group.y + GROUP_HEADER_HEIGHT + GAP + (index * (BEAT_HEIGHT + GAP))
      // y = 400 + 50 + 10 + (0 * (80 + 10))
      // y = 460
      expect(result).toEqual({
        x: 300,
        y: 460
      })
    })

    it('should calculate position for second beat in group', () => {
      const result = service.calculateBeatPositionInGroup(mockGroup, 1)

      // y = 400 + 50 + 10 + (1 * (80 + 10))
      // y = 400 + 50 + 10 + 90
      // y = 550
      expect(result).toEqual({
        x: 300,
        y: 550
      })
    })

    it('should calculate position for third beat in group', () => {
      const result = service.calculateBeatPositionInGroup(mockGroup, 2)

      // y = 400 + 50 + 10 + (2 * 90)
      // y = 640
      expect(result).toEqual({
        x: 300,
        y: 640
      })
    })

    it('should use group x position for beat x position', () => {
      const groupAtDifferentX = { ...mockGroup, position: { x: 500, y: 100 } }
      const result = service.calculateBeatPositionInGroup(groupAtDifferentX, 0)

      expect(result.x).toBe(500)
    })
  })
})
