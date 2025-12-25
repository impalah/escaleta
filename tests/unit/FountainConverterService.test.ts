/**
 * Tests for FountainConverterService
 */

import { describe, it, expect } from 'vitest'
import { FountainConverterService } from '@/services/FountainConverterService'
import type { Project } from '@/domain/entities'

describe('FountainConverterService', () => {
  const emptyProject: Project = {
    id: 'test-project',
    name: 'Test Project',
    description: '',
    beats: [],
    beatGroups: [],
    blocks: [],
    lanes: [],
    beatTypes: [
      { id: 'opening', name: 'Opening', color: '#4CAF50' },
      { id: 'news', name: 'News', color: '#2196F3' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  describe('fountainToProject', () => {
    it('should parse time values with colons correctly', () => {
      const fountain = `[[ BEAT_ID: test-1 | TYPE: opening | TITLE: Test Beat | START: 00:01:30 | DURATION: 01:45 ]]`

      const result = FountainConverterService.fountainToProject(fountain, emptyProject)

      expect(result.beats).toHaveLength(1)
      expect(result.beats[0].eventStartTime).toBe('00:01:30')
      expect(result.beats[0].eventDuration).toBe('01:45')
    })

    it('should parse scene headings with dots (INT. STUDIO DAY)', () => {
      const fountain = `[[ BEAT_ID: test-2 | TYPE: opening | TITLE: Test ]]
INT. STUDIO DAY

Test dialogue`

      const result = FountainConverterService.fountainToProject(fountain, emptyProject)

      expect(result.beats).toHaveLength(1)
      expect(result.beats[0].scene).toBe('INT. STUDIO DAY')
      expect(result.beats[0].description).toBe('Test dialogue')
    })

    it('should parse scene headings with EXT.', () => {
      const fountain = `[[ BEAT_ID: test-3 | TYPE: opening | TITLE: Test ]]
EXT. BOSQUE

Action text`

      const result = FountainConverterService.fountainToProject(fountain, emptyProject)

      expect(result.beats).toHaveLength(1)
      expect(result.beats[0].scene).toBe('EXT. BOSQUE')
      expect(result.beats[0].description).toBe('Action text')
    })

    it('should parse complete beat with scene, character, and dialogue', () => {
      const fountain = `[[ BEAT_ID: test-4 | TYPE: opening | TITLE: Opening | START: 00:01 | DURATION: 01:00 ]]
[[ CUE: CAMERA 2, FADE IN ]]
INT. STUDIO DAY

PRESENTER
Some opening texts.
Multiline stuff, things to say`

      const result = FountainConverterService.fountainToProject(fountain, emptyProject)

      expect(result.beats).toHaveLength(1)
      const beat = result.beats[0]
      expect(beat.eventStartTime).toBe('00:01')
      expect(beat.eventDuration).toBe('01:00')
      expect(beat.scene).toBe('INT. STUDIO DAY')
      expect(beat.character).toBe('PRESENTER')
      expect(beat.description).toContain('Some opening texts')
      expect(beat.description).toContain('Multiline stuff')
      expect(beat.cue).toEqual(['CAMERA 2', 'FADE IN'])
    })
  })

  describe('projectToFountain', () => {
    it('should export time values with colons preserved', () => {
      const project: Project = {
        ...emptyProject,
        beats: [
          {
            id: 'beat-1',
            title: 'Test Beat',
            description: 'Test',
            typeId: 'opening',
            order: 0,
            position: { x: 0, y: 0 },
            links: [],
            eventStartTime: '00:01:30',
            eventDuration: '01:45',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        beatGroups: [
          {
            id: 'group-1',
            name: 'Group 1',
            beatIds: ['beat-1'],
            position: { x: 0, y: 0 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        blocks: [
          {
            id: 'block-1',
            name: 'Block 1',
            groupIds: ['group-1'],
            position: { x: 0, y: 0 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        lanes: [
          {
            id: 'lane-1',
            name: 'Lane 1',
            blockIds: ['block-1'],
            position: { x: 0, y: 0 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      }

      const fountain = FountainConverterService.projectToFountain(project)

      expect(fountain).toContain('START: 00:01:30')
      expect(fountain).toContain('DURATION: 01:45')
    })

    it('should export scene headings correctly', () => {
      const project: Project = {
        ...emptyProject,
        beats: [
          {
            id: 'beat-1',
            title: 'Test Beat',
            description: 'Test action',
            typeId: 'opening',
            order: 0,
            position: { x: 0, y: 0 },
            links: [],
            scene: 'INT. STUDIO DAY',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        beatGroups: [
          {
            id: 'group-1',
            name: 'Group 1',
            beatIds: ['beat-1'],
            position: { x: 0, y: 0 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        blocks: [
          {
            id: 'block-1',
            name: 'Block 1',
            groupIds: ['group-1'],
            position: { x: 0, y: 0 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        lanes: [
          {
            id: 'lane-1',
            name: 'Lane 1',
            blockIds: ['block-1'],
            position: { x: 0, y: 0 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      }

      const fountain = FountainConverterService.projectToFountain(project)

      expect(fountain).toContain('INT. STUDIO DAY')
    })
  })
})
