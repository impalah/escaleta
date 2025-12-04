import type { Project, Beat, BeatType, BeatGroup } from '@/domain/entities'
import { storageService } from '@/infrastructure/LocalStorageService'
import { v4 as uuidv4 } from '@/utils/uuid'
import { t, getBeatTypeName, getNewBeatTitle } from '@/i18n/helpers'

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
      // Migrate old projects that don't have beatGroups
      if (!saved.beatGroups) {
        saved.beatGroups = []
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
   * Connect two beats (doble enlace: prevBeatId y nextBeatId)
   */
  connectBeats(project: Project, prevBeatId: string, nextBeatId: string): Project {
    return {
      ...project,
      beats: project.beats.map(beat => {
        if (beat.id === prevBeatId) {
          return { ...beat, nextBeatId, updatedAt: new Date().toISOString() }
        }
        if (beat.id === nextBeatId) {
          return { ...beat, prevBeatId, updatedAt: new Date().toISOString() }
        }
        return beat
      }),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Disconnect a beat from its neighbors
   */
  disconnectBeat(project: Project, beatId: string): Project {
    const beat = project.beats.find(b => b.id === beatId)
    if (!beat) return project

    return {
      ...project,
      beats: project.beats.map(b => {
        // Desconectar el beat actual
        if (b.id === beatId) {
          return { ...b, prevBeatId: undefined, nextBeatId: undefined, updatedAt: new Date().toISOString() }
        }
        // Desconectar beats vecinos
        if (b.id === beat.prevBeatId) {
          return { ...b, nextBeatId: undefined, updatedAt: new Date().toISOString() }
        }
        if (b.id === beat.nextBeatId) {
          return { ...b, prevBeatId: undefined, updatedAt: new Date().toISOString() }
        }
        return b
      }),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Get the actual height of a beat card element in pixels
   * Falls back to constant if element not found
   */
  private getBeatHeight(beatId: string): number {
    const beatElement = document.querySelector(`[data-beat-id="${beatId}"] .v-card`)
    if (beatElement) {
      return beatElement.getBoundingClientRect().height
    }
    return 80 // Fallback to default height
  }

  /**
   * Insert a beat between two connected beats
   * A → B becomes A → C → B
   */
  insertBetween(project: Project, insertBeatId: string, prevBeatId: string, nextBeatId: string): Project {
    const GAP = 10 // Espacio entre beats conectados

    const insertBeat = project.beats.find(b => b.id === insertBeatId)
    const prevBeat = project.beats.find(b => b.id === prevBeatId)
    const nextBeat = project.beats.find(b => b.id === nextBeatId)

    if (!insertBeat || !prevBeat || !nextBeat) return project

    // Obtener alturas reales de los beats
    const prevBeatHeight = this.getBeatHeight(prevBeatId)
    const insertBeatHeight = this.getBeatHeight(insertBeatId)

    // Calcular nueva posición para el beat insertado (entre prev y next)
    const newY = prevBeat.position.y + prevBeatHeight + GAP
    const alignedX = prevBeat.position.x // Alinear horizontalmente con prevBeat

    // Desplazar nextBeat y todos sus sucesores hacia abajo
    const shiftAmount = insertBeatHeight + GAP

    return {
      ...project,
      beats: project.beats.map(beat => {
        // Actualizar beat insertado
        if (beat.id === insertBeatId) {
          return {
            ...beat,
            position: { x: alignedX, y: newY },
            prevBeatId,
            nextBeatId,
            updatedAt: new Date().toISOString()
          }
        }
        // Actualizar prevBeat (apunta al insertado)
        if (beat.id === prevBeatId) {
          return { ...beat, nextBeatId: insertBeatId, updatedAt: new Date().toISOString() }
        }
        // Actualizar nextBeat (apunta al insertado) y moverlo
        if (beat.id === nextBeatId) {
          return {
            ...beat,
            position: { x: beat.position.x, y: beat.position.y + shiftAmount },
            prevBeatId: insertBeatId,
            updatedAt: new Date().toISOString()
          }
        }
        // Mover todos los beats que estén después de nextBeat en la cadena
        if (this.isAfterBeat(project, beat.id, nextBeatId)) {
          return {
            ...beat,
            position: { x: beat.position.x, y: beat.position.y + shiftAmount },
            updatedAt: new Date().toISOString()
          }
        }
        return beat
      }),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Connect a beat to the top of another beat (beat becomes prevBeat of target)
   * El beat destino NO se mueve, solo se mueve el beat arrastrado
   */
  connectToTop(project: Project, beatId: string, targetBeatId: string): Project {
    const GAP = 10

    const beat = project.beats.find(b => b.id === beatId)
    const targetBeat = project.beats.find(b => b.id === targetBeatId)

    if (!beat || !targetBeat) return project

    // Desconectar beat actual de sus vecinos
    let updatedProject = this.disconnectBeat(project, beatId)

    // Obtener targetBeat actualizado del proyecto modificado
    const updatedTargetBeat = updatedProject.beats.find(b => b.id === targetBeatId)
    if (!updatedTargetBeat) return project

    // Si targetBeat ya tiene prevBeat, insertar entre ellos
    if (updatedTargetBeat.prevBeatId) {
      return this.insertBetween(updatedProject, beatId, updatedTargetBeat.prevBeatId, targetBeatId)
    }

    // Posicionar beat encima de targetBeat (sin mover el target)
    const beatHeight = this.getBeatHeight(beatId)
    const alignedX = updatedTargetBeat.position.x
    const newY = updatedTargetBeat.position.y - beatHeight - GAP

    return {
      ...updatedProject,
      beats: updatedProject.beats.map(b => {
        if (b.id === beatId) {
          return {
            ...b,
            position: { x: alignedX, y: newY },
            nextBeatId: targetBeatId,
            updatedAt: new Date().toISOString()
          }
        }
        if (b.id === targetBeatId) {
          return { ...b, prevBeatId: beatId, updatedAt: new Date().toISOString() }
        }
        return b
      }),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Insert a group of connected beats at a specific position
   * @param groupBeats - Array of beat IDs in the group (in order from first to last)
   * @param targetBeatId - Beat where the group should be inserted
   * @param insertPosition - 'top' to insert before target, 'bottom' to insert after target
   */
  insertGroupAt(project: Project, groupBeats: string[], targetBeatId: string, insertPosition: 'top' | 'bottom'): Project {
    if (groupBeats.length === 0) return project
    
    const firstBeatId = groupBeats[0]
    const lastBeatId = groupBeats[groupBeats.length - 1]
    
    const targetBeat = project.beats.find(b => b.id === targetBeatId)
    if (!targetBeat) return project
    
    // Disconnect the entire group from its current position
    let updatedProject = { ...project }
    
    // Disconnect group from neighbors
    const firstBeat = updatedProject.beats.find(b => b.id === firstBeatId)
    const lastBeat = updatedProject.beats.find(b => b.id === lastBeatId)
    
    if (firstBeat?.prevBeatId) {
      const prevBeat = updatedProject.beats.find(b => b.id === firstBeat.prevBeatId)
      if (prevBeat) {
        updatedProject.beats = updatedProject.beats.map(b => 
          b.id === prevBeat.id ? { ...b, nextBeatId: lastBeat?.nextBeatId, updatedAt: new Date().toISOString() } : b
        )
      }
    }
    
    if (lastBeat?.nextBeatId) {
      const nextBeat = updatedProject.beats.find(b => b.id === lastBeat.nextBeatId)
      if (nextBeat) {
        updatedProject.beats = updatedProject.beats.map(b => 
          b.id === nextBeat.id ? { ...b, prevBeatId: firstBeat?.prevBeatId, updatedAt: new Date().toISOString() } : b
        )
      }
    }
    
    // Update first and last beats of the group to disconnect them
    updatedProject.beats = updatedProject.beats.map(b => {
      if (b.id === firstBeatId) {
        return { ...b, prevBeatId: undefined, updatedAt: new Date().toISOString() }
      }
      if (b.id === lastBeatId) {
        return { ...b, nextBeatId: undefined, updatedAt: new Date().toISOString() }
      }
      return b
    })
    
    // Now insert the group at the target position
    const updatedTargetBeat = updatedProject.beats.find(b => b.id === targetBeatId)
    if (!updatedTargetBeat) return project
    
    if (insertPosition === 'top') {
      // Insert before target
      if (updatedTargetBeat.prevBeatId) {
        // Target has a previous beat, insert between them
        const prevBeatId = updatedTargetBeat.prevBeatId
        
        updatedProject.beats = updatedProject.beats.map(b => {
          if (b.id === prevBeatId) {
            return { ...b, nextBeatId: firstBeatId, updatedAt: new Date().toISOString() }
          }
          if (b.id === firstBeatId) {
            return { ...b, prevBeatId: prevBeatId, updatedAt: new Date().toISOString() }
          }
          if (b.id === lastBeatId) {
            return { ...b, nextBeatId: targetBeatId, updatedAt: new Date().toISOString() }
          }
          if (b.id === targetBeatId) {
            return { ...b, prevBeatId: lastBeatId, updatedAt: new Date().toISOString() }
          }
          return b
        })
      } else {
        // Target has no previous beat, group becomes the head
        updatedProject.beats = updatedProject.beats.map(b => {
          if (b.id === lastBeatId) {
            return { ...b, nextBeatId: targetBeatId, updatedAt: new Date().toISOString() }
          }
          if (b.id === targetBeatId) {
            return { ...b, prevBeatId: lastBeatId, updatedAt: new Date().toISOString() }
          }
          return b
        })
      }
    } else {
      // Insert after target
      if (updatedTargetBeat.nextBeatId) {
        // Target has a next beat, insert between them
        const nextBeatId = updatedTargetBeat.nextBeatId
        
        updatedProject.beats = updatedProject.beats.map(b => {
          if (b.id === targetBeatId) {
            return { ...b, nextBeatId: firstBeatId, updatedAt: new Date().toISOString() }
          }
          if (b.id === firstBeatId) {
            return { ...b, prevBeatId: targetBeatId, updatedAt: new Date().toISOString() }
          }
          if (b.id === lastBeatId) {
            return { ...b, nextBeatId: nextBeatId, updatedAt: new Date().toISOString() }
          }
          if (b.id === nextBeatId) {
            return { ...b, prevBeatId: lastBeatId, updatedAt: new Date().toISOString() }
          }
          return b
        })
      } else {
        // Target has no next beat, group becomes the tail
        updatedProject.beats = updatedProject.beats.map(b => {
          if (b.id === targetBeatId) {
            return { ...b, nextBeatId: firstBeatId, updatedAt: new Date().toISOString() }
          }
          if (b.id === firstBeatId) {
            return { ...b, prevBeatId: targetBeatId, updatedAt: new Date().toISOString() }
          }
          return b
        })
      }
    }
    
    // Reposition all beats in the chain to align them properly
    return this.repositionChain(updatedProject)
  }
  
  /**
   * Reposition all beats in all chains to maintain proper vertical alignment
   */
  private repositionChain(project: Project): Project {
    const GAP = 10
    const processedBeats = new Set<string>()
    
    const beats = [...project.beats]
    
    // Find all chain heads (beats with no prevBeatId)
    const chainHeads = beats.filter(b => !b.prevBeatId)
    
    for (const head of chainHeads) {
      let currentBeat = head
      let currentY = head.position.y
      const chainX = head.position.x
      
      processedBeats.add(currentBeat.id)
      
      while (currentBeat.nextBeatId) {
        const nextBeat = beats.find(b => b.id === currentBeat.nextBeatId)
        if (!nextBeat || processedBeats.has(nextBeat.id)) break
        
        // Position next beat below current
        const currentHeight = this.getBeatHeight(currentBeat.id)
        currentY = currentY + currentHeight + GAP
        
        nextBeat.position = { x: chainX, y: currentY }
        nextBeat.updatedAt = new Date().toISOString()
        
        processedBeats.add(nextBeat.id)
        currentBeat = nextBeat
      }
    }
    
    return {
      ...project,
      beats,
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Connect a beat to the bottom of another beat (beat becomes nextBeat of target)
   */
  connectToBottom(project: Project, beatId: string, targetBeatId: string): Project {
    const GAP = 10

    const beat = project.beats.find(b => b.id === beatId)
    const targetBeat = project.beats.find(b => b.id === targetBeatId)

    if (!beat || !targetBeat) return project

    // Desconectar beat actual de sus vecinos
    let updatedProject = this.disconnectBeat(project, beatId)

    // Obtener targetBeat actualizado del proyecto modificado
    const updatedTargetBeat = updatedProject.beats.find(b => b.id === targetBeatId)
    if (!updatedTargetBeat) return project

    // Si targetBeat ya tiene nextBeat, insertar entre ellos
    if (updatedTargetBeat.nextBeatId) {
      return this.insertBetween(updatedProject, beatId, targetBeatId, updatedTargetBeat.nextBeatId)
    }

    // Posicionar beat debajo de targetBeat
    const targetBeatHeight = this.getBeatHeight(targetBeatId)
    const alignedX = updatedTargetBeat.position.x
    const newY = updatedTargetBeat.position.y + targetBeatHeight + GAP

    return {
      ...updatedProject,
      beats: updatedProject.beats.map(b => {
        if (b.id === beatId) {
          return {
            ...b,
            position: { x: alignedX, y: newY },
            prevBeatId: targetBeatId,
            updatedAt: new Date().toISOString()
          }
        }
        if (b.id === targetBeatId) {
          return { ...b, nextBeatId: beatId, updatedAt: new Date().toISOString() }
        }
        return b
      }),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Check if a beat is after another beat in the chain
   * Includes protection against infinite loops
   */
  private isAfterBeat(project: Project, beatId: string, afterBeatId: string): boolean {
    let current = project.beats.find(b => b.id === afterBeatId)
    const visited = new Set<string>()
    
    while (current?.nextBeatId) {
      // Protección contra bucles infinitos
      if (visited.has(current.id)) {
        console.warn('Detected circular reference in beat chain')
        return false
      }
      visited.add(current.id)
      
      if (current.nextBeatId === beatId) return true
      current = project.beats.find(b => b.id === current!.nextBeatId)
      
      // Límite de seguridad: máximo 100 beats en cadena
      if (visited.size > 100) {
        console.warn('Beat chain too long, stopping traversal')
        return false
      }
    }
    
    return false
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
    return {
      ...project,
      beatGroups: project.beatGroups.map(group =>
        group.id === groupId
          ? { 
              ...group, 
              beatIds: [...new Set([...group.beatIds, ...beatIds])], // Remove duplicates
              updatedAt: new Date().toISOString() 
            }
          : group
      ),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Remove beats from a group
   */
  removeBeatsFromGroup(project: Project, groupId: string, beatIds: string[]): Project {
    return {
      ...project,
      beatGroups: project.beatGroups.map(group =>
        group.id === groupId
          ? { 
              ...group, 
              beatIds: group.beatIds.filter(id => !beatIds.includes(id)),
              updatedAt: new Date().toISOString() 
            }
          : group
      ),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Get all beats in a connected chain (including the beat itself)
   */
  getConnectedChain(project: Project, beatId: string): string[] {
    const beat = project.beats.find(b => b.id === beatId)
    if (!beat) return []

    const chain = new Set<string>()
    chain.add(beatId)

    // Traverse backward to find all previous beats
    let current = beat
    while (current.prevBeatId) {
      chain.add(current.prevBeatId)
      const prev = project.beats.find(b => b.id === current!.prevBeatId)
      if (!prev) break
      current = prev
    }

    // Traverse forward to find all next beats
    current = beat
    while (current.nextBeatId) {
      chain.add(current.nextBeatId)
      const next = project.beats.find(b => b.id === current!.nextBeatId)
      if (!next) break
      current = next
    }

    return Array.from(chain)
  }

  /**
   * Add a beat to a group and position it sequentially
   * Simplified: Only adds the single beat, not its chain
   */
  dropBeatIntoGroup(project: Project, beatId: string, groupId: string): Project {
    const GAP = 10
    const GROUP_HEIGHT = 50
    const BEAT_HEIGHT = 80
    
    const group = project.beatGroups.find(g => g.id === groupId)
    if (!group) return project

    // Add ONLY this beat to group (avoid duplicates)
    if (group.beatIds.includes(beatId)) {
      return project // Beat already in group
    }
    
    const updatedBeatIds = [...group.beatIds, beatId]
    
    // Position ALL beats in the group sequentially - CRITICAL: X must ALWAYS match group header X
    let updatedBeats = project.beats.map(beat => {
      const indexInGroup = updatedBeatIds.indexOf(beat.id)
      
      // Only update beats that are in this group
      if (indexInGroup === -1) return beat
      
      // Calculate Y position based on index in group
      const yPosition = group.position.y + GROUP_HEIGHT + GAP + (indexInGroup * (BEAT_HEIGHT + GAP))
      
      return {
        ...beat,
        position: {
          x: group.position.x, // ALWAYS use group X, never previous beat X
          y: yPosition
        },
        updatedAt: new Date().toISOString()
      }
    })
    
    // Update project with repositioned beats and updated group
    return {
      ...project,
      beats: updatedBeats,
      beatGroups: project.beatGroups.map(g =>
        g.id === groupId
          ? {
              ...g,
              beatIds: updatedBeatIds,
              updatedAt: new Date().toISOString()
            }
          : g
      ),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Order beat IDs by their chain connections (first to last)
   */
  private orderBeatChain(project: Project, beatIds: string[]): string[] {
    if (beatIds.length === 0) return []
    if (beatIds.length === 1) return beatIds

    // Find the first beat (no prevBeatId or prevBeat not in chain)
    const firstBeat = project.beats.find(b => 
      beatIds.includes(b.id) && (!b.prevBeatId || !beatIds.includes(b.prevBeatId))
    )
    
    if (!firstBeat) return beatIds // Fallback if chain structure is broken

    // Build ordered list by following nextBeatId
    const ordered: string[] = [firstBeat.id]
    let current = firstBeat
    
    while (current.nextBeatId && beatIds.includes(current.nextBeatId)) {
      ordered.push(current.nextBeatId)
      const next = project.beats.find(b => b.id === current!.nextBeatId)
      if (!next) break
      current = next
    }

    return ordered
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

  // TODO: Implement export to JSON
  // TODO: Implement export to script format
  // TODO: Implement import from external formats
}

export const projectService = new ProjectService()
