import type { Project, Beat, BeatType, BeatGroup, Block, Lane, Position } from '@/domain/entities'
import { storageService } from '@/infrastructure/LocalStorageService'
import { v4 as uuidv4 } from '@/utils/uuid'
import { t, getNewBeatTitle } from '@/i18n/helpers'

/**
 * Application layer: orchestrates business logic
 * Uses storage service from infrastructure layer
 */
export class ProjectService {
  private storageService = storageService

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
    const now = new Date().toISOString()

    // Calculate next available position in a visible grid layout
    const beatsCount = project.beats.length
    const COLS = 4 // Number of beats per row
    const SPACING_X = 450
    const SPACING_Y = 150
    const START_X = 100
    const START_Y = 100
    
    const col = beatsCount % COLS
    const row = Math.floor(beatsCount / COLS)
    
    const nextX = START_X + (col * SPACING_X)
    const nextY = START_Y + (row * SPACING_Y)

    // Calculate next order number
    const maxOrder = project.beats.reduce((max, b) => Math.max(max, b.order), 0)
    const nextOrder = maxOrder + 1

    return {
      id: uuidv4(),
      title: getNewBeatTitle(typeId),
      description: '',
      typeId,
      order: nextOrder,
      position: { x: nextX, y: nextY },
      links: [],
      createdAt: now,
      updatedAt: now
    }
  }

  /**
   * Update an existing beat
   */
  updateBeat(project: Project, beatId: string, updates: Partial<Beat>): Project {
    return {
      ...project,
      beats: project.beats.map(beat =>
        beat.id === beatId
          ? { ...beat, ...updates, updatedAt: new Date().toISOString() }
          : beat
      ),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Delete a beat
   */
  deleteBeat(project: Project, beatId: string): Project {
    return {
      ...project,
      beats: project.beats.filter(beat => beat.id !== beatId),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Get beats sorted by order field
   */
  getSortedBeats(project: Project): Beat[] {
    return [...project.beats].sort((a, b) => a.order - b.order)
  }

  /**
   * Create a new beat group
   */
  createBeatGroup(project: Project, name: string, beatIds: string[] = []): BeatGroup {
    const now = new Date().toISOString()
    
    // Calculate next order number
    const maxOrder = project.beatGroups.reduce((max, g) => Math.max(max, g.order), 0)
    const nextOrder = maxOrder + 1
    
    // Calculate initial position in a visible grid layout
    const groupsCount = project.beatGroups.length
    const COLS = 3 // Number of groups per row
    const SPACING_X = 500
    const SPACING_Y = 200
    const START_X = 100
    const START_Y = 50
    
    const col = groupsCount % COLS
    const row = Math.floor(groupsCount / COLS)
    
    const nextX = START_X + (col * SPACING_X)
    const nextY = START_Y + (row * SPACING_Y)
    
    return {
      id: uuidv4(),
      name,
      description: '',
      beatIds,
      position: { x: nextX, y: nextY },
      collapsed: false,
      order: nextOrder,
      createdAt: now,
      updatedAt: now
    }
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
    return {
      ...project,
      beatGroups: project.beatGroups.map(group =>
        group.id === groupId
          ? { ...group, ...updates, updatedAt: new Date().toISOString() }
          : group
      ),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Delete a beat group
   */
  deleteBeatGroup(project: Project, groupId: string): Project {
    return {
      ...project,
      beatGroups: project.beatGroups.filter(group => group.id !== groupId),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Add beats to a group
   */
  addBeatsToGroup(project: Project, groupId: string, beatIds: string[]): Project {
    const group = project.beatGroups.find(g => g.id === groupId)
    if (!group) return project

    // Update group with new beats
    const updatedProject = {
      ...project,
      beatGroups: project.beatGroups.map(g =>
        g.id === groupId
          ? { 
              ...g, 
              beatIds: [...new Set([...g.beatIds, ...beatIds])], // Remove duplicates
              updatedAt: new Date().toISOString() 
            }
          : g
      ),
      updatedAt: new Date().toISOString()
    }

    // Reposition all beats in the group
    return this.repositionBeatsInGroup(updatedProject, groupId)
  }

  /**
   * Insert a beat before another beat in a group
   * The dragged beat will take the position of the target beat,
   * and the target beat and all beats below it will shift down
   */
  insertBeatBeforeInGroup(project: Project, groupId: string, beatIdToInsert: string, targetBeatId: string): Project {
    const group = project.beatGroups.find(g => g.id === groupId)
    if (!group) return project

    // Find the index of the target beat
    const targetIndex = group.beatIds.indexOf(targetBeatId)
    if (targetIndex === -1) return project

    // Remove the beat from its current position in the array (if it exists)
    const currentIndex = group.beatIds.indexOf(beatIdToInsert)
    let newBeatIds = [...group.beatIds]
    
    if (currentIndex !== -1) {
      // Beat is already in this group, just reorder
      newBeatIds.splice(currentIndex, 1)
      // Adjust target index if we removed an item before it
      const adjustedTargetIndex = currentIndex < targetIndex ? targetIndex - 1 : targetIndex
      newBeatIds.splice(adjustedTargetIndex, 0, beatIdToInsert)
    } else {
      // Beat is new to this group, insert it
      newBeatIds.splice(targetIndex, 0, beatIdToInsert)
    }

    // Update group with new beat order
    const updatedProject = {
      ...project,
      beatGroups: project.beatGroups.map(g =>
        g.id === groupId
          ? { 
              ...g, 
              beatIds: newBeatIds,
              updatedAt: new Date().toISOString() 
            }
          : g
      ),
      updatedAt: new Date().toISOString()
    }

    // Reposition all beats in the group
    return this.repositionBeatsInGroup(updatedProject, groupId)
  }

  /**
   * Reposition all beats in a group according to their index
   * Beats are stacked vertically below the group header with proper spacing
   */
  repositionBeatsInGroup(project: Project, groupId: string): Project {
    const group = project.beatGroups.find(g => g.id === groupId)
    if (!group) return project

    const GROUP_HEADER_HEIGHT = 50
    const BEAT_HEIGHT = 80
    const GAP = 10

    return {
      ...project,
      beats: project.beats.map(beat => {
        const beatIndex = group.beatIds.indexOf(beat.id)
        if (beatIndex === -1) return beat // Beat not in this group

        // Calculate position: group.y + header + gap + (index * (beat height + gap))
        const newY = group.position.y + 
                     GROUP_HEADER_HEIGHT + 
                     GAP +
                     (beatIndex * (BEAT_HEIGHT + GAP))

        return {
          ...beat,
          position: {
            x: group.position.x, // Align with group
            y: newY
          },
          updatedAt: new Date().toISOString()
        }
      }),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Calculate the Y position for a beat in a group based on its index
   */
  private calculateBeatYPositionInGroup(groupY: number, beatIndex: number): number {
    const GAP = 10
    const GROUP_HEIGHT = 50
    const BEAT_HEIGHT = 80
    
    if (beatIndex === 0) {
      return groupY + GROUP_HEIGHT + GAP
    } else {
      return groupY + GROUP_HEIGHT + GAP + (beatIndex * (BEAT_HEIGHT + GAP))
    }
  }

  /**
   * Remove a beat from a group and reposition remaining beats
   * Simplified: Only removes the single beat, not its chain
   */
  removeBeatFromGroup(project: Project, beatId: string, groupId: string): Project {
    const group = project.beatGroups.find(g => g.id === groupId)
    const beat = project.beats.find(b => b.id === beatId)
    
    if (!group || !beat) return project

    // Remove ONLY this beat from the group (not its chain)
    const remainingBeatIds = group.beatIds.filter(id => id !== beatId)
    
    // Reposition remaining beats to fill the gap
    project = {
      ...project,
      beats: project.beats.map(b => {
        const indexInRemaining = remainingBeatIds.indexOf(b.id)
        
        // If this beat is in the remaining beats, recalculate its position
        if (indexInRemaining !== -1) {
          const newY = this.calculateBeatYPositionInGroup(group.position.y, indexInRemaining)
          
          return {
            ...b,
            position: {
              x: group.position.x,
              y: newY
            },
            updatedAt: new Date().toISOString()
          }
        }
        return b
      })
    }

    return {
      ...project,
      beatGroups: project.beatGroups.map(g =>
        g.id === groupId
          ? {
              ...g,
              beatIds: remainingBeatIds,
              updatedAt: new Date().toISOString()
            }
          : g
      ),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Get the group that contains a beat
   */
  getGroupForBeat(project: Project, beatId: string): BeatGroup | undefined {
    return project.beatGroups.find(g => g.beatIds.includes(beatId))
  }

  /**
   * Check if a beat belongs to a group
   */
  belongsToBeatGroup(project: Project, beatId: string): boolean {
    return project.beatGroups.some(g => g.beatIds.includes(beatId))
  }

  // ============================================================
  // Block Management Methods
  // ============================================================

  /**
   * Create a new Block with the specified groups
   */
  createBlock(project: Project, groupIds: string[], name: string = 'New Block'): Project {
    if (groupIds.length < 2) {
      console.warn('Block requires at least 2 groups')
      return project
    }

    const now = new Date().toISOString()
    const firstGroup = project.beatGroups.find(g => g.id === groupIds[0])
    if (!firstGroup) return project

    const BLOCK_HEIGHT = 50

    // Position block ABOVE the first group so that groups appear below block header
    const newBlock: Block = {
      id: uuidv4(),
      name,
      groupIds,
      position: { 
        x: firstGroup.position.x,
        y: firstGroup.position.y - BLOCK_HEIGHT // Block header above groups
      },
      createdAt: now,
      updatedAt: now
    }

    const updatedProject = {
      ...project,
      blocks: [...(project.blocks || []), newBlock],
      updatedAt: now
    }

    // Reposition groups horizontally within the block
    // This will align them at block.y + BLOCK_HEIGHT
    return this.repositionGroupsInBlock(updatedProject, newBlock.id)
  }

  /**
   * Update a Block's properties
   */
  updateBlock(project: Project, blockId: string, updates: Partial<Pick<Block, 'name' | 'position'>>): Project {
    const now = new Date().toISOString()

    return {
      ...project,
      blocks: (project.blocks || []).map(b =>
        b.id === blockId
          ? { ...b, ...updates, updatedAt: now }
          : b
      ),
      updatedAt: now
    }
  }

  /**
   * Delete a Block (groups remain but are no longer horizontally linked)
   */
  deleteBlock(project: Project, blockId: string): Project {
    return {
      ...project,
      blocks: (project.blocks || []).filter(b => b.id !== blockId),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Add a group to a Block at a specific position (before targetGroupId)
   * If targetGroupId is null, adds to the end
   */
  addGroupToBlock(project: Project, blockId: string, groupId: string, targetGroupId?: string): Project {
    const block = (project.blocks || []).find(b => b.id === blockId)
    if (!block) return project

    // Remove group from any existing block first
    let updatedProject = project
    const oldBlock = this.getBlockForGroup(project, groupId)
    if (oldBlock && oldBlock.id !== blockId) {
      updatedProject = this.removeGroupFromBlock(updatedProject, oldBlock.id, groupId)
    }

    // Find insertion index
    let newGroupIds: string[]
    if (targetGroupId && block.groupIds.includes(targetGroupId)) {
      const targetIndex = block.groupIds.indexOf(targetGroupId)
      newGroupIds = [...block.groupIds]
      // Remove groupId if already in the array (for reordering within same block)
      const currentIndex = newGroupIds.indexOf(groupId)
      if (currentIndex !== -1) {
        newGroupIds.splice(currentIndex, 1)
        // Adjust target index if needed
        const adjustedTargetIndex = currentIndex < targetIndex ? targetIndex - 1 : targetIndex
        newGroupIds.splice(adjustedTargetIndex, 0, groupId)
      } else {
        newGroupIds.splice(targetIndex, 0, groupId)
      }
    } else {
      // Add to end
      newGroupIds = block.groupIds.includes(groupId)
        ? block.groupIds
        : [...block.groupIds, groupId]
    }

    updatedProject = {
      ...updatedProject,
      blocks: (updatedProject.blocks || []).map(b =>
        b.id === blockId
          ? { ...b, groupIds: newGroupIds, updatedAt: new Date().toISOString() }
          : b
      ),
      updatedAt: new Date().toISOString()
    }

    // Reposition groups
    updatedProject = this.repositionGroupsInBlock(updatedProject, blockId)
    
    // Reposition beats in all groups of the block
    const updatedBlock = (updatedProject.blocks || []).find(b => b.id === blockId)
    if (updatedBlock) {
      updatedBlock.groupIds.forEach(gId => {
        updatedProject = this.repositionBeatsInGroup(updatedProject, gId)
      })
    }
    
    // If block is in a lane, reposition all blocks in the lane
    // (because the block height changed when a group was added)
    const lane = this.getLaneForBlock(updatedProject, blockId)
    if (lane) {
      updatedProject = this.repositionBlocksInLane(updatedProject, lane.id)
    }
    
    return updatedProject
  }

  /**
   * Remove a group from a Block
   * If only 1 group remains, delete the Block
   */
  removeGroupFromBlock(project: Project, blockId: string, groupId: string): Project {
    const block = (project.blocks || []).find(b => b.id === blockId)
    if (!block) return project

    const newGroupIds = block.groupIds.filter(id => id !== groupId)

    // If only 1 group left, delete the block
    if (newGroupIds.length <= 1) {
      return this.deleteBlock(project, blockId)
    }

    // Update block with remaining groups
    let updatedProject = {
      ...project,
      blocks: (project.blocks || []).map(b =>
        b.id === blockId
          ? { ...b, groupIds: newGroupIds, updatedAt: new Date().toISOString() }
          : b
      ),
      updatedAt: new Date().toISOString()
    }

    // Reposition remaining groups to fill the gap
    updatedProject = this.repositionGroupsInBlock(updatedProject, blockId)
    
    // Reposition beats in all remaining groups
    newGroupIds.forEach(gId => {
      updatedProject = this.repositionBeatsInGroup(updatedProject, gId)
    })
    
    // If block is in a lane, reposition all blocks in the lane
    // (because the block height changed when a group was removed)
    const lane = this.getLaneForBlock(updatedProject, blockId)
    if (lane) {
      updatedProject = this.repositionBlocksInLane(updatedProject, lane.id)
    }
    
    return updatedProject
  }

  /**
   * Get the Block that contains a group
   */
  getBlockForGroup(project: Project, groupId: string): any | undefined {
    return (project.blocks || []).find(b => b.groupIds.includes(groupId))
  }

  /**
   * Reposition all groups within a Block horizontally
   * Groups are aligned to the same Y position and spaced horizontally
   */
  repositionGroupsInBlock(project: Project, blockId: string): Project {
    const block = (project.blocks || []).find(b => b.id === blockId)
    if (!block) return project

    const GROUP_WIDTH = 424
    const GAP = 10
    const BLOCK_HEIGHT = 50 // Height of the block header

    // All groups align below the block header
    const baseY = block.position.y + BLOCK_HEIGHT

    return {
      ...project,
      beatGroups: project.beatGroups.map(group => {
        const indexInBlock = block.groupIds.indexOf(group.id)
        
        if (indexInBlock !== -1) {
          // Calculate horizontal position: x = block.x + (index * (GROUP_WIDTH + GAP))
          const newX = block.position.x + (indexInBlock * (GROUP_WIDTH + GAP))
          
          return {
            ...group,
            position: {
              x: newX,
              y: baseY
            },
            updatedAt: new Date().toISOString()
          }
        }
        return group
      }),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Calculate the width of a Block based on its groups
   */
  getBlockWidth(block: any): number {
    const GROUP_WIDTH = 424
    const GAP = 10
    const numGroups = block.groupIds.length
    
    if (numGroups === 0) return GROUP_WIDTH
    
    return (numGroups * GROUP_WIDTH) + ((numGroups - 1) * GAP)
  }

  // ============================================================
  // Lane Management Methods
  // ============================================================

  /**
   * Create a new Lane with given blocks
   */
  createLane(project: Project, blockIds: string[], name?: string): Project {
    const now = new Date().toISOString()
    
    // Get first block position as lane position
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
      position: { ...firstBlock.position }, // Start at first block position
      createdAt: now,
      updatedAt: now
    }
    
    let updatedProject = {
      ...project,
      lanes: [...project.lanes, newLane],
      updatedAt: now
    }
    
    // Reposition blocks vertically in the lane
    updatedProject = this.repositionBlocksInLane(updatedProject, newLane.id)
    
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
   */
  updateLane(project: Project, laneId: string, updates: Partial<Lane>): Project {
    const now = new Date().toISOString()
    
    return {
      ...project,
      lanes: project.lanes.map(lane =>
        lane.id === laneId
          ? { ...lane, ...updates, updatedAt: now }
          : lane
      ),
      updatedAt: now
    }
  }

  /**
   * Delete a Lane (blocks remain but are disconnected)
   */
  deleteLane(project: Project, laneId: string): Project {
    return {
      ...project,
      lanes: project.lanes.filter(lane => lane.id !== laneId),
      updatedAt: new Date().toISOString()
    }
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
    let updatedProject = this.removeBlockFromLane(project, blockId)
    
    const updatedLane = updatedProject.lanes.find(l => l.id === laneId)!
    
    let newBlockIds: string[]
    if (targetBlockId) {
      // Insert after target block
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
      // Add at the end
      newBlockIds = [...updatedLane.blockIds, blockId]
    }
    
    updatedProject = this.updateLane(updatedProject, laneId, { blockIds: newBlockIds })
    
    // PASO 1: Reposicionar el Block en la Lane
    const repositionedProject = this.repositionBlocksInLane(updatedProject, laneId)
    
    const repositionedBlock = repositionedProject.blocks.find(b => b.id === blockId)
    if (repositionedBlock) {
      const deltaX = repositionedBlock.position.x - originalBlockPosition.x
      const deltaY = repositionedBlock.position.y - originalBlockPosition.y
      
      // PASO 2 y 3: Mover grupos y beats con el mismo delta (solo si hay delta)
      if (deltaX !== 0 || deltaY !== 0) {
        repositionedBlock.groupIds.forEach(groupId => {
          const group = repositionedProject.beatGroups.find(g => g.id === groupId)
          const originalGroupPos = originalGroupPositions.get(groupId)
          if (group && originalGroupPos) {
            group.position.x = originalGroupPos.x + deltaX
            group.position.y = originalGroupPos.y + deltaY
            
            // Move all beats in this group using their original positions
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
   */
  removeBlockFromLane(project: Project, blockId: string): Project {
    let updated = { ...project }
    
    // Find lane containing this block
    const lane = project.lanes.find(l => l.blockIds.includes(blockId))
    if (!lane) return project
    
    const newBlockIds = lane.blockIds.filter(id => id !== blockId)
    
    // If lane has 0 or 1 blocks remaining, delete the lane
    if (newBlockIds.length <= 1) {
      updated = this.deleteLane(updated, lane.id)
    } else {
      updated = this.updateLane(updated, lane.id, { blockIds: newBlockIds })
      // Reposition remaining blocks
      updated = this.repositionBlocksInLane(updated, lane.id)
    }
    
    return updated
  }

  /**
   * Reposition all Blocks in a Lane vertically with proper spacing
   */
  repositionBlocksInLane(project: Project, laneId: string): Project {
    const lane = project.lanes.find(l => l.id === laneId)
    if (!lane || lane.blockIds.length === 0) return project
    
    const GAP = 10
    const LANE_HEADER_HEIGHT = 50
    
    // Store original positions of all blocks before repositioning
    const originalBlockPositions = new Map<string, Position>()
    lane.blockIds.forEach(blockId => {
      const block = project.blocks.find(b => b.id === blockId)
      if (block) {
        originalBlockPositions.set(blockId, { ...block.position })
      }
    })
    
    let currentY = lane.position.y + LANE_HEADER_HEIGHT + GAP
    
    const updatedBlocks = [...project.blocks]
    
    for (const blockId of lane.blockIds) {
      const blockIndex = updatedBlocks.findIndex(b => b.id === blockId)
      if (blockIndex === -1) continue
      
      const block = updatedBlocks[blockIndex]
      const originalBlockPos = originalBlockPositions.get(blockId)!
      
      // Calculate block height (including all its content)
      const blockHeight = this.getBlockHeight(project, block)
      
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
      
      currentY += blockHeight + GAP
    }
    
    return {
      ...project,
      blocks: updatedBlocks,
      lanes: project.lanes
    }
  }

  /**
   * Calculate the total height of a Block including all its content
   */
  getBlockHeight(project: Project, block: Block): number {
    const BLOCK_HEADER_HEIGHT = 50
    const GROUP_HEIGHT = 50
    const BEAT_HEIGHT = 80
    const BLOCK_PADDING = 15
    
    if (block.groupIds.length === 0) {
      return BLOCK_HEADER_HEIGHT
    }
    
    // Get all groups in this block
    const groups = project.beatGroups.filter(g => block.groupIds.includes(g.id))
    
    // Find bounds of all groups and their beats
    let minY = Infinity
    let maxY = -Infinity
    
    groups.forEach(group => {
      minY = Math.min(minY, group.position.y)
      maxY = Math.max(maxY, group.position.y + GROUP_HEIGHT)
      
      // Check beats in this group
      const groupBeats = project.beats.filter(b => group.beatIds.includes(b.id))
      groupBeats.forEach(beat => {
        minY = Math.min(minY, beat.position.y)
        maxY = Math.max(maxY, beat.position.y + BEAT_HEIGHT)
      })
    })
    
    // Height from block top to bottom of content + padding
    const blockHeaderY = block.position.y
    minY = Math.min(minY, blockHeaderY + BLOCK_HEADER_HEIGHT)
    
    return (maxY - blockHeaderY) + BLOCK_PADDING
  }

  /**
   * Get the Lane that contains a specific Block
   */
  getLaneForBlock(project: Project, blockId: string): Lane | null {
    return project.lanes.find(lane => lane.blockIds.includes(blockId)) || null
  }

  /**
   * Check if a Block is the first in its Lane
   */
  isFirstBlockInLane(project: Project, blockId: string): boolean {
    const lane = this.getLaneForBlock(project, blockId)
    if (!lane) return true // Not in a lane, treat as independent
    
    return lane.blockIds[0] === blockId
  }

  // TODO: Implement export to JSON
  // TODO: Implement export to script format
  // TODO: Implement import from external formats
}

export const projectService = new ProjectService()
