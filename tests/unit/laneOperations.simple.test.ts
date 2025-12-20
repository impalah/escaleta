import { describe, it, expect } from 'vitest'
import {
  createLane,
  updateLane,
  deleteLane,
  addBlockToLane,
  removeBlockFromLane,
  repositionBlocksInLane,
  getLaneForBlock,
  isFirstBlockInLane
} from '@/domain/operations/laneOperations'
import { createBlock } from '@/domain/operations/blockOperations'
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

describe('laneOperations - simple tests', () => {
  it('should create lane with blocks', () => {
    let project = createMockProject()
    const g1 = createBeatGroup(project, 'G1')
    const g2 = createBeatGroup(project, 'G2')
    project = addBeatGroup(project, g1)
    project = addBeatGroup(project, g2)
    project = createBlock(project, [g1.id, g2.id])
    const blockId = project.blocks[0].id

    project = createLane(project, [blockId], 'Lane 1')

    expect(project.lanes).toHaveLength(1)
    expect(project.lanes[0].blockIds).toContain(blockId)
  })

  it('should update lane name', () => {
    let project = createMockProject()
    const g1 = createBeatGroup(project, 'G1')
    const g2 = createBeatGroup(project, 'G2')
    project = addBeatGroup(project, g1)
    project = addBeatGroup(project, g2)
    project = createBlock(project, [g1.id, g2.id])
    project = createLane(project, [project.blocks[0].id], 'Old Name')

    project = updateLane(project, project.lanes[0].id, { name: 'New Name' })

    expect(project.lanes[0].name).toBe('New Name')
  })

  it('should delete lane', () => {
    let project = createMockProject()
    const g1 = createBeatGroup(project, 'G1')
    const g2 = createBeatGroup(project, 'G2')
    project = addBeatGroup(project, g1)
    project = addBeatGroup(project, g2)
    project = createBlock(project, [g1.id, g2.id])
    project = createLane(project, [project.blocks[0].id])

    project = deleteLane(project, project.lanes[0].id)

    expect(project.lanes).toHaveLength(0)
  })

  it('should add block to lane', () => {
    let project = createMockProject()
    const g1 = createBeatGroup(project, 'G1')
    const g2 = createBeatGroup(project, 'G2')
    const g3 = createBeatGroup(project, 'G3')
    const g4 = createBeatGroup(project, 'G4')
    project = addBeatGroup(project, g1)
    project = addBeatGroup(project, g2)
    project = addBeatGroup(project, g3)
    project = addBeatGroup(project, g4)
    project = createBlock(project, [g1.id, g2.id])
    project = createBlock(project, [g3.id, g4.id])
    const [b1, b2] = project.blocks.map(b => b.id)
    project = createLane(project, [b1])

    project = addBlockToLane(project, project.lanes[0].id, b2)

    expect(project.lanes[0].blockIds).toContain(b2)
  })

  it('should remove block and delete lane if <=  block remains', () => {
    let project = createMockProject()
    const g1 = createBeatGroup(project, 'G1')
    const g2 = createBeatGroup(project, 'G2')
    const g3 = createBeatGroup(project, 'G3')
    const g4 = createBeatGroup(project, 'G4')
    project = addBeatGroup(project, g1)
    project = addBeatGroup(project, g2)
    project = addBeatGroup(project, g3)
    project = addBeatGroup(project, g4)
    project = createBlock(project, [g1.id, g2.id])
    project = createBlock(project, [g3.id, g4.id])
    const [b1, b2] = project.blocks.map(b => b.id)
    project = createLane(project, [b1, b2])

    // Removing first block leaves 1, which triggers lane deletion (<= 1)
    project = removeBlockFromLane(project, b1)

    // Lane should be deleted when <= 1 blocks remain
    expect(project.lanes).toHaveLength(0)
  })

  it('should reposition blocks in lane', () => {
    let project = createMockProject()
    project = createBeat(project, 'news')
    const g1 = createBeatGroup(project, 'G1', [project.beats[0].id])
    const g2 = createBeatGroup(project, 'G2')
    const g3 = createBeatGroup(project, 'G3')
    const g4 = createBeatGroup(project, 'G4')
    project = addBeatGroup(project, g1)
    project = addBeatGroup(project, g2)
    project = addBeatGroup(project, g3)
    project = addBeatGroup(project, g4)
    project = createBlock(project, [g1.id, g2.id])
    project = createBlock(project, [g3.id, g4.id])
    const [b1, b2] = project.blocks.map(b => b.id)
    project = createLane(project, [b1, b2])

    project = repositionBlocksInLane(project, project.lanes[0].id)

    const updatedB1 = project.blocks.find(b => b.id === b1)!
    const updatedB2 = project.blocks.find(b => b.id === b2)!
    expect(updatedB2.position.y).toBeGreaterThan(updatedB1.position.y)
  })

  it('should find lane for block', () => {
    let project = createMockProject()
    const g1 = createBeatGroup(project, 'G1')
    const g2 = createBeatGroup(project, 'G2')
    project = addBeatGroup(project, g1)
    project = addBeatGroup(project, g2)
    project = createBlock(project, [g1.id, g2.id])
    const blockId = project.blocks[0].id
    project = createLane(project, [blockId])

    const found = getLaneForBlock(project, blockId)

    expect(found).toBeDefined()
    expect(found?.id).toBe(project.lanes[0].id)
  })

  it('should check if block is first in lane', () => {
    let project = createMockProject()
    const g1 = createBeatGroup(project, 'G1')
    const g2 = createBeatGroup(project, 'G2')
    const g3 = createBeatGroup(project, 'G3')
    const g4 = createBeatGroup(project, 'G4')
    project = addBeatGroup(project, g1)
    project = addBeatGroup(project, g2)
    project = addBeatGroup(project, g3)
    project = addBeatGroup(project, g4)
    project = createBlock(project, [g1.id, g2.id])
    project = createBlock(project, [g3.id, g4.id])
    const [b1, b2] = project.blocks.map(b => b.id)
    project = createLane(project, [b1, b2])

    expect(isFirstBlockInLane(project, b1, project.lanes[0].id)).toBe(true)
    expect(isFirstBlockInLane(project, b2, project.lanes[0].id)).toBe(false)
  })
})
