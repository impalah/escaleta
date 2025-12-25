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
    x: LAYOUT_CONSTANTS.BEAT_START_X + col * LAYOUT_CONSTANTS.BEAT_SPACING_X,
    y: LAYOUT_CONSTANTS.BEAT_START_Y + row * LAYOUT_CONSTANTS.BEAT_SPACING_Y
  }
}

/**
 * Calculate the next grid position for a new beat group
 */
export function calculateNextGroupPosition(groupsCount: number): { x: number; y: number } {
  const col = groupsCount % LAYOUT_CONSTANTS.GROUP_COLS
  const row = Math.floor(groupsCount / LAYOUT_CONSTANTS.GROUP_COLS)

  return {
    x: LAYOUT_CONSTANTS.GROUP_START_X + col * LAYOUT_CONSTANTS.GROUP_SPACING_X,
    y: LAYOUT_CONSTANTS.GROUP_START_Y + row * LAYOUT_CONSTANTS.GROUP_SPACING_Y
  }
}

/**
 * Calculate the Y position for a beat in a group based on its index
 */
export function calculateBeatYPositionInGroup(groupY: number, beatIndex: number): number {
  if (beatIndex === 0) {
    return groupY + LAYOUT_CONSTANTS.GROUP_HEADER_HEIGHT + LAYOUT_CONSTANTS.GAP
  }

  return (
    groupY +
    LAYOUT_CONSTANTS.GROUP_HEADER_HEIGHT +
    LAYOUT_CONSTANTS.GAP +
    beatIndex * (LAYOUT_CONSTANTS.BEAT_HEIGHT + LAYOUT_CONSTANTS.GAP)
  )
}

/**
 * Calculate the width of a Block based on its groups
 */
export function calculateBlockWidth(groupCount: number): number {
  if (groupCount === 0) {
    return LAYOUT_CONSTANTS.GROUP_WIDTH
  }

  return groupCount * LAYOUT_CONSTANTS.GROUP_WIDTH + (groupCount - 1) * LAYOUT_CONSTANTS.GAP
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

  return maxY - blockHeaderY + LAYOUT_CONSTANTS.BLOCK_PADDING
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

/**
 * Calculate automatic layout for complete project hierarchy
 * Positions Lanes, Blocks, BeatGroups, and Beats based on their hierarchical structure
 */
export function calculateHierarchyLayout(project: Project): void {
  let currentLaneY = LAYOUT_CONSTANTS.GROUP_START_Y

  project.lanes.forEach(lane => {
    // Position Lane header
    lane.position = {
      x: LAYOUT_CONSTANTS.GROUP_START_X,
      y: currentLaneY
    }

    let laneContentY = currentLaneY + LAYOUT_CONSTANTS.LANE_HEADER_HEIGHT + LAYOUT_CONSTANTS.GAP
    let maxBlockHeight = 0

    // Get blocks in this lane
    const laneBlocks = project.blocks.filter(b => lane.blockIds.includes(b.id))

    laneBlocks.forEach(block => {
      // Position Block header
      block.position = {
        x: LAYOUT_CONSTANTS.GROUP_START_X,
        y: laneContentY
      }

      let blockContentY = laneContentY + LAYOUT_CONSTANTS.BLOCK_HEADER_HEIGHT + LAYOUT_CONSTANTS.GAP
      let currentGroupX = LAYOUT_CONSTANTS.GROUP_START_X + LAYOUT_CONSTANTS.BLOCK_PADDING
      let maxGroupHeight = 0

      // Get groups in this block
      const blockGroups = project.beatGroups.filter(g => block.groupIds.includes(g.id))

      blockGroups.forEach((group, groupIdx) => {
        // Position Group (horizontal layout within block)
        group.position = {
          x: currentGroupX,
          y: blockContentY
        }

        let beatY = blockContentY + LAYOUT_CONSTANTS.GROUP_HEADER_HEIGHT + LAYOUT_CONSTANTS.GAP

        // Get beats in this group
        const groupBeats = project.beats.filter(b => group.beatIds.includes(b.id))

        groupBeats.forEach((beat, beatIdx) => {
          // Position Beat (vertical stack within group)
          beat.position = {
            x: currentGroupX + LAYOUT_CONSTANTS.GAP,
            y: beatY
          }
          beat.order = beatIdx
          beatY += LAYOUT_CONSTANTS.BEAT_HEIGHT + LAYOUT_CONSTANTS.GAP
        })

        // Update group order
        group.order = groupIdx

        // Calculate group height with proper spacing
        // Header + Gap + (Beats * (Height + Gap)) + Bottom padding
        const groupHeight =
          LAYOUT_CONSTANTS.GROUP_HEADER_HEIGHT +
          LAYOUT_CONSTANTS.GAP +
          groupBeats.length * (LAYOUT_CONSTANTS.BEAT_HEIGHT + LAYOUT_CONSTANTS.GAP) +
          LAYOUT_CONSTANTS.GAP // Extra bottom padding
        maxGroupHeight = Math.max(maxGroupHeight, groupHeight)

        // Move to next group position (horizontal)
        currentGroupX += LAYOUT_CONSTANTS.GROUP_WIDTH + LAYOUT_CONSTANTS.GAP
      })

      // Calculate block height
      const blockHeight =
        LAYOUT_CONSTANTS.BLOCK_HEADER_HEIGHT +
        LAYOUT_CONSTANTS.GAP +
        maxGroupHeight +
        LAYOUT_CONSTANTS.BLOCK_PADDING
      maxBlockHeight = Math.max(maxBlockHeight, blockHeight)

      // Next block starts below this one (vertical stacking with extra space)
      laneContentY += blockHeight + LAYOUT_CONSTANTS.GAP * 3
    })

    // Calculate lane total height
    const laneHeight =
      LAYOUT_CONSTANTS.LANE_HEADER_HEIGHT +
      LAYOUT_CONSTANTS.GAP +
      (laneBlocks.length > 0
        ? laneContentY - (currentLaneY + LAYOUT_CONSTANTS.LANE_HEADER_HEIGHT + LAYOUT_CONSTANTS.GAP)
        : 0)

    // Next lane starts below this one
    currentLaneY += laneHeight + LAYOUT_CONSTANTS.GAP * 2
  })

  // Position orphan blocks (not in any lane)
  const orphanBlocks = project.blocks.filter(block => {
    return !project.lanes.some(lane => lane.blockIds.includes(block.id))
  })

  orphanBlocks.forEach(block => {
    block.position = {
      x: LAYOUT_CONSTANTS.GROUP_START_X,
      y: currentLaneY
    }

    let blockContentY = currentLaneY + LAYOUT_CONSTANTS.BLOCK_HEADER_HEIGHT + LAYOUT_CONSTANTS.GAP
    let currentGroupX = LAYOUT_CONSTANTS.GROUP_START_X + LAYOUT_CONSTANTS.BLOCK_PADDING
    let maxGroupHeight = 0

    const blockGroups = project.beatGroups.filter(g => block.groupIds.includes(g.id))

    blockGroups.forEach((group, groupIdx) => {
      group.position = {
        x: currentGroupX,
        y: blockContentY
      }

      let beatY = blockContentY + LAYOUT_CONSTANTS.GROUP_HEADER_HEIGHT + LAYOUT_CONSTANTS.GAP
      const groupBeats = project.beats.filter(b => group.beatIds.includes(b.id))

      groupBeats.forEach((beat, beatIdx) => {
        beat.position = {
          x: currentGroupX + LAYOUT_CONSTANTS.GAP,
          y: beatY
        }
        beat.order = beatIdx
        beatY += LAYOUT_CONSTANTS.BEAT_HEIGHT + LAYOUT_CONSTANTS.GAP
      })

      group.order = groupIdx

      const groupHeight =
        LAYOUT_CONSTANTS.GROUP_HEADER_HEIGHT +
        LAYOUT_CONSTANTS.GAP +
        groupBeats.length * (LAYOUT_CONSTANTS.BEAT_HEIGHT + LAYOUT_CONSTANTS.GAP) +
        LAYOUT_CONSTANTS.GAP // Extra bottom padding
      maxGroupHeight = Math.max(maxGroupHeight, groupHeight)
      currentGroupX += LAYOUT_CONSTANTS.GROUP_WIDTH + LAYOUT_CONSTANTS.GAP
    })

    const blockHeight =
      LAYOUT_CONSTANTS.BLOCK_HEADER_HEIGHT +
      LAYOUT_CONSTANTS.GAP +
      maxGroupHeight +
      LAYOUT_CONSTANTS.BLOCK_PADDING
    currentLaneY += blockHeight + LAYOUT_CONSTANTS.GAP * 3
  })

  // Position orphan groups (not in any block)
  const orphanGroups = project.beatGroups.filter(group => {
    return !project.blocks.some(block => block.groupIds.includes(group.id))
  })

  orphanGroups.forEach((group, idx) => {
    const col = idx % LAYOUT_CONSTANTS.GROUP_COLS
    const row = Math.floor(idx / LAYOUT_CONSTANTS.GROUP_COLS)

    group.position = {
      x: LAYOUT_CONSTANTS.GROUP_START_X + col * LAYOUT_CONSTANTS.GROUP_SPACING_X,
      y: currentLaneY + row * LAYOUT_CONSTANTS.GROUP_SPACING_Y
    }
    group.order = idx

    let beatY = group.position.y + LAYOUT_CONSTANTS.GROUP_HEADER_HEIGHT + LAYOUT_CONSTANTS.GAP
    const groupBeats = project.beats.filter(b => group.beatIds.includes(b.id))

    groupBeats.forEach((beat, beatIdx) => {
      beat.position = {
        x: group.position.x + LAYOUT_CONSTANTS.GAP,
        y: beatY
      }
      beat.order = beatIdx
      beatY += LAYOUT_CONSTANTS.BEAT_HEIGHT + LAYOUT_CONSTANTS.GAP
    })
  })

  // Position orphan beats (not in any group)
  const orphanBeats = project.beats.filter(beat => {
    return !project.beatGroups.some(group => group.beatIds.includes(beat.id))
  })

  orphanBeats.forEach((beat, idx) => {
    const col = idx % LAYOUT_CONSTANTS.BEAT_COLS
    const row = Math.floor(idx / LAYOUT_CONSTANTS.BEAT_COLS)

    beat.position = {
      x: LAYOUT_CONSTANTS.BEAT_START_X + col * LAYOUT_CONSTANTS.BEAT_SPACING_X,
      y: LAYOUT_CONSTANTS.BEAT_START_Y + row * LAYOUT_CONSTANTS.BEAT_SPACING_Y
    }
    beat.order = idx
  })
}
