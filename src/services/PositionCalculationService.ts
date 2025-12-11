import type { Position, Block, Beat, BeatGroup, Project } from '@/domain/entities'
import { projectService } from '@/application/ProjectService'

/**
 * Service for position calculations
 * Handles conversions between relative and absolute positions, especially for elements in blocks
 */
export class PositionCalculationService {
  /**
   * Get absolute position of a beat (accounting for parent block if any)
   * @param beat - The beat to get position for
   * @param project - Current project state
   * @returns Absolute position on canvas
   */
  getBeatAbsolutePosition(beat: Beat, project: Project): Position {
    const parentBlock = projectService.getBlockForBeat(project, beat.id)

    if (parentBlock) {
      return {
        x: beat.position.x + parentBlock.position.x,
        y: beat.position.y + parentBlock.position.y
      }
    }

    return beat.position
  }

  /**
   * Get absolute position of a beat group (accounting for parent block if any)
   */
  getGroupAbsolutePosition(group: BeatGroup, project: Project): Position {
    const parentBlock = projectService.getBlockForGroup(project, group.id)

    if (parentBlock) {
      return {
        x: group.position.x + parentBlock.position.x,
        y: group.position.y + parentBlock.position.y
      }
    }

    return group.position
  }

  /**
   * Convert absolute canvas position to relative position within a block
   * @param absolutePosition - Position on canvas
   * @param block - Parent block
   * @returns Position relative to block's top-left corner
   */
  toRelativePosition(absolutePosition: Position, block: Block): Position {
    return {
      x: absolutePosition.x - block.position.x,
      y: absolutePosition.y - block.position.y
    }
  }

  /**
   * Convert relative position to absolute canvas position
   * @param relativePosition - Position relative to block
   * @param block - Parent block
   * @returns Absolute position on canvas
   */
  toAbsolutePosition(relativePosition: Position, block: Block): Position {
    return {
      x: relativePosition.x + block.position.x,
      y: relativePosition.y + block.position.y
    }
  }

  /**
   * Scale a movement delta by zoom factor
   */
  scaleMovementByZoom(deltaX: number, deltaY: number, zoom: number): { deltaX: number; deltaY: number } {
    return {
      deltaX: deltaX / zoom,
      deltaY: deltaY / zoom
    }
  }

  /**
   * Calculate new position after applying a delta
   */
  applyDelta(currentPosition: Position, deltaX: number, deltaY: number): Position {
    return {
      x: currentPosition.x + deltaX,
      y: currentPosition.y + deltaY
    }
  }

  /**
   * Clamp position within bounds
   */
  clampPosition(position: Position, minX: number, minY: number, maxX: number, maxY: number): Position {
    return {
      x: Math.max(minX, Math.min(maxX, position.x)),
      y: Math.max(minY, Math.min(maxY, position.y))
    }
  }
}

// Export singleton instance
export const positionCalculationService = new PositionCalculationService()
