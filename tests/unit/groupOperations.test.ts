import { describe, it, expect } from 'vitest'
import {
  createBeatGroup,
  addBeatGroup,
  updateBeatGroup,
  deleteBeatGroup,
  addBeatsToGroup,
  insertBeatBeforeInGroup,
  repositionBeatsInGroup,
  removeBeatFromGroup,
  getGroupForBeat,
  belongsToBeatGroup
} from '@/domain/operations/groupOperations'
import { createBeat } from '@/domain/operations/beatOperations'
import type { Project } from '@/domain/entities'

const createMockProject = (): Project => ({
  id: 'project-1',
  name: 'Test Project',
  description: 'Test',
  beats: [],
  beatTypes: [{ id: 'news', name: 'News', color: '#2196F3', icon: 'mdi-newspaper' }],
  beatGroups: [],
  blocks: [],
  lanes: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
})

describe('groupOperations', () => {
  describe('createBeatGroup', () => {
    it('should create a group with default values', () => {
      const project = createMockProject()
      const group = createBeatGroup(project, 'Test Group')

      expect(group.name).toBe('Test Group')
      expect(group.description).toBe('')
      expect(group.beatIds).toEqual([])
      expect(group.collapsed).toBe(false)
      expect(group.order).toBe(1)
      expect(group.id).toBeDefined()
      expect(group.position).toBeDefined()
    })

    it('should accept initial beat IDs', () => {
      const project = createMockProject()
      const group = createBeatGroup(project, 'Test Group', ['beat1', 'beat2'])

      expect(group.beatIds).toEqual(['beat1', 'beat2'])
    })

    it('should calculate correct position', () => {
      const project = createMockProject()
      const group = createBeatGroup(project, 'Test Group')

      expect(group.position).toEqual({ x: 100, y: 50 })
    })

    it('should increment order correctly', () => {
      let project = createMockProject()
      
      const group1 = createBeatGroup(project, 'Group 1')
      expect(group1.order).toBe(1)

      project = addBeatGroup(project, group1)
      const group2 = createBeatGroup(project, 'Group 2')
      expect(group2.order).toBe(2)
    })
  })

  describe('addBeatGroup', () => {
    it('should add group to project', () => {
      const project = createMockProject()
      const group = createBeatGroup(project, 'Test Group')
      
      const updated = addBeatGroup(project, group)

      expect(updated.beatGroups).toHaveLength(1)
      expect(updated.beatGroups[0]).toBe(group)
    })

    it('should update timestamp', () => {
      const project = createMockProject()
      const group = createBeatGroup(project, 'Test Group')
      
      const updated = addBeatGroup(project, group)

      expect(updated.updatedAt).toBeDefined()
    })
  })

  describe('updateBeatGroup', () => {
    it('should update group properties', () => {
      let project = createMockProject()
      const group = createBeatGroup(project, 'Original')
      project = addBeatGroup(project, group)

      const updated = updateBeatGroup(project, group.id, {
        name: 'Updated',
        description: 'New description'
      })

      expect(updated.beatGroups[0].name).toBe('Updated')
      expect(updated.beatGroups[0].description).toBe('New description')
    })

    it('should not modify other groups', () => {
      let project = createMockProject()
      const group1 = createBeatGroup(project, 'Group 1')
      project = addBeatGroup(project, group1)
      const group2 = createBeatGroup(project, 'Group 2')
      project = addBeatGroup(project, group2)

      const updated = updateBeatGroup(project, group1.id, { name: 'Modified' })

      expect(updated.beatGroups[1].name).toBe('Group 2')
    })
  })

  describe('deleteBeatGroup', () => {
    it('should remove group from project', () => {
      let project = createMockProject()
      const group = createBeatGroup(project, 'Test')
      project = addBeatGroup(project, group)

      const updated = deleteBeatGroup(project, group.id)

      expect(updated.beatGroups).toHaveLength(0)
    })

    it('should only remove specified group', () => {
      let project = createMockProject()
      const group1 = createBeatGroup(project, 'Group 1')
      const group2 = createBeatGroup(project, 'Group 2')
      project = addBeatGroup(project, group1)
      project = addBeatGroup(project, group2)

      const updated = deleteBeatGroup(project, group1.id)

      expect(updated.beatGroups).toHaveLength(1)
      expect(updated.beatGroups[0].id).toBe(group2.id)
    })
  })

  describe('addBeatsToGroup', () => {
    it('should add beats to group', () => {
      let project = createMockProject()
      project = createBeat(project, 'news')
      project = createBeat(project, 'news')
      const beatIds = project.beats.map(b => b.id)

      const group = createBeatGroup(project, 'Test')
      project = addBeatGroup(project, group)

      const updated = addBeatsToGroup(project, group.id, beatIds)

      expect(updated.beatGroups[0].beatIds).toEqual(beatIds)
    })

    it('should reposition beats vertically', () => {
      let project = createMockProject()
      project = createBeat(project, 'news')
      project = createBeat(project, 'news')
      const beatIds = project.beats.map(b => b.id)

      const group = createBeatGroup(project, 'Test')
      project = addBeatGroup(project, group)

      const updated = addBeatsToGroup(project, group.id, beatIds)

      // Beats should be positioned below group header
      expect(updated.beats[0].position.y).toBeGreaterThan(group.position.y)
      expect(updated.beats[1].position.y).toBeGreaterThan(updated.beats[0].position.y)
    })

    it('should remove duplicate beat IDs', () => {
      let project = createMockProject()
      project = createBeat(project, 'news')
      const beatId = project.beats[0].id

      const group = createBeatGroup(project, 'Test', [beatId])
      project = addBeatGroup(project, group)

      const updated = addBeatsToGroup(project, group.id, [beatId, beatId])

      expect(updated.beatGroups[0].beatIds).toEqual([beatId])
    })

    it('should return unchanged if group not found', () => {
      const project = createMockProject()
      const updated = addBeatsToGroup(project, 'non-existent', ['beat1'])

      expect(updated).toEqual(project)
    })
  })

  describe('insertBeatBeforeInGroup', () => {
    it('should insert beat at correct position', () => {
      let project = createMockProject()
      project = createBeat(project, 'news')
      project = createBeat(project, 'news')
      project = createBeat(project, 'news')
      const [beat1, beat2, beat3] = project.beats.map(b => b.id)

      const group = createBeatGroup(project, 'Test', [beat1, beat3])
      project = addBeatGroup(project, group)

      const updated = insertBeatBeforeInGroup(project, group.id, beat2, beat3)

      expect(updated.beatGroups[0].beatIds).toEqual([beat1, beat2, beat3])
    })

    it('should reorder existing beat in group', () => {
      let project = createMockProject()
      project = createBeat(project, 'news')
      project = createBeat(project, 'news')
      project = createBeat(project, 'news')
      const [beat1, beat2, beat3] = project.beats.map(b => b.id)

      const group = createBeatGroup(project, 'Test', [beat1, beat2, beat3])
      project = addBeatGroup(project, group)

      // Move beat3 before beat2
      const updated = insertBeatBeforeInGroup(project, group.id, beat3, beat2)

      expect(updated.beatGroups[0].beatIds).toEqual([beat1, beat3, beat2])
    })

    it('should return unchanged if group not found', () => {
      const project = createMockProject()
      const updated = insertBeatBeforeInGroup(project, 'non-existent', 'b1', 'b2')

      expect(updated).toEqual(project)
    })

    it('should return unchanged if target beat not in group', () => {
      let project = createMockProject()
      project = createBeat(project, 'news')
      const beatId = project.beats[0].id

      const group = createBeatGroup(project, 'Test', [beatId])
      project = addBeatGroup(project, group)

      const updated = insertBeatBeforeInGroup(project, group.id, 'new-beat', 'non-existent')

      expect(updated.beatGroups[0].beatIds).toEqual([beatId])
    })
  })

  describe('repositionBeatsInGroup', () => {
    it('should position beats vertically', () => {
      let project = createMockProject()
      project = createBeat(project, 'news')
      project = createBeat(project, 'news')
      const beatIds = project.beats.map(b => b.id)

      const group = createBeatGroup(project, 'Test', beatIds)
      project = addBeatGroup(project, group)

      const updated = repositionBeatsInGroup(project, group.id)

      // First beat below header + gap
      expect(updated.beats[0].position.y).toBe(group.position.y + 50 + 10)
      // Second beat below first + gap
      expect(updated.beats[1].position.y).toBe(updated.beats[0].position.y + 80 + 10)
    })

    it('should align beats horizontally with group', () => {
      let project = createMockProject()
      project = createBeat(project, 'news')
      const beatId = project.beats[0].id

      const group = createBeatGroup(project, 'Test', [beatId])
      project = addBeatGroup(project, group)

      const updated = repositionBeatsInGroup(project, group.id)

      expect(updated.beats[0].position.x).toBe(group.position.x)
    })

    it('should return unchanged if group not found', () => {
      const project = createMockProject()
      const updated = repositionBeatsInGroup(project, 'non-existent')

      expect(updated).toEqual(project)
    })
  })

  describe('removeBeatFromGroup', () => {
    it('should remove beat and reposition remaining', () => {
      let project = createMockProject()
      project = createBeat(project, 'news')
      project = createBeat(project, 'news')
      const [beat1, beat2] = project.beats.map(b => b.id)

      const group = createBeatGroup(project, 'Test', [beat1, beat2])
      project = addBeatGroup(project, group)
      project = repositionBeatsInGroup(project, group.id)

      const updated = removeBeatFromGroup(project, beat1, group.id)

      expect(updated.beatGroups[0].beatIds).toEqual([beat2])
      // Remaining beat should be repositioned to index 0
      expect(updated.beats[1].position.y).toBe(group.position.y + 50 + 10)
    })

    it('should return unchanged if group not found', () => {
      const project = createMockProject()
      const updated = removeBeatFromGroup(project, 'beat1', 'non-existent')

      expect(updated).toEqual(project)
    })

    it('should return unchanged if beat not found', () => {
      let project = createMockProject()
      const group = createBeatGroup(project, 'Test')
      project = addBeatGroup(project, group)

      const updated = removeBeatFromGroup(project, 'non-existent', group.id)

      expect(updated).toEqual(project)
    })
  })

  describe('getGroupForBeat', () => {
    it('should return group containing beat', () => {
      let project = createMockProject()
      project = createBeat(project, 'news')
      const beatId = project.beats[0].id

      const group = createBeatGroup(project, 'Test', [beatId])
      project = addBeatGroup(project, group)

      const found = getGroupForBeat(project, beatId)

      expect(found).toBeDefined()
      expect(found?.id).toBe(group.id)
    })

    it('should return undefined if beat not in any group', () => {
      let project = createMockProject()
      project = createBeat(project, 'news')
      const beatId = project.beats[0].id

      const found = getGroupForBeat(project, beatId)

      expect(found).toBeUndefined()
    })
  })

  describe('belongsToBeatGroup', () => {
    it('should return true if beat is in a group', () => {
      let project = createMockProject()
      project = createBeat(project, 'news')
      const beatId = project.beats[0].id

      const group = createBeatGroup(project, 'Test', [beatId])
      project = addBeatGroup(project, group)

      expect(belongsToBeatGroup(project, beatId)).toBe(true)
    })

    it('should return false if beat not in any group', () => {
      let project = createMockProject()
      project = createBeat(project, 'news')
      const beatId = project.beats[0].id

      expect(belongsToBeatGroup(project, beatId)).toBe(false)
    })
  })
})
