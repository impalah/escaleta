/**
 * Domain layer: Pure geometry calculation functions
 * No side effects, all functions are deterministic
 */

import type { Block, Project } from '@/domain/entities'

/**
 * Constants for layout calculations
 */
export const LAYOUT_CONSTANTS = {
  // Beat
  BEAT_HEIGHT: 80,
  BEAT_COLS: 4,
  BEAT_SPACING_X: 450,
  BEAT_SPACING_Y: 150,
  BEAT_START_X: 100,
  BEAT_START_Y: 100,
  
  // BeatGroup
  GROUP_HEADER_HEIGHT: 50,
  GROUP_WIDTH: 424,
  GROUP_COLS: 3,
  GROUP_SPACING_X: 500,
  GROUP_SPACING_Y: 200,
  GROUP_START_X: 100,
  GROUP_START_Y: 50,
  
  // Block
  BLOCK_HEADER_HEIGHT: 50,
  BLOCK_PADDING: 15,
  
  // Lane
  LANE_HEADER_HEIGHT: 50,
  
  // General
  GAP: 10
} as const

/**
 * Calculate the next grid position for a new beat
 */
export function calculateNextBeatPosition(beatsCount: number): { x: number; y: number } {
  const col = beatsCount % LAYOUT_CONSTANTS.BEAT_COLS
  const row = Math.floor(beatsCount / LAYOUT_CONSTANTS.BEAT_COLS)
  
  return {
    x: LAYOUT_CONSTANTS.BEAT_START_X + (col * LAYOUT_CONSTANTS.BEAT_SPACING_X),
    y: LAYOUT_CONSTANTS.BEAT_START_Y + (row * LAYOUT_CONSTANTS.BEAT_SPACING_Y)
  }
}

/**
 * Calculate the next grid position for a new beat group
 */
export function calculateNextGroupPosition(groupsCount: number): { x: number; y: number } {
  const col = groupsCount % LAYOUT_CONSTANTS.GROUP_COLS
  const row = Math.floor(groupsCount / LAYOUT_CONSTANTS.GROUP_COLS)
  
  return {
    x: LAYOUT_CONSTANTS.GROUP_START_X + (col * LAYOUT_CONSTANTS.GROUP_SPACING_X),
    y: LAYOUT_CONSTANTS.GROUP_START_Y + (row * LAYOUT_CONSTANTS.GROUP_SPACING_Y)
  }
}

/**
 * Calculate the Y position for a beat in a group based on its index
 */
export function calculateBeatYPositionInGroup(groupY: number, beatIndex: number): number {
  if (beatIndex === 0) {
    return groupY + LAYOUT_CONSTANTS.GROUP_HEADER_HEIGHT + LAYOUT_CONSTANTS.GAP
  }
  
  return groupY + 
         LAYOUT_CONSTANTS.GROUP_HEADER_HEIGHT + 
         LAYOUT_CONSTANTS.GAP + 
         (beatIndex * (LAYOUT_CONSTANTS.BEAT_HEIGHT + LAYOUT_CONSTANTS.GAP))
}

/**
 * Calculate the width of a Block based on its groups
 */
export function calculateBlockWidth(groupCount: number): number {
  if (groupCount === 0) {
    return LAYOUT_CONSTANTS.GROUP_WIDTH
  }
  
  return (groupCount * LAYOUT_CONSTANTS.GROUP_WIDTH) + 
         ((groupCount - 1) * LAYOUT_CONSTANTS.GAP)
}

/**
 * Calculate the total height of a Block including all its content
 */
export function calculateBlockHeight(project: Project, block: Block): number {
  if (block.groupIds.length === 0) {
    return LAYOUT_CONSTANTS.BLOCK_HEADER_HEIGHT
  }
  
  // Get all groups in this block
  const groups = project.beatGroups.filter(g => block.groupIds.includes(g.id))
  
  // Find bounds of all groups and their beats
  let minY = Infinity
  let maxY = -Infinity
  
  groups.forEach(group => {
    minY = Math.min(minY, group.position.y)
    maxY = Math.max(maxY, group.position.y + LAYOUT_CONSTANTS.GROUP_HEADER_HEIGHT)
    
    // Check beats in this group
    const groupBeats = project.beats.filter(b => group.beatIds.includes(b.id))
    groupBeats.forEach(beat => {
      minY = Math.min(minY, beat.position.y)
      maxY = Math.max(maxY, beat.position.y + LAYOUT_CONSTANTS.BEAT_HEIGHT)
    })
  })
  
  // Height from block top to bottom of content + padding
  const blockHeaderY = block.position.y
  minY = Math.min(minY, blockHeaderY + LAYOUT_CONSTANTS.BLOCK_HEADER_HEIGHT)
  
  return (maxY - blockHeaderY) + LAYOUT_CONSTANTS.BLOCK_PADDING
}

/**
 * Calculate next order number for beats
 */
export function calculateNextBeatOrder(project: Project): number {
  const maxOrder = project.beats.reduce((max, b) => Math.max(max, b.order), 0)
  return maxOrder + 1
}

/**
 * Calculate next order number for beat groups
 */
export function calculateNextGroupOrder(project: Project): number {
  const maxOrder = project.beatGroups.reduce((max, g) => Math.max(max, g.order), 0)
  return maxOrder + 1
}
