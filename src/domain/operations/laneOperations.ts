/**
 * Domain layer: Pure lane operations
 * All functions return a new Project (immutable pattern)
 */

import type { Project, Lane, Position } from '@/domain/entities'
import { v4 as uuidv4 } from '@/utils/uuid'
import { calculateBlockHeight, LAYOUT_CONSTANTS } from './geometry'

/**
 * Create a new Lane with given blocks
 * Returns updated project with the new lane and repositioned blocks
 */
export function createLane(
  project: Project,
  blockIds: string[],
  name?: string
): Project {
  const now = new Date().toISOString()

  const firstBlock = project.blocks.find(b => b.id === blockIds[0])
  if (!firstBlock) return project

  // Store original positions of ALL blocks and their content BEFORE any changes
  const originalBlockPositions = new Map<string, Position>()
  const originalGroupPositions = new Map<string, Position>()
  const originalBeatPositions = new Map<string, Position>()

  blockIds.forEach(blockId => {
    const block = project.blocks.find(b => b.id === blockId)
    if (block) {
      originalBlockPositions.set(blockId, { ...block.position })

      block.groupIds.forEach(groupId => {
        const group = project.beatGroups.find(g => g.id === groupId)
        if (group) {
          originalGroupPositions.set(groupId, { ...group.position })

          group.beatIds.forEach(beatId => {
            const beat = project.beats.find(b => b.id === beatId)
            if (beat) {
              originalBeatPositions.set(beatId, { ...beat.position })
            }
          })
        }
      })
    }
  })

  const newLane: Lane = {
    id: uuidv4(),
    name: name || `Lane ${project.lanes.length + 1}`,
    blockIds: [...blockIds],
    position: { ...firstBlock.position },
    createdAt: now,
    updatedAt: now
  }

  let updatedProject = {
    ...project,
    lanes: [...project.lanes, newLane],
    updatedAt: now
  }

  // Reposition blocks vertically in the lane
  updatedProject = repositionBlocksInLane(updatedProject, newLane.id)

  // Now move all groups and beats with their blocks
  blockIds.forEach(blockId => {
    const repositionedBlock = updatedProject.blocks.find(b => b.id === blockId)
    const originalBlockPos = originalBlockPositions.get(blockId)

    if (repositionedBlock && originalBlockPos) {
      const deltaX = repositionedBlock.position.x - originalBlockPos.x
      const deltaY = repositionedBlock.position.y - originalBlockPos.y

      if (deltaX !== 0 || deltaY !== 0) {
        // Move all groups in this block
        repositionedBlock.groupIds.forEach(groupId => {
          const group = updatedProject.beatGroups.find(g => g.id === groupId)
          const originalGroupPos = originalGroupPositions.get(groupId)

          if (group && originalGroupPos) {
            group.position.x = originalGroupPos.x + deltaX
            group.position.y = originalGroupPos.y + deltaY

            // Move all beats in this group
            group.beatIds.forEach(beatId => {
              const beat = updatedProject.beats.find(b => b.id === beatId)
              const originalBeatPos = originalBeatPositions.get(beatId)

              if (beat && originalBeatPos) {
                beat.position.x = originalBeatPos.x + deltaX
                beat.position.y = originalBeatPos.y + deltaY
              }
            })
          }
        })
      }
    }
  })

  return updatedProject
}

/**
 * Update a Lane
 * Returns updated project
 */
export function updateLane(
  project: Project,
  laneId: string,
  updates: Partial<Lane>
): Project {
  const now = new Date().toISOString()

  return {
    ...project,
    lanes: project.lanes.map(lane =>
      lane.id === laneId ? { ...lane, ...updates, updatedAt: now } : lane
    ),
    updatedAt: now
  }
}

/**
 * Delete a Lane (blocks remain but are disconnected)
 * Returns updated project
 */
export function deleteLane(project: Project, laneId: string): Project {
  return {
    ...project,
    lanes: project.lanes.filter(lane => lane.id !== laneId),
    updatedAt: new Date().toISOString()
  }
}

/**
 * Add a Block to a Lane at specific position
 * Returns updated project
 */
export function addBlockToLane(
  project: Project,
  laneId: string,
  blockId: string,
  targetBlockId?: string
): Project {
  const lane = project.lanes.find(l => l.id === laneId)
  const block = project.blocks.find(b => b.id === blockId)
  if (!lane || !block) return project

  // Store original position to calculate delta
  const originalBlockPosition = { ...block.position }

  // Also store original positions of all groups and beats
  const originalGroupPositions = new Map<string, Position>()
  const originalBeatPositions = new Map<string, Position>()

  block.groupIds.forEach(groupId => {
    const group = project.beatGroups.find(g => g.id === groupId)
    if (group) {
      originalGroupPositions.set(groupId, { ...group.position })

      group.beatIds.forEach(beatId => {
        const beat = project.beats.find(b => b.id === beatId)
        if (beat) {
          originalBeatPositions.set(beatId, { ...beat.position })
        }
      })
    }
  })

  // Remove block from any existing lane
  let updatedProject = removeBlockFromLane(project, blockId)

  const updatedLane = updatedProject.lanes.find(l => l.id === laneId)!

  let newBlockIds: string[]
  if (targetBlockId) {
    const targetIndex = updatedLane.blockIds.indexOf(targetBlockId)
    if (targetIndex === -1) {
      newBlockIds = [...updatedLane.blockIds, blockId]
    } else {
      newBlockIds = [
        ...updatedLane.blockIds.slice(0, targetIndex + 1),
        blockId,
        ...updatedLane.blockIds.slice(targetIndex + 1)
      ]
    }
  } else {
    newBlockIds = [...updatedLane.blockIds, blockId]
  }

  updatedProject = updateLane(updatedProject, laneId, { blockIds: newBlockIds })

  // Reposition the block in the lane
  const repositionedProject = repositionBlocksInLane(updatedProject, laneId)

  const repositionedBlock = repositionedProject.blocks.find(b => b.id === blockId)
  if (repositionedBlock) {
    const deltaX = repositionedBlock.position.x - originalBlockPosition.x
    const deltaY = repositionedBlock.position.y - originalBlockPosition.y

    // Move groups and beats with the same delta
    if (deltaX !== 0 || deltaY !== 0) {
      repositionedBlock.groupIds.forEach(groupId => {
        const group = repositionedProject.beatGroups.find(g => g.id === groupId)
        const originalGroupPos = originalGroupPositions.get(groupId)
        if (group && originalGroupPos) {
          group.position.x = originalGroupPos.x + deltaX
          group.position.y = originalGroupPos.y + deltaY

          // Move all beats in this group
          group.beatIds.forEach(beatId => {
            const beat = repositionedProject.beats.find(b => b.id === beatId)
            const originalBeatPos = originalBeatPositions.get(beatId)
            if (beat && originalBeatPos) {
              beat.position.x = originalBeatPos.x + deltaX
              beat.position.y = originalBeatPos.y + deltaY
            }
          })
        }
      })
    }
  }

  return repositionedProject
}

/**
 * Remove a Block from its Lane
 * Returns updated project
 */
export function removeBlockFromLane(project: Project, blockId: string): Project {
  let updated = { ...project }

  // Find lane containing this block
  const lane = project.lanes.find(l => l.blockIds.includes(blockId))
  if (!lane) return project

  const newBlockIds = lane.blockIds.filter(id => id !== blockId)

  // If lane has 0 or 1 blocks remaining, delete the lane
  if (newBlockIds.length <= 1) {
    updated = deleteLane(updated, lane.id)
  } else {
    updated = updateLane(updated, lane.id, { blockIds: newBlockIds })
    // Reposition remaining blocks
    updated = repositionBlocksInLane(updated, lane.id)
  }

  return updated
}

/**
 * Reposition all Blocks in a Lane vertically with proper spacing
 * Returns updated project
 */
export function repositionBlocksInLane(project: Project, laneId: string): Project {
  const lane = project.lanes.find(l => l.id === laneId)
  if (!lane || lane.blockIds.length === 0) return project

  // Store original positions of all blocks before repositioning
  const originalBlockPositions = new Map<string, Position>()
  lane.blockIds.forEach(blockId => {
    const block = project.blocks.find(b => b.id === blockId)
    if (block) {
      originalBlockPositions.set(blockId, { ...block.position })
    }
  })

  let currentY = lane.position.y + LAYOUT_CONSTANTS.LANE_HEADER_HEIGHT + LAYOUT_CONSTANTS.GAP

  const updatedBlocks = [...project.blocks]

  for (const blockId of lane.blockIds) {
    const blockIndex = updatedBlocks.findIndex(b => b.id === blockId)
    if (blockIndex === -1) continue

    const block = updatedBlocks[blockIndex]
    const originalBlockPos = originalBlockPositions.get(blockId)!

    // Calculate block height (including all its content)
    const blockHeight = calculateBlockHeight(project, block)

    // Update block position (X aligned with lane, Y stacked vertically)
    updatedBlocks[blockIndex] = {
      ...block,
      position: {
        x: lane.position.x,
        y: currentY
      },
      updatedAt: new Date().toISOString()
    }

    // Calculate delta for this block
    const deltaX = lane.position.x - originalBlockPos.x
    const deltaY = currentY - originalBlockPos.y

    // Move all groups and beats in this block by the same delta
    if (deltaX !== 0 || deltaY !== 0) {
      block.groupIds.forEach(groupId => {
        const group = project.beatGroups.find(g => g.id === groupId)
        if (group) {
          group.position.x += deltaX
          group.position.y += deltaY

          // Move all beats in this group
          group.beatIds.forEach(beatId => {
            const beat = project.beats.find(b => b.id === beatId)
            if (beat) {
              beat.position.x += deltaX
              beat.position.y += deltaY
            }
          })
        }
      })
    }

    currentY += blockHeight + LAYOUT_CONSTANTS.GAP
  }

  return {
    ...project,
    blocks: updatedBlocks,
    lanes: project.lanes
  }
}

/**
 * Get the Lane that contains a specific Block
 * Returns the lane or null
 */
export function getLaneForBlock(project: Project, blockId: string): Lane | null {
  return project.lanes.find(lane => lane.blockIds.includes(blockId)) || null
}

/**
 * Check if a Block is the first in its Lane
 * Returns boolean
 */
export function isFirstBlockInLane(project: Project, blockId: string): boolean {
  const lane = getLaneForBlock(project, blockId)
  if (!lane) return true // Not in a lane, treat as independent

  return lane.blockIds[0] === blockId
}
