import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DragAndDropService } from '@/services/DragAndDropService'
import type { Project } from '@/domain/entities'

// Mock ProjectService
vi.mock('@/application/ProjectService', () => ({
  projectService: {
    updateBeat: vi.fn((project, beatId, updates) => {
      const beats = project.beats.map((b: any) =>
        b.id === beatId ? { ...b, ...updates } : b
      )
      return { ...project, beats }
    }),
    updateBeatGroup: vi.fn((project, groupId, updates) => {
      const beatGroups = project.beatGroups.map((g: any) =>
        g.id === groupId ? { ...g, ...updates } : g
      )
      return { ...project, beatGroups }
    }),
    getGroupForBeat: vi.fn((project, beatId) => {
      return project.beatGroups.find((g: any) => g.beatIds.includes(beatId)) || null
    }),
    addBeatsToGroup: vi.fn((project, groupId, beatIds) => {
      const beatGroups = project.beatGroups.map((g: any) =>
        g.id === groupId ? { ...g, beatIds: [...g.beatIds, ...beatIds] } : g
      )
      return { ...project, beatGroups }
    }),
    removeBeatFromGroup: vi.fn((project, beatId, groupId) => {
      const beatGroups = project.beatGroups.map((g: any) =>
        g.id === groupId ? { ...g, beatIds: g.beatIds.filter((id: string) => id !== beatId) } : g
      )
      return { ...project, beatGroups }
    }),
    insertBeatBeforeInGroup: vi.fn((project, groupId, beatIdToInsert, targetBeatId) => {
      const beatGroups = project.beatGroups.map((g: any) => {
        if (g.id !== groupId) return g
        const targetIndex = g.beatIds.indexOf(targetBeatId)
        const newBeatIds = [...g.beatIds.filter((id: string) => id !== beatIdToInsert)]
        newBeatIds.splice(targetIndex, 0, beatIdToInsert)
        return { ...g, beatIds: newBeatIds }
      })
      return { ...project, beatGroups }
    }),
    getBlockForGroup: vi.fn((project, groupId) => {
      return (project.blocks || []).find((b: any) => b.groupIds.includes(groupId)) || null
    }),
    removeGroupFromBlock: vi.fn((project, blockId, groupId) => {
      return project // Simplified mock
    }),
    repositionBeatsInGroup: vi.fn((project, groupId) => {
      return project // Simplified mock
    })
  }
}))

describe('DragAndDropService', () => {
  let service: DragAndDropService
  let mockProject: Project

  beforeEach(() => {
    service = new DragAndDropService()
    mockProject = {
      id: 'test-project',
      name: 'Test Project',
      description: 'Test',
      beats: [
        {
          id: 'beat1',
          title: 'Beat 1',
          description: '',
          typeId: 'news',
          order: 0,
          position: { x: 100, y: 100 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'beat2',
          title: 'Beat 2',
          description: '',
          typeId: 'news',
          order: 1,
          position: { x: 200, y: 200 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      beatTypes: [],
      beatGroups: [
        {
          id: 'group1',
          name: 'Group 1',
          beatIds: [],
          position: { x: 300, y: 300 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      blocks: [], // Add blocks array for Block functionality
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  })

  describe('handleBeatDragStart', () => {
    it('should return project and beat start position', () => {
      const result = service.handleBeatDragStart(mockProject, 'beat1')

      expect(result.project).toBe(mockProject)
      expect(result.startPosition).toEqual({ x: 100, y: 100 })
    })

    it('should return zero position if beat not found', () => {
      const result = service.handleBeatDragStart(mockProject, 'nonexistent')

      expect(result.project).toBe(mockProject)
      expect(result.startPosition).toEqual({ x: 0, y: 0 })
    })
  })

  describe('handleBeatDragMove', () => {
    it('should update beat position with delta', () => {
      const startPosition = { x: 100, y: 100 }
      const result = service.handleBeatDragMove(mockProject, 'beat1', startPosition, 50, 30)

      expect(result.beats[0].position).toEqual({ x: 150, y: 130 })
    })

    it('should return original project if beat not found', () => {
      const startPosition = { x: 100, y: 100 }
      const result = service.handleBeatDragMove(mockProject, 'nonexistent', startPosition, 50, 30)

      expect(result).toBe(mockProject)
    })
  })

  describe('handleBeatDragEnd', () => {
    it('should add beat to hovered group', () => {
      const result = service.handleBeatDragEnd(mockProject, 'beat1', 'group1', null)

      expect(result.beatGroups[0].beatIds).toContain('beat1')
    })

    it('should insert beat before hovered beat when hoveredBeatId provided', () => {
      // Setup: beat2 is in group1
      mockProject.beatGroups[0].beatIds = ['beat2']

      const result = service.handleBeatDragEnd(mockProject, 'beat1', null, 'beat2')

      expect(result.beatGroups[0].beatIds).toEqual(['beat1', 'beat2'])
    })

    it('should remove beat from group when dropped outside', () => {
      // Setup: beat1 is in group1
      mockProject.beatGroups[0].beatIds = ['beat1']

      const result = service.handleBeatDragEnd(mockProject, 'beat1', null, null)

      expect(result.beatGroups[0].beatIds).not.toContain('beat1')
    })

    it('should return original project if beat not found', () => {
      const result = service.handleBeatDragEnd(mockProject, 'nonexistent', null, null)

      expect(result).toBe(mockProject)
    })
  })

  describe('handleGroupDragStart', () => {
    it('should return project and group start position', () => {
      const result = service.handleGroupDragStart(mockProject, 'group1')

      expect(result.project).toBe(mockProject)
      expect(result.startPosition).toEqual({ x: 300, y: 300 })
    })

    it('should return zero position if group not found', () => {
      const result = service.handleGroupDragStart(mockProject, 'nonexistent')

      expect(result.project).toBe(mockProject)
      expect(result.startPosition).toEqual({ x: 0, y: 0 })
    })
  })

  describe('handleGroupDragMove', () => {
    it('should update group position with delta', () => {
      const startPosition = { x: 300, y: 300 }
      const result = service.handleGroupDragMove(mockProject, 'group1', startPosition, 50, 30)

      expect(result.beatGroups[0].position).toEqual({ x: 350, y: 330 })
    })

    it('should update all beats in group when group moves', () => {
      mockProject.beatGroups[0].beatIds = ['beat1', 'beat2']
      const startPosition = { x: 300, y: 300 }

      const result = service.handleGroupDragMove(mockProject, 'group1', startPosition, 50, 30)

      // Verify group moved
      expect(result.beatGroups[0].position).toEqual({ x: 350, y: 330 })
      // Verify beats were updated (positions should be calculated relative to group)
      expect(result.beats[0].position.x).toBe(350) // Same x as group
      expect(result.beats[0].position.y).toBe(390) // group.y + 50 + 10 + (0 * 90)
    })

    it('should return original project if group not found', () => {
      const startPosition = { x: 300, y: 300 }
      const result = service.handleGroupDragMove(mockProject, 'nonexistent', startPosition, 50, 30)

      expect(result).toBe(mockProject)
    })
  })

  describe('handleGroupDragEnd', () => {
    it('should handle group drag end with no hover', () => {
      const result = service.handleGroupDragEnd(mockProject, 'group1', null)

      // Should return project (may be same or equivalent object)
      expect(result).toEqual(mockProject)
    })
  })
})
