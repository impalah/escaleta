import type { Project, Beat, BeatType } from '@/domain/entities'
import { storageService } from '@/infrastructure/LocalStorageService'
import { v4 as uuidv4 } from '@/utils/uuid'

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
        title: 'Opening',
        description: 'News show introduction and welcome',
        typeId: 'opening',
        order: 1,
        position: { x: 100, y: 100 },
        links: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        title: 'News 1: National Politics',
        description: 'Government announces new economic measures',
        typeId: 'news',
        order: 2,
        position: { x: 350, y: 100 },
        links: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        title: 'VTR: Minister Interview',
        description: 'Economy minister statements',
        typeId: 'vtr',
        order: 3,
        position: { x: 600, y: 100 },
        links: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        title: 'News 2: International',
        description: 'European summit on climate change',
        typeId: 'news',
        order: 4,
        position: { x: 850, y: 100 },
        links: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        title: 'Sports',
        description: 'Sports day highlights',
        typeId: 'sports',
        order: 5,
        position: { x: 100, y: 350 },
        links: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        title: 'Weather',
        description: 'Tomorrow\'s weather forecast',
        typeId: 'weather',
        order: 6,
        position: { x: 350, y: 350 },
        links: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        title: 'Closing',
        description: 'Farewell and preview of next broadcast',
        typeId: 'closing',
        order: 7,
        position: { x: 600, y: 350 },
        links: [],
        createdAt: now,
        updatedAt: now
      }
    ]

    return {
      id: uuidv4(),
      name: 'Example News Show',
      description: 'Example project with news broadcast rundown',
      beats,
      beatTypes,
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
      { id: 'vtr', name: 'VTR', color: '#9C27B0', icon: 'mdi-video' },
      { id: 'interview', name: 'Interview', color: '#FF9800', icon: 'mdi-microphone' },
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
    const beatType = project.beatTypes.find(t => t.id === typeId)

    // Calculate next available position (simple horizontal layout)
    const maxX = project.beats.reduce((max, b) => Math.max(max, b.position.x), 0)
    const nextX = maxX > 0 ? maxX + 250 : 100

    // Calculate next order number
    const maxOrder = project.beats.reduce((max, b) => Math.max(max, b.order), 0)
    const nextOrder = maxOrder + 1

    return {
      id: uuidv4(),
      title: `New ${beatType?.name || 'Beat'}`,
      description: '',
      typeId,
      order: nextOrder,
      position: { x: nextX, y: 100 },
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

  // TODO: Implement export to JSON
  // TODO: Implement export to script format
  // TODO: Implement import from external formats
}

export const projectService = new ProjectService()
