/**
 * Domain entities for Escaleta application
 * These types represent the core business logic and are independent of infrastructure
 */

export interface Beat {
  id: string
  title: string
  description: string
  typeId: string
  order: number
  position: { x: number; y: number }
  links: string[] // IDs of related beats (deprecated)
  prevBeatId?: string // Beat anterior en la cadena
  nextBeatId?: string // Beat siguiente en la cadena
  createdAt: string
  updatedAt: string
}

// Zona de imán activa durante drag
export interface MagnetZone {
  beatId: string
  zone: 'top' | 'bottom'
}

export interface BeatType {
  id: string
  name: string
  color: string // Hex color for visual representation
  icon: string // Material Design Icon name
}

export interface Project {
  id: string
  name: string
  description: string
  beats: Beat[]
  beatTypes: BeatType[]
  createdAt: string
  updatedAt: string
}

export interface ProjectSettings {
  zoom: number
  lastViewMode: 'canvas' | 'grid'
  // TODO: Add more settings as needed (grid snap, auto-save, etc.)
}
