/**
 * Application layer: Block management service
 * Orchestrates domain operations with lane integration
 */

import type { Project, Block } from '@/domain/entities'
import * as blockOps from '@/domain/operations/blockOperations'
import * as laneOps from '@/domain/operations/laneOperations'
import { calculateBlockWidth } from '@/domain/operations/geometry'

export class BlockManagementService {
  // ============================================================
  // Block Operations
  // ============================================================

  /**
   * Create a new Block with the specified groups
   */
  createBlock(project: Project, groupIds: string[], name: string = 'New Block'): Project {
    return blockOps.createBlock(project, groupIds, name)
  }

  /**
   * Update a Block's properties
   */
  updateBlock(
    project: Project,
    blockId: string,
    updates: Partial<Pick<Block, 'name' | 'position'>>
  ): Project {
    return blockOps.updateBlock(project, blockId, updates)
  }

  /**
   * Delete a Block
   */
  deleteBlock(project: Project, blockId: string): Project {
    return blockOps.deleteBlock(project, blockId)
  }

  /**
   * Add a group to a Block
   * Integrates with lane repositioning if block is in a lane
   */
  addGroupToBlock(
    project: Project,
    blockId: string,
    groupId: string,
    targetGroupId?: string
  ): Project {
    let updatedProject = blockOps.addGroupToBlock(project, blockId, groupId, targetGroupId)

    // If block is in a lane, reposition all blocks in the lane
    const lane = laneOps.getLaneForBlock(updatedProject, blockId)
    if (lane) {
      updatedProject = laneOps.repositionBlocksInLane(updatedProject, lane.id)
    }

    return updatedProject
  }

  /**
   * Remove a group from a Block
   * Integrates with lane repositioning if block is in a lane
   */
  removeGroupFromBlock(project: Project, blockId: string, groupId: string): Project {
    let updatedProject = blockOps.removeGroupFromBlock(project, blockId, groupId)

    // If block still exists and is in a lane, reposition all blocks in the lane
    const blockStillExists = updatedProject.blocks.some(b => b.id === blockId)
    if (blockStillExists) {
      const lane = laneOps.getLaneForBlock(updatedProject, blockId)
      if (lane) {
        updatedProject = laneOps.repositionBlocksInLane(updatedProject, lane.id)
      }
    }

    return updatedProject
  }

  /**
   * Get the Block that contains a group
   */
  getBlockForGroup(project: Project, groupId: string): Block | undefined {
    return blockOps.getBlockForGroup(project, groupId)
  }

  /**
   * Reposition all groups within a Block
   */
  repositionGroupsInBlock(project: Project, blockId: string): Project {
    return blockOps.repositionGroupsInBlock(project, blockId)
  }

  /**
   * Get the width of a Block
   */
  getBlockWidth(block: Block): number {
    return calculateBlockWidth(block.groupIds.length)
  }
}

export const blockManagementService = new BlockManagementService()
