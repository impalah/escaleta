/**
 * Application layer: Lane management service
 * Orchestrates domain operations for lane management
 */

import type { Project, Lane } from '@/domain/entities'
import * as laneOps from '@/domain/operations/laneOperations'
import { calculateBlockHeight } from '@/domain/operations/geometry'

export class LaneManagementService {
  // ============================================================
  // Lane Operations
  // ============================================================

  /**
   * Create a new Lane with given blocks
   */
  createLane(project: Project, blockIds: string[], name?: string): Project {
    return laneOps.createLane(project, blockIds, name)
  }

  /**
   * Update a Lane
   */
  updateLane(project: Project, laneId: string, updates: Partial<Lane>): Project {
    return laneOps.updateLane(project, laneId, updates)
  }

  /**
   * Delete a Lane
   */
  deleteLane(project: Project, laneId: string): Project {
    return laneOps.deleteLane(project, laneId)
  }

  /**
   * Add a Block to a Lane
   */
  addBlockToLane(
    project: Project,
    laneId: string,
    blockId: string,
    targetBlockId?: string
  ): Project {
    return laneOps.addBlockToLane(project, laneId, blockId, targetBlockId)
  }

  /**
   * Remove a Block from its Lane
   */
  removeBlockFromLane(project: Project, blockId: string): Project {
    return laneOps.removeBlockFromLane(project, blockId)
  }

  /**
   * Reposition all Blocks in a Lane
   */
  repositionBlocksInLane(project: Project, laneId: string): Project {
    return laneOps.repositionBlocksInLane(project, laneId)
  }

  /**
   * Get the Lane that contains a specific Block
   */
  getLaneForBlock(project: Project, blockId: string): Lane | null {
    return laneOps.getLaneForBlock(project, blockId)
  }

  /**
   * Check if a Block is the first in its Lane
   */
  isFirstBlockInLane(project: Project, blockId: string): boolean {
    return laneOps.isFirstBlockInLane(project, blockId)
  }

  /**
   * Get the height of a Block (utility for UI)
   */
  getBlockHeight(project: Project, blockId: string): number {
    const block = project.blocks.find(b => b.id === blockId)
    if (!block) return 0

    return calculateBlockHeight(project, block)
  }
}

export const laneManagementService = new LaneManagementService()
