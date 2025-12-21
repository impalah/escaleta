/**
 * Domain layer: Pure beat group operations
 * All functions return a new Project (immutable pattern)
 */

import type { Project, BeatGroup } from '@/domain/entities'
import { v4 as uuidv4 } from '@/utils/uuid'
import {
  calculateNextGroupPosition,
  calculateNextGroupOrder,
  calculateBeatYPositionInGroup
} from './geometry'

/**
 * Create a new beat group
 * Returns the created BeatGroup (not the project)
 */
export function createBeatGroup(
  project: Project,
  name: string,
  beatIds: string[] = []
): BeatGroup {
  const now = new Date().toISOString()
  const order = calculateNextGroupOrder(project)
  const position = calculateNextGroupPosition(project.beatGroups.length)

  return {
    id: uuidv4(),
    name,
    description: '',
    beatIds,
    position,
    collapsed: false,
    order,
    createdAt: now,
    updatedAt: now
  }
}

/**
 * Add a group to the project
 * Returns updated project
 */
export function addBeatGroup(project: Project, group: BeatGroup): Project {
  return {
    ...project,
    beatGroups: [...project.beatGroups, group],
    updatedAt: new Date().toISOString()
  }
}

/**
 * Update an existing beat group
 * Returns updated project
 */
export function updateBeatGroup(
  project: Project,
  groupId: string,
  updates: Partial<BeatGroup>
): Project {
  const now = new Date().toISOString()

  return {
    ...project,
    beatGroups: project.beatGroups.map(group =>
      group.id === groupId
        ? { ...group, ...updates, updatedAt: now }
        : group
    ),
    updatedAt: now
  }
}

/**
 * Delete a beat group
 * Returns updated project
 */
export function deleteBeatGroup(project: Project, groupId: string): Project {
  return {
    ...project,
    beatGroups: project.beatGroups.filter(group => group.id !== groupId),
    updatedAt: new Date().toISOString()
  }
}

/**
 * Add beats to a group
 * Returns updated project with beats added and repositioned
 */
export function addBeatsToGroup(
  project: Project,
  groupId: string,
  beatIds: string[]
): Project {
  const group = project.beatGroups.find(g => g.id === groupId)
  if (!group) return project

  const now = new Date().toISOString()

  // Update group with new beats (remove duplicates)
  const updatedProject = {
    ...project,
    beatGroups: project.beatGroups.map(g =>
      g.id === groupId
        ? {
            ...g,
            beatIds: [...new Set([...g.beatIds, ...beatIds])],
            updatedAt: now
          }
        : g
    ),
    updatedAt: now
  }

  // Reposition all beats in the group
  return repositionBeatsInGroup(updatedProject, groupId)
}

/**
 * Insert a beat before another beat in a group
 * Returns updated project with beat inserted and all beats repositioned
 */
export function insertBeatBeforeInGroup(
  project: Project,
  groupId: string,
  beatIdToInsert: string,
  targetBeatId: string
): Project {
  const group = project.beatGroups.find(g => g.id === groupId)
  if (!group) return project

  const targetIndex = group.beatIds.indexOf(targetBeatId)
  if (targetIndex === -1) return project

  const currentIndex = group.beatIds.indexOf(beatIdToInsert)
  const newBeatIds = [...group.beatIds]

  if (currentIndex !== -1) {
    // Beat already in group, reorder
    newBeatIds.splice(currentIndex, 1)
    const adjustedTargetIndex = currentIndex < targetIndex ? targetIndex - 1 : targetIndex
    newBeatIds.splice(adjustedTargetIndex, 0, beatIdToInsert)
  } else {
    // New beat, insert it
    newBeatIds.splice(targetIndex, 0, beatIdToInsert)
  }

  const now = new Date().toISOString()

  const updatedProject = {
    ...project,
    beatGroups: project.beatGroups.map(g =>
      g.id === groupId
        ? { ...g, beatIds: newBeatIds, updatedAt: now }
        : g
    ),
    updatedAt: now
  }

  return repositionBeatsInGroup(updatedProject, groupId)
}

/**
 * Reposition all beats in a group according to their index
 * Beats are stacked vertically below the group header with proper spacing
 * Returns updated project
 */
export function repositionBeatsInGroup(project: Project, groupId: string): Project {
  const group = project.beatGroups.find(g => g.id === groupId)
  if (!group) return project

  const now = new Date().toISOString()

  return {
    ...project,
    beats: project.beats.map(beat => {
      const beatIndex = group.beatIds.indexOf(beat.id)
      if (beatIndex === -1) return beat

      const newY = calculateBeatYPositionInGroup(group.position.y, beatIndex)

      return {
        ...beat,
        position: {
          x: group.position.x,
          y: newY
        },
        updatedAt: now
      }
    }),
    updatedAt: now
  }
}

/**
 * Remove a beat from a group and reposition remaining beats
 * Returns updated project
 */
export function removeBeatFromGroup(
  project: Project,
  beatId: string,
  groupId: string
): Project {
  const group = project.beatGroups.find(g => g.id === groupId)
  const beat = project.beats.find(b => b.id === beatId)

  if (!group || !beat) return project

  const remainingBeatIds = group.beatIds.filter(id => id !== beatId)
  const now = new Date().toISOString()

  // Reposition remaining beats
  const updatedProject = {
    ...project,
    beats: project.beats.map(b => {
      const indexInRemaining = remainingBeatIds.indexOf(b.id)

      if (indexInRemaining !== -1) {
        const newY = calculateBeatYPositionInGroup(group.position.y, indexInRemaining)

        return {
          ...b,
          position: {
            x: group.position.x,
            y: newY
          },
          updatedAt: now
        }
      }
      return b
    })
  }

  return {
    ...updatedProject,
    beatGroups: updatedProject.beatGroups.map(g =>
      g.id === groupId
        ? {
            ...g,
            beatIds: remainingBeatIds,
            updatedAt: now
          }
        : g
    ),
    updatedAt: now
  }
}

/**
 * Get the group that contains a beat
 * Returns the group or undefined
 */
export function getGroupForBeat(project: Project, beatId: string): BeatGroup | undefined {
  return project.beatGroups.find(g => g.beatIds.includes(beatId))
}

/**
 * Check if a beat belongs to any group
 * Returns boolean
 */
export function belongsToBeatGroup(project: Project, beatId: string): boolean {
  return project.beatGroups.some(g => g.beatIds.includes(beatId))
}
