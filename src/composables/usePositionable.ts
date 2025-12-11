import { computed, type Ref } from 'vue'
import type { Position, Block } from '@/domain/entities'

/**
 * Composable for position calculations and transformations
 * Handles relative/absolute position conversions, especially for elements inside Blocks
 */
export interface PositionableOptions {
  position: Ref<Position>
  parentBlock?: Ref<Block | undefined>
  zoom?: Ref<number> | number
}

export function usePositionable(options: PositionableOptions) {
  /**
   * Calculate absolute position on canvas
   * If element is inside a block, add block's position offset
   */
  const absolutePosition = computed(() => {
    const base = options.position.value
    const parent = options.parentBlock?.value
    
    if (parent) {
      return {
        x: base.x + parent.position.x,
        y: base.y + parent.position.y
      }
    }
    
    return base
  })

  /**
   * Calculate relative position (relative to parent block if exists)
   */
  const relativePosition = computed(() => {
    return options.position.value
  })

  /**
   * Convert absolute canvas position to relative position within parent
   */
  function toRelativePosition(absolutePos: Position): Position {
    const parent = options.parentBlock?.value
    
    if (parent) {
      return {
        x: absolutePos.x - parent.position.x,
        y: absolutePos.y - parent.position.y
      }
    }
    
    return absolutePos
  }

  /**
   * Convert relative position to absolute canvas position
   */
  function toAbsolutePosition(relativePos: Position): Position {
    const parent = options.parentBlock?.value
    
    if (parent) {
      return {
        x: relativePos.x + parent.position.x,
        y: relativePos.y + parent.position.y
      }
    }
    
    return relativePos
  }

  /**
   * Apply zoom scaling to a delta movement
   */
  function scaleMovement(deltaX: number, deltaY: number): { deltaX: number; deltaY: number } {
    const zoomValue = typeof options.zoom === 'number' ? options.zoom : (options.zoom?.value ?? 1)
    
    return {
      deltaX: deltaX / zoomValue,
      deltaY: deltaY / zoomValue
    }
  }

  return {
    absolutePosition,
    relativePosition,
    toRelativePosition,
    toAbsolutePosition,
    scaleMovement
  }
}
