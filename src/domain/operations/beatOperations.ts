/**
 * Domain layer: Pure beat operations
 * All functions return a new Project (immutable pattern)
 */

import type { Project, Beat } from '@/domain/entities'
import { v4 as uuidv4 } from '@/utils/uuid'
import { getNewBeatTitle } from '@/i18n/helpers'
import { calculateNextBeatPosition, calculateNextBeatOrder } from './geometry'

/**
 * Create a new beat with default values based on type
 * Returns updated project with the new beat
 */
export function createBeat(project: Project, typeId: string): Project {
  const now = new Date().toISOString()
  const position = calculateNextBeatPosition(project.beats.length)
  const order = calculateNextBeatOrder(project)

  const newBeat: Beat = {
    id: uuidv4(),
    title: getNewBeatTitle(typeId),
    description: '',
    typeId,
    order,
    position,
    links: [],
    createdAt: now,
    updatedAt: now
  }

  return {
    ...project,
    beats: [...project.beats, newBeat],
    updatedAt: now
  }
}

/**
 * Update an existing beat
 * Returns updated project
 */
export function updateBeat(
  project: Project,
  beatId: string,
  updates: Partial<Beat>
): Project {
  const now = new Date().toISOString()

  return {
    ...project,
    beats: project.beats.map(beat =>
      beat.id === beatId
        ? { ...beat, ...updates, updatedAt: now }
        : beat
    ),
    updatedAt: now
  }
}

/**
 * Delete a beat
 * Returns updated project
 */
export function deleteBeat(project: Project, beatId: string): Project {
  return {
    ...project,
    beats: project.beats.filter(beat => beat.id !== beatId),
    updatedAt: new Date().toISOString()
  }
}

/**
 * Get beats sorted by order field
 * Returns a new sorted array (does not mutate)
 */
export function getSortedBeats(project: Project): Beat[] {
  return [...project.beats].sort((a, b) => a.order - b.order)
}
