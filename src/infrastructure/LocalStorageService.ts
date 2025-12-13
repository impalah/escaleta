import type { Project } from '@/domain/entities'

const STORAGE_KEY = 'escaleta.currentProject'

/**
 * Infrastructure layer: handles persistence using localStorage
 * Can be easily replaced with IndexedDB or other storage mechanisms
 */
export class LocalStorageService {
  saveProject(project: Project): void {
    try {
      const serialized = JSON.stringify(project)
      localStorage.setItem(STORAGE_KEY, serialized)
    } catch (error) {
      console.error('Failed to save project to localStorage:', error)
      throw new Error('Could not save project')
    }
  }

  loadProject(): Project | null {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY)
      if (!serialized) {
        return null
      }
      const project = JSON.parse(serialized) as Project
      
      return project
    } catch (error) {
      console.error('Failed to load project from localStorage:', error)
      return null
    }
  }

  clearProject(): void {
    localStorage.removeItem(STORAGE_KEY)
  }

  hasProject(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null
  }
}

export const storageService = new LocalStorageService()
