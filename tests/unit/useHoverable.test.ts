import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useHoverable, createBoundingBox } from '@/composables/useHoverable'
import type { Position } from '@/domain/entities'

describe('useHoverable', () => {
  describe('getBoundingBox', () => {
    it('should return correct bounding box', () => {
      const position = ref<Position>({ x: 100, y: 200 })
      const { getBoundingBox } = useHoverable({
        elementId: 'test',
        position,
        width: 400,
        height: 80
      })

      const box = getBoundingBox()

      expect(box).toEqual({
        left: 100,
        right: 500,
        top: 200,
        bottom: 280,
        width: 400,
        height: 80
      })
    })

    it('should update bounding box when position changes', () => {
      const position = ref<Position>({ x: 100, y: 200 })
      const { getBoundingBox } = useHoverable({
        elementId: 'test',
        position,
        width: 400,
        height: 80
      })

      position.value = { x: 300, y: 400 }
      const box = getBoundingBox()

      expect(box.left).toBe(300)
      expect(box.top).toBe(400)
    })
  })

  describe('isOverlapping', () => {
    it('should return true when overlap exceeds threshold', () => {
      const position = ref<Position>({ x: 100, y: 100 })
      const { isOverlapping } = useHoverable({
        elementId: 'test',
        position,
        width: 400,
        height: 80
      })

      // Create overlapping box with >30% overlap
      const otherBox = createBoundingBox({ x: 200, y: 100 }, 400, 80)

      expect(isOverlapping(otherBox)).toBe(true)
    })

    it('should return false when overlap is below threshold', () => {
      const position = ref<Position>({ x: 100, y: 100 })
      const { isOverlapping } = useHoverable({
        elementId: 'test',
        position,
        width: 400,
        height: 80
      })

      // Create box with minimal overlap (<30%)
      const otherBox = createBoundingBox({ x: 450, y: 100 }, 400, 80)

      expect(isOverlapping(otherBox)).toBe(false)
    })

    it('should return false when boxes do not overlap', () => {
      const position = ref<Position>({ x: 100, y: 100 })
      const { isOverlapping } = useHoverable({
        elementId: 'test',
        position,
        width: 400,
        height: 80
      })

      // Create non-overlapping box
      const otherBox = createBoundingBox({ x: 1000, y: 1000 }, 400, 80)

      expect(isOverlapping(otherBox)).toBe(false)
    })

    it('should respect custom overlap threshold', () => {
      const position = ref<Position>({ x: 100, y: 100 })
      const { isOverlapping } = useHoverable({
        elementId: 'test',
        position,
        width: 400,
        height: 80,
        overlapThreshold: 0.8 // 80% required
      })

      // Create box with ~40% overlap (would pass 30% but not 80%)
      const otherBox = createBoundingBox({ x: 300, y: 100 }, 400, 80)

      expect(isOverlapping(otherBox)).toBe(false)
    })
  })

  describe('containsPoint', () => {
    it('should return true when point is inside element', () => {
      const position = ref<Position>({ x: 100, y: 100 })
      const { containsPoint } = useHoverable({
        elementId: 'test',
        position,
        width: 400,
        height: 80
      })

      expect(containsPoint({ x: 200, y: 150 })).toBe(true)
    })

    it('should return false when point is outside element', () => {
      const position = ref<Position>({ x: 100, y: 100 })
      const { containsPoint } = useHoverable({
        elementId: 'test',
        position,
        width: 400,
        height: 80
      })

      expect(containsPoint({ x: 1000, y: 1000 })).toBe(false)
    })

    it('should return true when point is on the edge', () => {
      const position = ref<Position>({ x: 100, y: 100 })
      const { containsPoint } = useHoverable({
        elementId: 'test',
        position,
        width: 400,
        height: 80
      })

      expect(containsPoint({ x: 100, y: 100 })).toBe(true) // Top-left corner
      expect(containsPoint({ x: 500, y: 180 })).toBe(true) // Bottom-right corner
    })
  })

  describe('getCenterPoint', () => {
    it('should return center point of element', () => {
      const position = ref<Position>({ x: 100, y: 100 })
      const { getCenterPoint } = useHoverable({
        elementId: 'test',
        position,
        width: 400,
        height: 80
      })

      const center = getCenterPoint()

      expect(center).toEqual({
        x: 300, // 100 + 400/2
        y: 140  // 100 + 80/2
      })
    })
  })

  describe('distanceToPoint', () => {
    it('should calculate correct distance to point', () => {
      const position = ref<Position>({ x: 100, y: 100 })
      const { distanceToPoint } = useHoverable({
        elementId: 'test',
        position,
        width: 400,
        height: 80
      })

      // Center is at (300, 140)
      // Distance to (300, 140) should be 0
      expect(distanceToPoint({ x: 300, y: 140 })).toBe(0)
    })

    it('should calculate Euclidean distance correctly', () => {
      const position = ref<Position>({ x: 0, y: 0 })
      const { distanceToPoint } = useHoverable({
        elementId: 'test',
        position,
        width: 400,
        height: 80
      })

      // Center is at (200, 40)
      // Distance to (203, 44) = sqrt(9 + 16) = 5
      const distance = distanceToPoint({ x: 203, y: 44 })
      expect(distance).toBeCloseTo(5, 5)
    })
  })

  describe('isHovered', () => {
    it('should be a reactive ref initialized to false', () => {
      const position = ref<Position>({ x: 100, y: 100 })
      const { isHovered } = useHoverable({
        elementId: 'test',
        position,
        width: 400,
        height: 80
      })

      expect(isHovered.value).toBe(false)
    })
  })
})

describe('createBoundingBox', () => {
  it('should create bounding box from position and dimensions', () => {
    const box = createBoundingBox({ x: 100, y: 200 }, 400, 80)

    expect(box).toEqual({
      left: 100,
      right: 500,
      top: 200,
      bottom: 280,
      width: 400,
      height: 80
    })
  })
})
