import { ref, type Ref } from 'vue'
import type { Position } from '@/domain/entities'

/**
 * Composable for detecting hover/collision with other elements
 * Provides bounding box calculations and overlap detection
 */
export interface BoundingBox {
  left: number
  right: number
  top: number
  bottom: number
  width: number
  height: number
}

export interface HoverableOptions {
  elementId: string
  position: Ref<Position>
  width: number
  height: number
  overlapThreshold?: number // Percentage of overlap required (0-1), default 0.3
}

export function useHoverable(options: HoverableOptions) {
  const isHovered = ref(false)
  const OVERLAP_THRESHOLD = options.overlapThreshold ?? 0.3

  /**
   * Get current bounding box of this element
   */
  function getBoundingBox(): BoundingBox {
    const pos = options.position.value
    
    return {
      left: pos.x,
      right: pos.x + options.width,
      top: pos.y,
      bottom: pos.y + options.height,
      width: options.width,
      height: options.height
    }
  }

  /**
   * Check if this element overlaps with another bounding box
   * @param otherBox - Bounding box of another element
   * @returns true if overlap exceeds threshold
   */
  function isOverlapping(otherBox: BoundingBox): boolean {
    const thisBox = getBoundingBox()
    
    // Calculate overlap dimensions
    const overlapWidth = Math.min(thisBox.right, otherBox.right) - Math.max(thisBox.left, otherBox.left)
    const overlapHeight = Math.min(thisBox.bottom, otherBox.bottom) - Math.max(thisBox.top, otherBox.top)
    
    // No overlap if dimensions are negative
    if (overlapWidth <= 0 || overlapHeight <= 0) {
      return false
    }
    
    // Calculate overlap area as percentage of this element's area
    const overlapArea = overlapWidth * overlapHeight
    const thisArea = thisBox.width * thisBox.height
    const overlapPercentage = overlapArea / thisArea
    
    return overlapPercentage > OVERLAP_THRESHOLD
  }

  /**
   * Check if a point is inside this element
   */
  function containsPoint(point: Position): boolean {
    const box = getBoundingBox()
    
    return (
      point.x >= box.left &&
      point.x <= box.right &&
      point.y >= box.top &&
      point.y <= box.bottom
    )
  }

  /**
   * Get center point of this element
   */
  function getCenterPoint(): Position {
    const pos = options.position.value
    
    return {
      x: pos.x + options.width / 2,
      y: pos.y + options.height / 2
    }
  }

  /**
   * Calculate distance between this element's center and another position
   */
  function distanceToPoint(point: Position): number {
    const center = getCenterPoint()
    const dx = center.x - point.x
    const dy = center.y - point.y
    
    return Math.sqrt(dx * dx + dy * dy)
  }

  return {
    isHovered,
    getBoundingBox,
    isOverlapping,
    containsPoint,
    getCenterPoint,
    distanceToPoint
  }
}

/**
 * Helper function to create a bounding box from position and dimensions
 */
export function createBoundingBox(position: Position, width: number, height: number): BoundingBox {
  return {
    left: position.x,
    right: position.x + width,
    top: position.y,
    bottom: position.y + height,
    width,
    height
  }
}
