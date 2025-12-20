/**
 * Application layer: Beat and BeatGroup management service
 * Orchestrates domain operations with additional business logic
 */

import type { Project, Beat, BeatGroup } from '@/domain/entities'
import * as beatOps from '@/domain/operations/beatOperations'
import * as groupOps from '@/domain/operations/groupOperations'

export class BeatManagementService {
  // ============================================================
  // Beat Operations
  // ============================================================

  /**
   * Create a new beat and add it to the project
   */
  createBeat(project: Project, typeId: string): Project {
    return beatOps.createBeat(project, typeId)
  }

  /**
   * Update an existing beat
   */
  updateBeat(project: Project, beatId: string, updates: Partial<Beat>): Project {
    return beatOps.updateBeat(project, beatId, updates)
  }

  /**
   * Delete a beat
   */
  deleteBeat(project: Project, beatId: string): Project {
    return beatOps.deleteBeat(project, beatId)
  }

  /**
   * Get beats sorted by order field
   */
  getSortedBeats(project: Project): Beat[] {
    return beatOps.getSortedBeats(project)
  }

  // ============================================================
  // BeatGroup Operations
  // ============================================================

  /**
   * Create a new beat group and add it to the project
   */
  createBeatGroup(project: Project, name: string, beatIds: string[] = []): Project {
    const group = groupOps.createBeatGroup(project, name, beatIds)
    return groupOps.addBeatGroup(project, group)
  }

  /**
   * Update an existing beat group
   */
  updateBeatGroup(project: Project, groupId: string, updates: Partial<BeatGroup>): Project {
    return groupOps.updateBeatGroup(project, groupId, updates)
  }

  /**
   * Delete a beat group
   */
  deleteBeatGroup(project: Project, groupId: string): Project {
    return groupOps.deleteBeatGroup(project, groupId)
  }

  /**
   * Add beats to a group and reposition them
   */
  addBeatsToGroup(project: Project, groupId: string, beatIds: string[]): Project {
    return groupOps.addBeatsToGroup(project, groupId, beatIds)
  }

  /**
   * Insert a beat before another beat in a group
   */
  insertBeatBeforeInGroup(
    project: Project,
    groupId: string,
    beatIdToInsert: string,
    targetBeatId: string
  ): Project {
    return groupOps.insertBeatBeforeInGroup(project, groupId, beatIdToInsert, targetBeatId)
  }

  /**
   * Remove a beat from a group and reposition remaining beats
   */
  removeBeatFromGroup(project: Project, beatId: string, groupId: string): Project {
    return groupOps.removeBeatFromGroup(project, beatId, groupId)
  }

  /**
   * Reposition all beats in a group
   */
  repositionBeatsInGroup(project: Project, groupId: string): Project {
    return groupOps.repositionBeatsInGroup(project, groupId)
  }

  /**
   * Get the group that contains a beat
   */
  getGroupForBeat(project: Project, beatId: string): BeatGroup | undefined {
    return groupOps.getGroupForBeat(project, beatId)
  }

  /**
   * Check if a beat belongs to any group
   */
  belongsToBeatGroup(project: Project, beatId: string): boolean {
    return groupOps.belongsToBeatGroup(project, beatId)
  }
}

export const beatManagementService = new BeatManagementService()
