import type { Project } from '@/domain/entities'
import { projectService } from '@/application/ProjectService'
import { CollisionDetectionService } from './CollisionDetectionService'

interface Position {
  x: number
  y: number
}

/**
 * Service for handling drag and drop logic
 * Centralizes business logic for dragging beats, groups, and blocks
 */
class DragAndDropService {
  private collisionService = new CollisionDetectionService()

  /**
   * Handles the start of a beat drag operation
   * - Extracts beat from parent group if needed
   * @returns Initial position of the beat
   */
  handleBeatDragStart(project: Project, beatId: string): { project: Project; startPosition: Position } {
    const beat = project.beats.find(b => b.id === beatId)
    if (!beat) {
      throw new Error(`Beat ${beatId} not found`)
    }

    // Check if beat belongs to a group and extract it
    const parentGroup = projectService.getGroupForBeat(project, beatId)
    let updatedProject = project
    
    if (parentGroup) {
      updatedProject = projectService.removeBeatFromGroup(project, beatId, parentGroup.id)
    }

    return {
      project: updatedProject,
      startPosition: { ...beat.position }
    }
  }

  /**
   * Handles the movement of a beat during drag
   * - Updates beat position
   * - Returns updated project
   */
  handleBeatDragMove(
    project: Project,
    beatId: string,
    startPosition: Position,
    deltaX: number,
    deltaY: number
  ): Project {
    const beatIndex = project.beats.findIndex(b => b.id === beatId)
    if (beatIndex === -1) return project

    const newX = startPosition.x + deltaX
    const newY = startPosition.y + deltaY

    const updatedBeats = [...project.beats]
    updatedBeats[beatIndex] = {
      ...updatedBeats[beatIndex],
      position: { x: newX, y: newY },
      updatedAt: new Date().toISOString()
    }

    return {
      ...project,
      beats: updatedBeats
    }
  }

  /**
   * Handles the end of a beat drag operation
   * - Checks for block removal (if dragged out)
   * - Checks for group insertion (if dropped on group/beat)
   * - Checks for block insertion (if dropped on block)
   */
  handleBeatDragEnd(
    project: Project,
    beatId: string,
    hoveredBeatId: string | null,
    hoveredGroupId: string | null,
    hoveredBlockId: string | null
  ): Project {
    let updatedProject = { ...project }
    
    // Check if beat was in a block and dragged out
    const currentBlock = projectService.getBlockForBeat(project, beatId)
    if (currentBlock) {
      const beat = project.beats.find(b => b.id === beatId)
      if (beat) {
        const isInsideBlock = this.collisionService.isPointInsideBlock(beat.position, currentBlock)
        if (!isInsideBlock && !hoveredBlockId) {
          // Beat dragged out of block
          updatedProject = projectService.removeBeatFromBlock(updatedProject, beatId, currentBlock.id)
        }
      }
    }

    // Priority 1: Drop onto specific beat in a group
    if (hoveredBeatId) {
      const targetGroup = projectService.getGroupForBeat(updatedProject, hoveredBeatId)
      if (targetGroup) {
        // Remove from block first
        const beatBlock = projectService.getBlockForBeat(updatedProject, beatId)
        if (beatBlock) {
          updatedProject = projectService.removeBeatFromBlock(updatedProject, beatId, beatBlock.id)
        }
        
        // Insert at specific position
        updatedProject = projectService.insertBeatIntoGroupAtPosition(
          updatedProject,
          beatId,
          hoveredBeatId,
          targetGroup.id
        )
        
        return updatedProject
      }
    }

    // Priority 2: Drop onto group header (append)
    if (hoveredGroupId) {
      const beatBlock = projectService.getBlockForBeat(updatedProject, beatId)
      if (beatBlock) {
        updatedProject = projectService.removeBeatFromBlock(updatedProject, beatId, beatBlock.id)
      }
      
      updatedProject = projectService.dropBeatIntoGroup(updatedProject, beatId, hoveredGroupId)
      return updatedProject
    }

    // Priority 3: Drop into block
    if (hoveredBlockId) {
      updatedProject = projectService.addBeatToBlock(updatedProject, beatId, hoveredBlockId)
      return updatedProject
    }

    return updatedProject
  }

  /**
   * Handles the start of a group drag operation
   * - Removes group from parent block if needed
   * @returns Initial position of the group
   */
  handleGroupDragStart(project: Project, groupId: string): { project: Project; startPosition: Position } {
    const group = project.beatGroups.find(g => g.id === groupId)
    if (!group) {
      throw new Error(`Group ${groupId} not found`)
    }

    // Remove from parent block if exists
    const parentBlock = projectService.getBlockForGroup(project, groupId)
    let updatedProject = project
    
    if (parentBlock) {
      updatedProject = projectService.removeGroupFromBlock(project, groupId, parentBlock.id)
    }

    return {
      project: updatedProject,
      startPosition: { ...group.position }
    }
  }

  /**
   * Handles the movement of a group during drag
   * - Updates group position and all contained beats
   * - Returns updated project
   */
  handleGroupDragMove(
    project: Project,
    groupId: string,
    startPosition: Position,
    deltaX: number,
    deltaY: number
  ): Project {
    const groupIndex = project.beatGroups.findIndex(g => g.id === groupId)
    if (groupIndex === -1) return project

    const group = project.beatGroups[groupIndex]
    const newX = startPosition.x + deltaX
    const newY = startPosition.y + deltaY

    // Update group position
    const updatedGroups = [...project.beatGroups]
    updatedGroups[groupIndex] = {
      ...group,
      position: { x: newX, y: newY },
      updatedAt: new Date().toISOString()
    }

    // Update all beats in the group
    const updatedBeats = project.beats.map(beat => {
      if (group.beatIds.includes(beat.id)) {
        const oldGroupPos = startPosition
        const relativePos = {
          x: beat.position.x - oldGroupPos.x,
          y: beat.position.y - oldGroupPos.y
        }
        return {
          ...beat,
          position: {
            x: newX + relativePos.x,
            y: newY + relativePos.y
          },
          updatedAt: new Date().toISOString()
        }
      }
      return beat
    })

    return {
      ...project,
      beatGroups: updatedGroups,
      beats: updatedBeats
    }
  }

  /**
   * Handles the end of a group drag operation
   * - Checks for block insertion
   */
  handleGroupDragEnd(
    project: Project,
    groupId: string,
    hoveredBlockId: string | null
  ): Project {
    let updatedProject = { ...project }

    // Check if group was in a block and dragged out
    const currentBlock = projectService.getBlockForGroup(project, groupId)
    if (currentBlock) {
      const group = project.beatGroups.find(g => g.id === groupId)
      if (group) {
        const isInsideBlock = this.collisionService.isPointInsideBlock(group.position, currentBlock)
        if (!isInsideBlock && !hoveredBlockId) {
          // Group dragged out of block
          updatedProject = projectService.removeGroupFromBlock(updatedProject, groupId, currentBlock.id)
        }
      }
    }

    // Drop into block
    if (hoveredBlockId) {
      updatedProject = projectService.addGroupToBlock(updatedProject, groupId, hoveredBlockId)
    }

    return updatedProject
  }

  /**
   * Handles the movement of a block during drag
   * - Updates block position and all contained elements
   * - Returns updated project
   */
  handleBlockDragMove(
    project: Project,
    blockId: string,
    startPosition: Position,
    deltaX: number,
    deltaY: number
  ): Project {
    const blockIndex = project.blocks.findIndex(b => b.id === blockId)
    if (blockIndex === -1) return project

    const block = project.blocks[blockIndex]
    const newX = startPosition.x + deltaX
    const newY = startPosition.y + deltaY

    // Update block position
    const updatedBlocks = [...project.blocks]
    updatedBlocks[blockIndex] = {
      ...block,
      position: { x: newX, y: newY },
      updatedAt: new Date().toISOString()
    }

    // Update all beats in the block
    const updatedBeats = project.beats.map(beat => {
      if (block.beatIds.includes(beat.id)) {
        const oldBlockPos = startPosition
        const relativePos = {
          x: beat.position.x - oldBlockPos.x,
          y: beat.position.y - oldBlockPos.y
        }
        return {
          ...beat,
          position: {
            x: newX + relativePos.x,
            y: newY + relativePos.y
          },
          updatedAt: new Date().toISOString()
        }
      }
      return beat
    })

    // Update all groups in the block
    const updatedGroups = project.beatGroups.map(group => {
      if (block.groupIds.includes(group.id)) {
        const oldBlockPos = startPosition
        const relativePos = {
          x: group.position.x - oldBlockPos.x,
          y: group.position.y - oldBlockPos.y
        }
        return {
          ...group,
          position: {
            x: newX + relativePos.x,
            y: newY + relativePos.y
          },
          updatedAt: new Date().toISOString()
        }
      }
      return group
    })

    return {
      ...project,
      blocks: updatedBlocks,
      beats: updatedBeats,
      beatGroups: updatedGroups
    }
  }
}

// Singleton instance
export const dragAndDropService = new DragAndDropService()
