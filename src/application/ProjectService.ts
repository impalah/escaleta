import type { Project, Beat, BeatType, BeatGroup, Block, Lane } from '@/domain/entities'
import { storageService } from '@/infrastructure/LocalStorageService'
import { v4 as uuidv4 } from '@/utils/uuid'
import { t } from '@/i18n/helpers'
import { beatManagementService } from './services/BeatManagementService'
import { blockManagementService } from './services/BlockManagementService'
import { laneManagementService } from './services/LaneManagementService'

/**
 * Application layer: Facade for project management
 * Delegates domain operations to specialized services
 */
export class ProjectService {
  private storageService = storageService
  private beatMgmt = beatManagementService
  private blockMgmt = blockManagementService
  private laneMgmt = laneManagementService

  /**
   * Load the current project from storage, or create a default example if none exists
   */
  loadCurrentProject(): Project {
    const saved = this.storageService.loadProject()
    if (saved) {
      // Migrate old projects that don't have beatGroups, blocks, or lanes
      if (!saved.beatGroups) {
        saved.beatGroups = []
      }
      if (!saved.blocks) {
        saved.blocks = []
      }
      if (!saved.lanes) {
        saved.lanes = []
      }
      return saved
    }

    // Create and save example project
    const example = this.createExampleProject()
    this.storageService.saveProject(example)
    return example
  }

  /**
   * Save the current project to storage
   */
  saveCurrentProject(project: Project): void {
    this.storageService.saveProject(project)
  }

  /**
   * Create a new empty project
   */
  createNewProject(name: string, description: string): Project {
    const now = new Date().toISOString()
    return {
      id: uuidv4(),
      name,
      description,
      beats: [],
      beatTypes: this.getDefaultBeatTypes(),
      beatGroups: [],
      blocks: [],
      lanes: [],
      createdAt: now,
      updatedAt: now
    }
  }

  /**
   * Create an example project with predefined beats for a news broadcast
   */
  createExampleProject(): Project {
    const now = new Date().toISOString()
    const beatTypes = this.getDefaultBeatTypes()

    const beats: Beat[] = [
      {
        id: uuidv4(),
        title: t('examples.beats.opening.title'),
        description: t('examples.beats.opening.description'),
        typeId: 'opening',
        order: 1,
        position: { x: 100, y: 100 },
        links: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        title: t('examples.beats.headline1.title'),
        description: t('examples.beats.headline1.description'),
        typeId: 'news',
        order: 2,
        position: { x: 350, y: 100 },
        links: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        title: t('examples.beats.headline2.title'),
        description: t('examples.beats.headline2.description'),
        typeId: 'news',
        order: 3,
        position: { x: 600, y: 100 },
        links: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        title: t('examples.beats.sports.title'),
        description: t('examples.beats.sports.description'),
        typeId: 'sports',
        order: 4,
        position: { x: 100, y: 350 },
        links: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        title: t('examples.beats.weather.title'),
        description: t('examples.beats.weather.description'),
        typeId: 'weather',
        order: 5,
        position: { x: 350, y: 350 },
        links: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        title: t('examples.beats.headline3.title'),
        description: t('examples.beats.headline3.description'),
        typeId: 'news',
        order: 6,
        position: { x: 600, y: 350 },
        links: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        title: t('examples.beats.closing.title'),
        description: t('examples.beats.closing.description'),
        typeId: 'closing',
        order: 7,
        position: { x: 850, y: 350 },
        links: [],
        createdAt: now,
        updatedAt: now
      }
    ]

    return {
      id: uuidv4(),
      name: t('examples.projectName'),
      description: t('examples.projectDescription'),
      beats,
      beatTypes,
      beatGroups: [],
      blocks: [],
      lanes: [],
      createdAt: now,
      updatedAt: now
    }
  }

  /**
   * Get default beat types for a broadcast project
   */
  private getDefaultBeatTypes(): BeatType[] {
    return [
      { id: 'opening', name: 'Opening', color: '#4CAF50', icon: 'mdi-play-circle' },
      { id: 'news', name: 'News', color: '#2196F3', icon: 'mdi-newspaper' },
      { id: 'sports', name: 'Sports', color: '#F44336', icon: 'mdi-soccer' },
      { id: 'weather', name: 'Weather', color: '#00BCD4', icon: 'mdi-weather-partly-cloudy' },
      { id: 'closing', name: 'Closing', color: '#607D8B', icon: 'mdi-stop-circle' }
    ]
  }

  /**
   * Create a new beat with default values based on type
   */
  createBeat(typeId: string, project: Project): Beat {
    // Create beat directly and return it (not wrapped in project)
    const updatedProject = this.beatMgmt.createBeat(project, typeId)
    return updatedProject.beats[updatedProject.beats.length - 1]
  }

  /**
   * Update an existing beat
   */
  updateBeat(project: Project, beatId: string, updates: Partial<Beat>): Project {
    return this.beatMgmt.updateBeat(project, beatId, updates)
  }

  /**
   * Delete a beat
   */
  deleteBeat(project: Project, beatId: string): Project {
    return this.beatMgmt.deleteBeat(project, beatId)
  }

  /**
   * Get beats sorted by order field
   */
  getSortedBeats(project: Project): Beat[] {
    return this.beatMgmt.getSortedBeats(project)
  }

  // ============================================================
  // BeatGroup Management (delegated to BeatManagementService)
  // ============================================================

  /**
   * Create a new beat group
   */
  createBeatGroup(project: Project, name: string, beatIds: string[] = []): BeatGroup {
    // Create and extract the group from the updated project
    const updatedProject = this.beatMgmt.createBeatGroup(project, name, beatIds)
    return updatedProject.beatGroups[updatedProject.beatGroups.length - 1]
  }

  /**
   * Add a group to the project
   */
  addBeatGroup(project: Project, group: BeatGroup): Project {
    return {
      ...project,
      beatGroups: [...project.beatGroups, group],
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Update an existing beat group
   */
  updateBeatGroup(project: Project, groupId: string, updates: Partial<BeatGroup>): Project {
    return this.beatMgmt.updateBeatGroup(project, groupId, updates)
  }

  /**
   * Delete a beat group
   */
  deleteBeatGroup(project: Project, groupId: string): Project {
    return this.beatMgmt.deleteBeatGroup(project, groupId)
  }

  /**
   * Add beats to a group
   */
  addBeatsToGroup(project: Project, groupId: string, beatIds: string[]): Project {
    return this.beatMgmt.addBeatsToGroup(project, groupId, beatIds)
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
    return this.beatMgmt.insertBeatBeforeInGroup(project, groupId, beatIdToInsert, targetBeatId)
  }

  /**
   * Reposition all beats in a group according to their index
   */
  repositionBeatsInGroup(project: Project, groupId: string): Project {
    return this.beatMgmt.repositionBeatsInGroup(project, groupId)
  }

  /**
   * Remove a beat from a group and reposition remaining beats
   */
  removeBeatFromGroup(project: Project, beatId: string, groupId: string): Project {
    return this.beatMgmt.removeBeatFromGroup(project, beatId, groupId)
  }

  /**
   * Get the group that contains a beat
   */
  getGroupForBeat(project: Project, beatId: string): BeatGroup | undefined {
    return this.beatMgmt.getGroupForBeat(project, beatId)
  }

  /**
   * Check if a beat belongs to a group
   */
  belongsToBeatGroup(project: Project, beatId: string): boolean {
    return this.beatMgmt.belongsToBeatGroup(project, beatId)
  }

  // ============================================================
  // Block Management (delegated to BlockManagementService)
  // ============================================================

  /**
   * Create a new Block with the specified groups
   */
  createBlock(project: Project, groupIds: string[], name: string = 'New Block'): Project {
    return this.blockMgmt.createBlock(project, groupIds, name)
  }

  /**
   * Update a Block's properties
   */
  updateBlock(
    project: Project,
    blockId: string,
    updates: Partial<Pick<Block, 'name' | 'position'>>
  ): Project {
    return this.blockMgmt.updateBlock(project, blockId, updates)
  }

  /**
   * Delete a Block (groups remain but are no longer horizontally linked)
   */
  deleteBlock(project: Project, blockId: string): Project {
    return this.blockMgmt.deleteBlock(project, blockId)
  }

  /**
   * Add a group to a Block at a specific position (before targetGroupId)
   */
  addGroupToBlock(
    project: Project,
    blockId: string,
    groupId: string,
    targetGroupId?: string
  ): Project {
    return this.blockMgmt.addGroupToBlock(project, blockId, groupId, targetGroupId)
  }

  /**
   * Remove a group from a Block
   */
  removeGroupFromBlock(project: Project, blockId: string, groupId: string): Project {
    return this.blockMgmt.removeGroupFromBlock(project, blockId, groupId)
  }

  /**
   * Get the Block that contains a group
   */
  getBlockForGroup(project: Project, groupId: string): Block | undefined {
    return this.blockMgmt.getBlockForGroup(project, groupId)
  }

  /**
   * Reposition all groups within a Block horizontally
   */
  repositionGroupsInBlock(project: Project, blockId: string): Project {
    return this.blockMgmt.repositionGroupsInBlock(project, blockId)
  }

  /**
   * Calculate the width of a Block based on its groups
   */
  getBlockWidth(block: Block): number {
    return this.blockMgmt.getBlockWidth(block)
  }

  // ============================================================
  // Lane Management (delegated to LaneManagementService)
  // ============================================================

  /**
   * Create a new Lane with given blocks
   */
  createLane(project: Project, blockIds: string[], name?: string): Project {
    return this.laneMgmt.createLane(project, blockIds, name)
  }

  /**
   * Update a Lane
   */
  updateLane(project: Project, laneId: string, updates: Partial<Lane>): Project {
    return this.laneMgmt.updateLane(project, laneId, updates)
  }

  /**
   * Delete a Lane (blocks remain but are disconnected)
   */
  deleteLane(project: Project, laneId: string): Project {
    return this.laneMgmt.deleteLane(project, laneId)
  }

  /**
   * Add a Block to a Lane at specific position
   */
  addBlockToLane(
    project: Project,
    laneId: string,
    blockId: string,
    targetBlockId?: string
  ): Project {
    return this.laneMgmt.addBlockToLane(project, laneId, blockId, targetBlockId)
  }

  /**
   * Remove a Block from its Lane
   */
  removeBlockFromLane(project: Project, blockId: string): Project {
    return this.laneMgmt.removeBlockFromLane(project, blockId)
  }

  /**
   * Reposition all Blocks in a Lane vertically with proper spacing
   */
  repositionBlocksInLane(project: Project, laneId: string): Project {
    return this.laneMgmt.repositionBlocksInLane(project, laneId)
  }

  /**
   * Calculate the total height of a Block including all its content
   */
  getBlockHeight(project: Project, blockId: string): number {
    return this.laneMgmt.getBlockHeight(project, blockId)
  }

  /**
   * Get the Lane that contains a specific Block
   */
  getLaneForBlock(project: Project, blockId: string): Lane | null {
    return this.laneMgmt.getLaneForBlock(project, blockId)
  }

  /**
   * Check if a Block is the first in its Lane
   */
  isFirstBlockInLane(project: Project, blockId: string): boolean {
    return this.laneMgmt.isFirstBlockInLane(project, blockId)
  }

  // TODO: Implement export to JSON
  // TODO: Implement export to script format
  // TODO: Implement import from external formats
}

export const projectService = new ProjectService()
