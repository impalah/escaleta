import type { Project } from '@/domain/entities'
import { projectService } from '@/application/ProjectService'

/**
 * Service for handling drag and drop operations
 * Centralizes business logic for dragging beats and groups
 */
export class DragAndDropService {

  /**
   * Handle beat drag start
   * Returns updated project and start position
   */
  handleBeatDragStart(project: Project, beatId: string): { project: Project; startPosition: { x: number; y: number } } {
    const beat = project.beats.find(b => b.id === beatId)
    if (!beat) {
      return { project, startPosition: { x: 0, y: 0 } }
    }

    return {
      project,
      startPosition: { ...beat.position }
    }
  }

  /**
   * Handle beat drag move
   * Updates beat position based on delta from start
   */
  handleBeatDragMove(
    project: Project,
    beatId: string,
    startPosition: { x: number; y: number },
    deltaX: number,
    deltaY: number
  ): Project {
    const beat = project.beats.find(b => b.id === beatId)
    if (!beat) return project

    const newX = startPosition.x + deltaX
    const newY = startPosition.y + deltaY

    return projectService.updateBeat(project, beatId, {
      position: { x: newX, y: newY }
    })
  }

  /**
   * Handle beat drag end
   * Resolves final placement:
   * - Checks for group insertion
   */
  handleBeatDragEnd(
    project: Project,
    beatId: string,
    hoveredGroupId: string | null,
    hoveredBeatId: string | null
  ): Project {
    let updatedProject = { ...project }
    const beat = updatedProject.beats.find(b => b.id === beatId)
    if (!beat) return project

    // Priority 1: Add to hovered group
    if (hoveredGroupId) {
      // Remove from old group if exists
      const oldGroup = projectService.getGroupForBeat(updatedProject, beatId)
      if (oldGroup && oldGroup.id !== hoveredGroupId) {
        updatedProject = projectService.removeBeatFromGroup(updatedProject, beatId, oldGroup.id)
      }
      
      updatedProject = projectService.addBeatsToGroup(updatedProject, hoveredGroupId, [beatId])
      return updatedProject
    }

    // Priority 2: Insert before/after hovered beat in group
    if (hoveredBeatId) {
      updatedProject = this.handleBeatToGroupInsertion(updatedProject, beatId, hoveredBeatId)
      return updatedProject
    }

    // Priority 3: Beat dropped outside any group - remove from current group if exists
    const currentGroup = projectService.getGroupForBeat(updatedProject, beatId)
    if (currentGroup) {
      updatedProject = projectService.removeBeatFromGroup(updatedProject, beatId, currentGroup.id)
    }

    return updatedProject
  }

  /**
   * Handle group drag start
   * Removes group from parent block if exists
   */
  handleGroupDragStart(project: Project, groupId: string): { project: Project; startPosition: { x: number; y: number } } {
    const group = project.beatGroups.find(g => g.id === groupId)
    if (!group) {
      return { project, startPosition: { x: 0, y: 0 } }
    }

    return {
      project,
      startPosition: { ...group.position }
    }
  }

  /**
   * Handle group drag move
   * Updates group and all its beats' positions
   */
  handleGroupDragMove(
    project: Project,
    groupId: string,
    startPosition: { x: number; y: number },
    deltaX: number,
    deltaY: number
  ): Project {
    const group = project.beatGroups.find(g => g.id === groupId)
    if (!group) return project

    const newX = startPosition.x + deltaX
    const newY = startPosition.y + deltaY

    // Update group position
    let updatedProject = projectService.updateBeatGroup(project, groupId, {
      position: { x: newX, y: newY }
    })

    // Update all beats in the group
    const GROUP_HEADER_HEIGHT = 50
    const BEAT_HEIGHT = 80
    const GAP = 10

    group.beatIds.forEach((beatId, index) => {
      const beatY = newY + GROUP_HEADER_HEIGHT + GAP + (index * (BEAT_HEIGHT + GAP))
      updatedProject = projectService.updateBeat(updatedProject, beatId, {
        position: { x: newX, y: beatY }
      })
    })

    return updatedProject
  }

  /**
   * Handle group drag end
   * Resolves final placement - creates/updates Block if dropped on another group
   */
  handleGroupDragEnd(
    project: Project,
    groupId: string,
    hoveredGroupId: string | null
  ): Project {
    let updatedProject = { ...project }

    // If dropped on another group, handle block logic
    if (hoveredGroupId && hoveredGroupId !== groupId) {
      updatedProject = this.handleGroupToBlockInsertion(updatedProject, groupId, hoveredGroupId)
      return updatedProject
    }

    // If dropped outside, remove from current block if exists
    const currentBlock = projectService.getBlockForGroup(updatedProject, groupId)
    if (currentBlock) {
      updatedProject = projectService.removeGroupFromBlock(updatedProject, currentBlock.id, groupId)
    }

    return updatedProject
  }

  /**
   * Handle block drag start
   */
  handleBlockDragStart(project: Project, blockId: string): { project: Project; startPosition: { x: number; y: number } } {
    const block = (project.blocks || []).find(b => b.id === blockId)
    if (!block) {
      return { project, startPosition: { x: 0, y: 0 } }
    }

    return {
      project,
      startPosition: { ...block.position }
    }
  }

  /**
   * Handle block drag move
   * Updates block and all its groups' positions
   */
  handleBlockDragMove(
    project: Project,
    blockId: string,
    startPosition: { x: number; y: number },
    deltaX: number,
    deltaY: number
  ): Project {
    const block = (project.blocks || []).find(b => b.id === blockId)
    if (!block) return project

    const newX = startPosition.x + deltaX
    const newY = startPosition.y + deltaY

    // Update block position
    let updatedProject = projectService.updateBlock(project, blockId, {
      position: { x: newX, y: newY }
    })

    // Reposition all groups in the block (will update their beats too)
    updatedProject = projectService.repositionGroupsInBlock(updatedProject, blockId)

    // Also need to reposition beats within each group
    const updatedBlock = (updatedProject.blocks || []).find(b => b.id === blockId)
    if (updatedBlock) {
      updatedBlock.groupIds.forEach(groupId => {
        const group = updatedProject.beatGroups.find(g => g.id === groupId)
        if (group) {
          updatedProject = projectService.repositionBeatsInGroup(updatedProject, groupId)
        }
      })
    }

    return updatedProject
  }

  /**
   * Handle block drag end
   */
  handleBlockDragEnd(
    project: Project,
    _blockId: string
  ): Project {
    return project
  }

  /**
   * Helper: Insert group into a block by hovering over another group
   * Creates block if needed, or adds to existing block
   */
  private handleGroupToBlockInsertion(project: Project, draggedGroupId: string, hoveredGroupId: string): Project {
    let updatedProject = { ...project }

    // Check if dragged group is already in a block
    const draggedBlock = projectService.getBlockForGroup(updatedProject, draggedGroupId)
    
    // Check if hovered group is in a block
    const hoveredBlock = projectService.getBlockForGroup(updatedProject, hoveredGroupId)

    if (hoveredBlock) {
      // Add to existing block
      // If dragged group was in a different block, it will be removed automatically
      updatedProject = projectService.addGroupToBlock(
        updatedProject,
        hoveredBlock.id,
        draggedGroupId,
        hoveredGroupId
      )
      
      // Reposition beats in the dragged group to align with new group position
      updatedProject = projectService.repositionBeatsInGroup(updatedProject, draggedGroupId)
    } else {
      // Create new block with both groups
      // First, remove dragged group from its old block if exists
      if (draggedBlock) {
        updatedProject = projectService.removeGroupFromBlock(updatedProject, draggedBlock.id, draggedGroupId)
      }
      
      // Create new block at the position of the hovered group
      const hoveredGroup = updatedProject.beatGroups.find(g => g.id === hoveredGroupId)
      if (hoveredGroup) {
        updatedProject = projectService.createBlock(updatedProject, [hoveredGroupId, draggedGroupId])
        
        // Reposition beats in both groups after block creation
        updatedProject = projectService.repositionBeatsInGroup(updatedProject, hoveredGroupId)
        updatedProject = projectService.repositionBeatsInGroup(updatedProject, draggedGroupId)
      }
    }

    return updatedProject
  }

  /**
   * Helper: Insert beat into a group by hovering over another beat
   * The dragged beat will take the position of the hovered beat,
   * pushing the hovered beat and all beats below it down
   */
  private handleBeatToGroupInsertion(project: Project, draggedBeatId: string, hoveredBeatId: string): Project {
    // Find which group the hovered beat belongs to
    const targetGroup = projectService.getGroupForBeat(project, hoveredBeatId)
    if (!targetGroup) return project

    // Remove beat from old group if exists (and different from target group)
    const oldGroup = projectService.getGroupForBeat(project, draggedBeatId)
    let updatedProject = project
    if (oldGroup && oldGroup.id !== targetGroup.id) {
      updatedProject = projectService.removeBeatFromGroup(updatedProject, draggedBeatId, oldGroup.id)
    }

    // Insert the beat before the hovered beat in the target group
    updatedProject = projectService.insertBeatBeforeInGroup(
      updatedProject, 
      targetGroup.id, 
      draggedBeatId, 
      hoveredBeatId
    )
    
    return updatedProject
  }
}

export const dragAndDropService = new DragAndDropService()
