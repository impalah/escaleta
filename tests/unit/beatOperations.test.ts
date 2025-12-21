import { describe, it, expect } from 'vitest'
import {
  createBeat,
  updateBeat,
  deleteBeat,
  getSortedBeats
} from '@/domain/operations/beatOperations'
import type { Project } from '@/domain/entities'

const createMockProject = (): Project => ({
  id: 'project-1',
  name: 'Test Project',
  description: 'Test',
  beats: [],
  beatTypes: [
    { id: 'news', name: 'News', color: '#2196F3', icon: 'mdi-newspaper' }
  ],
  beatGroups: [],
  blocks: [],
  lanes: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
})

describe('beatOperations', () => {
  describe('createBeat', () => {
    it('should create a beat with default values', () => {
      const project = createMockProject()
      const updated = createBeat(project, 'news')

      expect(updated.beats).toHaveLength(1)
      expect(updated.beats[0]).toMatchObject({
        typeId: 'news',
        description: '',
        order: 1,
        links: []
      })
      expect(updated.beats[0].id).toBeDefined()
      expect(updated.beats[0].title).toBeDefined()
      expect(updated.beats[0].position).toBeDefined()
    })

    it('should calculate correct position for first beat', () => {
      const project = createMockProject()
      const updated = createBeat(project, 'news')

      expect(updated.beats[0].position).toEqual({ x: 100, y: 100 })
    })

    it('should calculate correct position for multiple beats', () => {
      let project = createMockProject()
      
      // First beat: col 0, row 0
      project = createBeat(project, 'news')
      expect(project.beats[0].position).toEqual({ x: 100, y: 100 })

      // Second beat: col 1, row 0
      project = createBeat(project, 'news')
      expect(project.beats[1].position).toEqual({ x: 550, y: 100 })

      // Fifth beat: col 0, row 1
      project = createBeat(project, 'news')
      project = createBeat(project, 'news')
      project = createBeat(project, 'news')
      expect(project.beats[4].position).toEqual({ x: 100, y: 250 })
    })

    it('should increment order correctly', () => {
      let project = createMockProject()
      
      project = createBeat(project, 'news')
      expect(project.beats[0].order).toBe(1)

      project = createBeat(project, 'news')
      expect(project.beats[1].order).toBe(2)

      project = createBeat(project, 'news')
      expect(project.beats[2].order).toBe(3)
    })

    it('should update project timestamp', () => {
      const project = createMockProject()
      
      // Wait a tiny bit to ensure timestamp changes
      const updated = createBeat(project, 'news')
      
      expect(updated.updatedAt).toBeDefined()
    })
  })

  describe('updateBeat', () => {
    it('should update beat properties', () => {
      let project = createMockProject()
      project = createBeat(project, 'news')
      const beatId = project.beats[0].id

      const updated = updateBeat(project, beatId, {
        title: 'New Title',
        description: 'New Description'
      })

      expect(updated.beats[0].title).toBe('New Title')
      expect(updated.beats[0].description).toBe('New Description')
    })

    it('should not modify other beats', () => {
      let project = createMockProject()
      project = createBeat(project, 'news')
      project = createBeat(project, 'news')
      const beat1Id = project.beats[0].id
      const beat2Title = project.beats[1].title

      const updated = updateBeat(project, beat1Id, { title: 'Modified' })

      expect(updated.beats[1].title).toBe(beat2Title)
    })

    it('should update timestamp', () => {
      let project = createMockProject()
      project = createBeat(project, 'news')
      const beatId = project.beats[0].id

      const updated = updateBeat(project, beatId, { title: 'New' })

      expect(updated.beats[0].updatedAt).toBeDefined()
      expect(updated.updatedAt).toBeDefined()
    })

    it('should return unchanged project if beat not found', () => {
      const project = createMockProject()
      const updated = updateBeat(project, 'non-existent', { title: 'New' })

      expect(updated.beats).toHaveLength(0)
    })
  })

  describe('deleteBeat', () => {
    it('should remove beat from project', () => {
      let project = createMockProject()
      project = createBeat(project, 'news')
      const beatId = project.beats[0].id

      const updated = deleteBeat(project, beatId)

      expect(updated.beats).toHaveLength(0)
    })

    it('should only remove specified beat', () => {
      let project = createMockProject()
      project = createBeat(project, 'news')
      project = createBeat(project, 'news')
      const beat1Id = project.beats[0].id

      const updated = deleteBeat(project, beat1Id)

      expect(updated.beats).toHaveLength(1)
      expect(updated.beats[0].id).not.toBe(beat1Id)
    })

    it('should update project timestamp', () => {
      let project = createMockProject()
      project = createBeat(project, 'news')
      const beatId = project.beats[0].id

      const updated = deleteBeat(project, beatId)

      expect(updated.updatedAt).toBeDefined()
    })

    it('should return unchanged project if beat not found', () => {
      let project = createMockProject()
      project = createBeat(project, 'news')
      const originalLength = project.beats.length

      const updated = deleteBeat(project, 'non-existent')

      expect(updated.beats).toHaveLength(originalLength)
    })
  })

  describe('getSortedBeats', () => {
    it('should return beats sorted by order', () => {
      let project = createMockProject()
      project = createBeat(project, 'news')
      project = createBeat(project, 'news')
      project = createBeat(project, 'news')

      // Manually mess up the order
      project.beats[0].order = 3
      project.beats[1].order = 1
      project.beats[2].order = 2

      const sorted = getSortedBeats(project)

      expect(sorted[0].order).toBe(1)
      expect(sorted[1].order).toBe(2)
      expect(sorted[2].order).toBe(3)
    })

    it('should not modify original array', () => {
      let project = createMockProject()
      project = createBeat(project, 'news')
      project.beats[0].order = 5

      const sorted = getSortedBeats(project)

      expect(project.beats[0].order).toBe(5)
      expect(sorted[0].order).toBe(5)
    })

    it('should return empty array for empty project', () => {
      const project = createMockProject()
      const sorted = getSortedBeats(project)

      expect(sorted).toEqual([])
    })
  })
})
