import type { Beat, BeatGroup, Position } from '@/domain/entities'
import { createBoundingBox, type BoundingBox } from '@/composables/useHoverable'

/**
 * Service for detecting collisions between draggable elements
 * Centralizes collision logic used across Beat and BeatGroup components
 */
export class CollisionDetectionService {
  // Standard dimensions for different element types
  private static readonly BEAT_WIDTH = 424 // 400px + 12px padding left + 12px padding right
  private static readonly BEAT_HEIGHT = 80
  private static readonly GROUP_WIDTH = 424 // Same as BEAT_WIDTH
  private static readonly GROUP_HEIGHT = 50
  private static readonly OVERLAP_THRESHOLD = 0.3 // 30% overlap required

  /**
   * Find which beat (if any) is being hovered over by a dragging element
   * @param draggedPosition - Current position of dragged element
   * @param draggedWidth - Width of dragged element
   * @param draggedHeight - Height of dragged element
   * @param allBeats - All beats to check against
   * @param excludeBeatId - Beat ID to exclude (the one being dragged)
   * @param getAbsolutePosition - Function to get absolute position
   */
  findHoveredBeat(
    draggedPosition: Position,
    draggedWidth: number,
    draggedHeight: number,
    allBeats: Beat[],
    excludeBeatId?: string,
    getAbsolutePosition?: (beat: Beat) => Position
  ): Beat | null {
    const draggedBox = createBoundingBox(draggedPosition, draggedWidth, draggedHeight)

    for (const beat of allBeats) {
      if (beat.id === excludeBeatId) continue

      const beatPosition = getAbsolutePosition ? getAbsolutePosition(beat) : beat.position
      const beatBox = createBoundingBox(
        beatPosition,
        CollisionDetectionService.BEAT_WIDTH,
        CollisionDetectionService.BEAT_HEIGHT
      )

      if (this.hasSignificantOverlap(draggedBox, beatBox)) {
        return beat
      }
    }

    return null
  }

  /**
   * Find which beat group (if any) is being hovered over
   */
  findHoveredGroup(
    draggedPosition: Position,
    draggedWidth: number,
    draggedHeight: number,
    allGroups: BeatGroup[],
    excludeGroupId?: string,
    getAbsolutePosition?: (group: BeatGroup) => Position
  ): BeatGroup | null {
    const draggedBox = createBoundingBox(draggedPosition, draggedWidth, draggedHeight)

    for (const group of allGroups) {
      if (group.id === excludeGroupId) continue

      const groupPosition = getAbsolutePosition ? getAbsolutePosition(group) : group.position
      const groupBox = createBoundingBox(
        groupPosition,
        CollisionDetectionService.GROUP_WIDTH,
        CollisionDetectionService.GROUP_HEIGHT
      )

      if (this.hasSignificantOverlap(draggedBox, groupBox)) {
        return group
      }
    }

    return null
  }

  /**
   * Check if two bounding boxes have significant overlap (>30% by default)
   */
  private hasSignificantOverlap(box1: BoundingBox, box2: BoundingBox): boolean {
    const overlapWidth = Math.min(box1.right, box2.right) - Math.max(box1.left, box2.left)
    const overlapHeight = Math.min(box1.bottom, box2.bottom) - Math.max(box1.top, box2.top)

    if (overlapWidth <= 0 || overlapHeight <= 0) {
      return false
    }

    const overlapArea = overlapWidth * overlapHeight
    const box1Area = box1.width * box1.height
    const overlapPercentage = overlapArea / box1Area

    return overlapPercentage > CollisionDetectionService.OVERLAP_THRESHOLD
  }

  /**
   * Get standard dimensions for element type
   */
  static getDimensions(type: 'beat' | 'group') {
    if (type === 'beat') {
      return { width: this.BEAT_WIDTH, height: this.BEAT_HEIGHT }
    } else {
      return { width: this.GROUP_WIDTH, height: this.GROUP_HEIGHT }
    }
  }
}

// Export singleton instance
export const collisionDetectionService = new CollisionDetectionService()
