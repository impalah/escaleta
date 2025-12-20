import { describe, it, expect } from 'vitest'
import {
  createBlock,
  updateBlock,
  deleteBlock,
  addGroupToBlock,
  removeGroupFromBlock,
  repositionGroupsInBlock,
  getBlockForGroup
} from '@/domain/operations/blockOperations'
import { createBeatGroup, addBeatGroup } from '@/domain/operations/groupOperations'
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

describe('blockOperations - simple tests', () => {
  it('should create block with 2+ groups', () => {
    let project = createMockProject()
    const g1 = createBeatGroup(project, 'G1')
    const g2 = createBeatGroup(project, 'G2')
    project = addBeatGroup(project, g1)
    project = addBeatGroup(project, g2)

    project = createBlock(project, [g1.id, g2.id], 'Block 1')

    expect(project.blocks).toHaveLength(1)
    expect(project.blocks[0].groupIds).toHaveLength(2)
  })

  it('should update block name', () => {
    let project = createMockProject()
    const g1 = createBeatGroup(project, 'G1')
    const g2 = createBeatGroup(project, 'G2')
    project = addBeatGroup(project, g1)
    project = addBeatGroup(project, g2)
    project = createBlock(project, [g1.id, g2.id], 'Old Name')

    project = updateBlock(project, project.blocks[0].id, { name: 'New Name' })

    expect(project.blocks[0].name).toBe('New Name')
  })

  it('should delete block', () => {
    let project = createMockProject()
    const g1 = createBeatGroup(project, 'G1')
    const g2 = createBeatGroup(project, 'G2')
    project = addBeatGroup(project, g1)
    project = addBeatGroup(project, g2)
    project = createBlock(project, [g1.id, g2.id])

    project = deleteBlock(project, project.blocks[0].id)

    expect(project.blocks).toHaveLength(0)
  })

  it('should add group to block', () => {
    let project = createMockProject()
    const g1 = createBeatGroup(project, 'G1')
    const g2 = createBeatGroup(project, 'G2')
    const g3 = createBeatGroup(project, 'G3')
    project = addBeatGroup(project, g1)
    project = addBeatGroup(project, g2)
    project = addBeatGroup(project, g3)
    project = createBlock(project, [g1.id, g2.id])

    project = addGroupToBlock(project, project.blocks[0].id, g3.id)

    expect(project.blocks[0].groupIds).toContain(g3.id)
  })

  it('should remove group and delete block if < 2 groups remain', () => {
    let project = createMockProject()
    const g1 = createBeatGroup(project, 'G1')
    const g2 = createBeatGroup(project, 'G2')
    project = addBeatGroup(project, g1)
    project = addBeatGroup(project, g2)
    project = createBlock(project, [g1.id, g2.id])

    project = removeGroupFromBlock(project, project.blocks[0].id, g1.id)

    expect(project.blocks).toHaveLength(0)
  })

  it('should reposition groups in block', () => {
    let project = createMockProject()
    project = createBeat(project, 'news')
    const g1 = createBeatGroup(project, 'G1', [project.beats[0].id])
    const g2 = createBeatGroup(project, 'G2')
    project = addBeatGroup(project, g1)
    project = addBeatGroup(project, g2)
    project = createBlock(project, [g1.id, g2.id])

    project = repositionGroupsInBlock(project, project.blocks[0].id)

    const updatedG1 = project.beatGroups.find(g => g.id === g1.id)!
    const updatedG2 = project.beatGroups.find(g => g.id === g2.id)!
    expect(updatedG2.position.x).toBeGreaterThan(updatedG1.position.x)
  })

  it('should find block for group', () => {
    let project = createMockProject()
    const g1 = createBeatGroup(project, 'G1')
    const g2 = createBeatGroup(project, 'G2')
    project = addBeatGroup(project, g1)
    project = addBeatGroup(project, g2)
    project = createBlock(project, [g1.id, g2.id])

    const found = getBlockForGroup(project, g1.id)

    expect(found).toBeDefined()
    expect(found?.id).toBe(project.blocks[0].id)
  })
})
