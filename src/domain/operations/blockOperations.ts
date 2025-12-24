/**
 * Domain layer: Pure block operations
 * All functions return a new Project (immutable pattern)
 */

import type { Project, Block } from '@/domain/entities'
import { v4 as uuidv4 } from '@/utils/uuid'
import { LAYOUT_CONSTANTS } from './geometry'
import { repositionBeatsInGroup } from './groupOperations'

/**
 * Create a new Block with the specified groups
 * Returns updated project with the new block
 */
export function createBlock(
  project: Project,
  groupIds: string[],
  name: string = 'New Block'
): Project {
  if (groupIds.length < 2) {
    console.warn('Block requires at least 2 groups')
    return project
  }

  const now = new Date().toISOString()
  const firstGroup = project.beatGroups.find(g => g.id === groupIds[0])
  if (!firstGroup) return project

  // Generate random color for visual representation
  const randomColor = `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, '0')}`

  const newBlock: Block = {
    id: uuidv4(),
    name,
    groupIds,
    position: {
      x: firstGroup.position.x,
      y: firstGroup.position.y - LAYOUT_CONSTANTS.BLOCK_HEADER_HEIGHT
    },
    color: randomColor,
    createdAt: now,
    updatedAt: now
  }

  let updatedProject = {
    ...project,
    blocks: [...(project.blocks || []), newBlock],
    updatedAt: now
  }

  // Reposition groups horizontally within the block
  updatedProject = repositionGroupsInBlock(updatedProject, newBlock.id)

  return updatedProject
}

/**
 * Update a Block's properties
 * Returns updated project
 */
export function updateBlock(
  project: Project,
  blockId: string,
  updates: Partial<Pick<Block, 'name' | 'position'>>
): Project {
  const now = new Date().toISOString()

  return {
    ...project,
    blocks: (project.blocks || []).map(b =>
      b.id === blockId ? { ...b, ...updates, updatedAt: now } : b
    ),
    updatedAt: now
  }
}

/**
 * Delete a Block (groups remain but are no longer horizontally linked)
 * Returns updated project
 */
export function deleteBlock(project: Project, blockId: string): Project {
  return {
    ...project,
    blocks: (project.blocks || []).filter(b => b.id !== blockId),
    updatedAt: new Date().toISOString()
  }
}

/**
 * Add a group to a Block at a specific position (before targetGroupId)
 * If targetGroupId is null, adds to the end
 * Returns updated project
 */
export function addGroupToBlock(
  project: Project,
  blockId: string,
  groupId: string,
  targetGroupId?: string
): Project {
  const block = (project.blocks || []).find(b => b.id === blockId)
  if (!block) return project

  // Remove group from any existing block first
  let updatedProject = project
  const oldBlock = getBlockForGroup(project, groupId)
  if (oldBlock && oldBlock.id !== blockId) {
    updatedProject = removeGroupFromBlock(updatedProject, oldBlock.id, groupId)
  }

  // Find insertion index
  let newGroupIds: string[]
  if (targetGroupId && block.groupIds.includes(targetGroupId)) {
    const targetIndex = block.groupIds.indexOf(targetGroupId)
    newGroupIds = [...block.groupIds]
    const currentIndex = newGroupIds.indexOf(groupId)

    if (currentIndex !== -1) {
      newGroupIds.splice(currentIndex, 1)
      const adjustedTargetIndex = currentIndex < targetIndex ? targetIndex - 1 : targetIndex
      newGroupIds.splice(adjustedTargetIndex, 0, groupId)
    } else {
      newGroupIds.splice(targetIndex, 0, groupId)
    }
  } else {
    newGroupIds = block.groupIds.includes(groupId) ? block.groupIds : [...block.groupIds, groupId]
  }

  const now = new Date().toISOString()

  updatedProject = {
    ...updatedProject,
    blocks: (updatedProject.blocks || []).map(b =>
      b.id === blockId ? { ...b, groupIds: newGroupIds, updatedAt: now } : b
    ),
    updatedAt: now
  }

  // Reposition groups
  updatedProject = repositionGroupsInBlock(updatedProject, blockId)

  // Reposition beats in all groups of the block
  const updatedBlock = (updatedProject.blocks || []).find(b => b.id === blockId)
  if (updatedBlock) {
    updatedBlock.groupIds.forEach(gId => {
      updatedProject = repositionBeatsInGroup(updatedProject, gId)
    })
  }

  return updatedProject
}

/**
 * Remove a group from a Block
 * If only 1 group remains, delete the Block
 * Returns updated project
 */
export function removeGroupFromBlock(project: Project, blockId: string, groupId: string): Project {
  const block = (project.blocks || []).find(b => b.id === blockId)
  if (!block) return project

  const newGroupIds = block.groupIds.filter(id => id !== groupId)

  // If only 1 group left, delete the block
  if (newGroupIds.length <= 1) {
    return deleteBlock(project, blockId)
  }

  const now = new Date().toISOString()

  let updatedProject = {
    ...project,
    blocks: (project.blocks || []).map(b =>
      b.id === blockId ? { ...b, groupIds: newGroupIds, updatedAt: now } : b
    ),
    updatedAt: now
  }

  // Reposition remaining groups to fill the gap
  updatedProject = repositionGroupsInBlock(updatedProject, blockId)

  // Reposition beats in all remaining groups
  newGroupIds.forEach(gId => {
    updatedProject = repositionBeatsInGroup(updatedProject, gId)
  })

  return updatedProject
}

/**
 * Get the Block that contains a group
 * Returns the block or undefined
 */
export function getBlockForGroup(project: Project, groupId: string): Block | undefined {
  return (project.blocks || []).find(b => b.groupIds.includes(groupId))
}

/**
 * Reposition all groups within a Block horizontally
 * Groups are aligned to the same Y position and spaced horizontally
 * Returns updated project
 */
export function repositionGroupsInBlock(project: Project, blockId: string): Project {
  const block = (project.blocks || []).find(b => b.id === blockId)
  if (!block) return project

  const baseY = block.position.y + LAYOUT_CONSTANTS.BLOCK_HEADER_HEIGHT
  const now = new Date().toISOString()

  return {
    ...project,
    beatGroups: project.beatGroups.map(group => {
      const indexInBlock = block.groupIds.indexOf(group.id)

      if (indexInBlock !== -1) {
        const newX =
          block.position.x + indexInBlock * (LAYOUT_CONSTANTS.GROUP_WIDTH + LAYOUT_CONSTANTS.GAP)

        return {
          ...group,
          position: {
            x: newX,
            y: baseY
          },
          updatedAt: now
        }
      }
      return group
    }),
    updatedAt: now
  }
}
