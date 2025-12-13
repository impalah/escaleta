import { describe, it, expect, beforeEach } from 'vitest'
import { CollisionDetectionService } from '@/services/CollisionDetectionService'
import type { Beat, BeatGroup, Position } from '@/domain/entities'

describe('CollisionDetectionService', () => {
  let service: CollisionDetectionService

  beforeEach(() => {
    service = new CollisionDetectionService()
  })

  describe('findHoveredBeat', () => {
    const createBeat = (id: string, x: number, y: number): Beat => ({
      id,
      title: `Beat ${id}`,
      description: '',
      typeId: 'news',
      order: 0,
      position: { x, y },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    it('should return null when no beats are hovered', () => {
      const beats: Beat[] = [createBeat('beat1', 100, 100)]
      const draggedPosition: Position = { x: 1000, y: 1000 }

      const result = service.findHoveredBeat(draggedPosition, 424, 80, beats)

      expect(result).toBeNull()
    })

    it('should find hovered beat when there is significant overlap', () => {
      const beats: Beat[] = [
        createBeat('beat1', 100, 100),
        createBeat('beat2', 200, 200)
      ]
      // Position with >30% overlap with beat1
      const draggedPosition: Position = { x: 150, y: 100 }

      const result = service.findHoveredBeat(draggedPosition, 424, 80, beats)

      expect(result).not.toBeNull()
      expect(result?.id).toBe('beat1')
    })

    it('should exclude the dragged beat itself', () => {
      const beats: Beat[] = [createBeat('beat1', 100, 100)]
      const draggedPosition: Position = { x: 100, y: 100 }

      const result = service.findHoveredBeat(draggedPosition, 424, 80, beats, 'beat1')

      expect(result).toBeNull()
    })

    it('should use custom position getter when provided', () => {
      const beats: Beat[] = [createBeat('beat1', 100, 100)]
      const draggedPosition: Position = { x: 550, y: 300 }
      const getAbsolutePosition = (beat: Beat): Position => ({ x: 500, y: 300 })

      const result = service.findHoveredBeat(
        draggedPosition,
        424,
        80,
        beats,
        undefined,
        getAbsolutePosition
      )

      expect(result).not.toBeNull()
      expect(result?.id).toBe('beat1')
    })

    it('should return null when overlap is less than threshold', () => {
      const beats: Beat[] = [createBeat('beat1', 100, 100)]
      // Position with minimal overlap (<30%)
      const draggedPosition: Position = { x: 450, y: 100 }

      const result = service.findHoveredBeat(draggedPosition, 424, 80, beats)

      expect(result).toBeNull()
    })
  })

  describe('findHoveredGroup', () => {
    const createGroup = (id: string, x: number, y: number): BeatGroup => ({
      id,
      name: `Group ${id}`,
      beatIds: [],
      position: { x, y },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    it('should return null when no groups are hovered', () => {
      const groups: BeatGroup[] = [createGroup('group1', 100, 100)]
      const draggedPosition: Position = { x: 1000, y: 1000 }

      const result = service.findHoveredGroup(draggedPosition, 424, 80, groups)

      expect(result).toBeNull()
    })

    it('should find hovered group when there is significant overlap', () => {
      const groups: BeatGroup[] = [
        createGroup('group1', 100, 100),
        createGroup('group2', 200, 200)
      ]
      // Position with >30% overlap with group1
      const draggedPosition: Position = { x: 150, y: 100 }

      const result = service.findHoveredGroup(draggedPosition, 424, 50, groups)

      expect(result).not.toBeNull()
      expect(result?.id).toBe('group1')
    })

    it('should exclude the dragged group itself', () => {
      const groups: BeatGroup[] = [createGroup('group1', 100, 100)]
      const draggedPosition: Position = { x: 100, y: 100 }

      const result = service.findHoveredGroup(draggedPosition, 424, 50, groups, 'group1')

      expect(result).toBeNull()
    })

    it('should use custom position getter when provided', () => {
      const groups: BeatGroup[] = [createGroup('group1', 100, 100)]
      const draggedPosition: Position = { x: 550, y: 300 }
      const getAbsolutePosition = (group: BeatGroup): Position => ({ x: 500, y: 300 })

      const result = service.findHoveredGroup(
        draggedPosition,
        424,
        50,
        groups,
        undefined,
        getAbsolutePosition
      )

      expect(result).not.toBeNull()
      expect(result?.id).toBe('group1')
    })
  })

  describe('getDimensions', () => {
    it('should return correct dimensions for beat', () => {
      const dimensions = CollisionDetectionService.getDimensions('beat')

      expect(dimensions).toEqual({
        width: 424,
        height: 80
      })
    })

    it('should return correct dimensions for group', () => {
      const dimensions = CollisionDetectionService.getDimensions('group')

      expect(dimensions).toEqual({
        width: 424,
        height: 50
      })
    })
  })
})
