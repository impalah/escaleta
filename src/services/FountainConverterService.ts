/**
 * Service for converting between Escaleta project structure and Fountain format
 */

import type { Project, Beat, BeatGroup, Block, Lane } from '@/domain/entities'
import { calculateHierarchyLayout } from '@/domain/operations/geometry'

export class FountainConverterService {
  /**
   * Convert Escaleta project to Fountain screenplay format
   */
  static projectToFountain(project: Project): string {
    const lines: string[] = []

    // Title page (as comment to preserve project metadata)
    lines.push(`Title: ${project.name}`)
    if (project.description) {
      lines.push(`Credit: ${project.description}`)
    }
    lines.push('')
    lines.push('') // Blank line after title page

    // Helper to find beats for a group
    const getBeatsForGroup = (groupId: string): Beat[] => {
      const group = project.beatGroups.find(g => g.id === groupId)
      if (!group) return []
      return group.beatIds
        .map(beatId => project.beats.find(b => b.id === beatId))
        .filter(Boolean) as Beat[]
    }

    // Helper to find groups for a block
    const getGroupsForBlock = (blockId: string): BeatGroup[] => {
      const block = project.blocks.find(b => b.id === blockId)
      if (!block) return []
      return block.groupIds
        .map(groupId => project.beatGroups.find(g => g.id === groupId))
        .filter(Boolean) as BeatGroup[]
    }

    // Helper to find blocks for a lane
    const getBlocksForLane = (laneId: string): Block[] => {
      const lane = project.lanes.find(l => l.id === laneId)
      if (!lane) return []
      return lane.blockIds
        .map(blockId => project.blocks.find(b => b.id === blockId))
        .filter(Boolean) as Block[]
    }

    // Process Lanes → Blocks → Groups → Beats hierarchy
    project.lanes.forEach(lane => {
      // Lane as # heading
      lines.push(`# ${lane.name}`)
      lines.push(`[[ LANE_ID: ${lane.id} ]]`)
      lines.push('')

      const blocks = getBlocksForLane(lane.id)
      blocks.forEach(block => {
        // Block as ## heading
        lines.push(`## ${block.name}`)
        lines.push(`[[ BLOCK_ID: ${block.id} ]]`)
        lines.push('')

        const groups = getGroupsForBlock(block.id)
        groups.forEach(group => {
          // BeatGroup as ### heading
          lines.push(`### ${group.name}`)
          lines.push(`[[ GROUP_ID: ${group.id} ]]`)
          if (group.description) {
            lines.push(`[[ GROUP_DESC: ${group.description} ]]`)
          }
          lines.push('')

          const beats = getBeatsForGroup(group.id)
          beats.forEach(beat => {
            this.beatToFountain(beat, lines, project)
          })
        })
      })
    })

    // Process orphan blocks (without lane)
    const orphanBlocks = project.blocks.filter(block => {
      return !project.lanes.some(lane => lane.blockIds.includes(block.id))
    })

    orphanBlocks.forEach(block => {
      lines.push(`## ${block.name}`)
      lines.push(`[[ BLOCK_ID: ${block.id} ]]`)
      lines.push('')

      const groups = getGroupsForBlock(block.id)
      groups.forEach(group => {
        lines.push(`### ${group.name}`)
        lines.push(`[[ GROUP_ID: ${group.id} | BLOCK_ID: ${block.id} ]]`)
        lines.push('')

        const beats = getBeatsForGroup(group.id)
        beats.forEach(beat => {
          this.beatToFountain(beat, lines, project)
        })
      })
    })

    // Process orphan groups (without block)
    const orphanGroups = project.beatGroups.filter(group => {
      return !project.blocks.some(block => block.groupIds.includes(group.id))
    })

    orphanGroups.forEach(group => {
      lines.push(`### ${group.name}`)
      lines.push(`[[ GROUP_ID: ${group.id} ]]`)
      lines.push('')

      const beats = getBeatsForGroup(group.id)
      beats.forEach(beat => {
        this.beatToFountain(beat, lines, project)
      })
    })

    // Process orphan beats (without group)
    const orphanBeats = project.beats.filter(beat => {
      return !project.beatGroups.some(group => group.beatIds.includes(beat.id))
    })

    if (orphanBeats.length > 0) {
      lines.push('### Orphan Beats')
      lines.push('')
      orphanBeats.forEach(beat => {
        this.beatToFountain(beat, lines, project)
      })
    }

    return lines.join('\n')
  }

  /**
   * Convert a single Beat to Fountain lines
   */
  private static beatToFountain(beat: Beat, lines: string[], _project: Project): void {
    // Metadata as hidden notes
    const metadata: string[] = []
    metadata.push(`BEAT_ID: ${beat.id}`)
    metadata.push(`TYPE: ${beat.typeId}`)
    if (beat.title) {
      metadata.push(`TITLE: ${beat.title}`)
    }
    if (beat.eventStartTime) {
      metadata.push(`START: ${beat.eventStartTime}`)
    }
    if (beat.eventDuration) {
      metadata.push(`DURATION: ${beat.eventDuration}`)
    }
    if (beat.assets && beat.assets.length > 0) {
      metadata.push(`ASSETS: ${beat.assets.join(', ')}`)
    }

    lines.push(`[[ ${metadata.join(' | ')} ]]`)

    // Cues as notes
    if (beat.cue && beat.cue.length > 0) {
      lines.push(`[[ CUE: ${beat.cue.join(', ')} ]]`)
    }

    // Scene heading (if exists)
    if (beat.scene) {
      // Force scene heading with . if it doesn't start with INT/EXT
      const sceneUpper = beat.scene.trim().toUpperCase()
      if (
        sceneUpper.startsWith('INT') ||
        sceneUpper.startsWith('EXT') ||
        sceneUpper.startsWith('EST') ||
        sceneUpper.startsWith('I/E')
      ) {
        lines.push(beat.scene.trim())
      } else {
        lines.push(`.${beat.scene.trim()}`)
      }
      lines.push('')
    }

    // Character + Dialogue OR Action
    if (beat.character && beat.description) {
      // Character (UPPERCASE)
      lines.push(beat.character.toUpperCase())
      // Dialogue
      lines.push(beat.description.trim())
      lines.push('')
    } else if (beat.description) {
      // Action (plain text)
      lines.push(beat.description.trim())
      lines.push('')
    }
  }

  /**
   * Parse Fountain text back to Escaleta project structure
   */
  static fountainToProject(fountainText: string, baseProject: Project): Project {
    console.log('=== FOUNTAIN PARSING START ===')
    console.log('Fountain text length:', fountainText.length, 'characters')

    const lines = fountainText.split('\n')
    console.log('Total lines to parse:', lines.length)

    // Result arrays
    const newBeats: Beat[] = []
    const newGroups: BeatGroup[] = []
    const newBlocks: Block[] = []
    const newLanes: Lane[] = []

    // Parser state
    let currentLane: Lane | null = null
    let currentBlock: Block | null = null
    let currentGroup: BeatGroup | null = null
    let currentBeat: Beat | null = null
    let currentMetadata: Record<string, string> = {}
    let currentCues: string[] = []
    let isInDialogue = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      // Skip empty lines - they don't finalize beats in Fountain
      // Beats are finalized only when a new BEAT_ID, BeatGroup, or EOF is reached
      if (!trimmed) {
        continue
      }

      // Skip title page metadata (Title:, Credit:, etc.)
      if (trimmed.match(/^(Title|Credit|Author|Source|Draft date|Contact):/i)) {
        continue
      }

      // Parse notes [[ ... ]]
      const noteMatch = trimmed.match(/^\[\[\s*(.+?)\s*\]\]$/)
      if (noteMatch) {
        const noteContent = noteMatch[1]

        // Parse metadata
        if (noteContent.includes('LANE_ID:')) {
          const idMatch = noteContent.match(/LANE_ID:\s*(\S+)/)
          if (idMatch && currentLane) {
            currentLane.id = idMatch[1]
          }
        }

        if (noteContent.includes('BLOCK_ID:') && !noteContent.includes('GROUP_ID:')) {
          // BLOCK_ID standalone (not in GROUP_ID metadata)
          const idMatch = noteContent.match(/BLOCK_ID:\s*(\S+)/)
          if (idMatch && currentBlock) {
            const oldId = currentBlock.id
            const newId = idMatch[1]
            currentBlock.id = newId
            console.log(`[Line ${i}] Set Block ID: ${currentBlock.id}`)

            // Update Lane's blockIds array
            if (currentLane) {
              const idx = currentLane.blockIds.indexOf(oldId)
              if (idx !== -1) {
                currentLane.blockIds[idx] = newId
                console.log(`[Line ${i}] Updated Lane blockIds: ${oldId} → ${newId}`)
              }
            }
            // Also update in newLanes array in case currentLane is not set
            newLanes.forEach(lane => {
              const idx = lane.blockIds.indexOf(oldId)
              if (idx !== -1) {
                lane.blockIds[idx] = newId
              }
            })
          }
        }

        if (noteContent.includes('GROUP_ID:')) {
          const idMatch = noteContent.match(/GROUP_ID:\s*(\S+)/)
          if (idMatch && currentGroup) {
            const oldId = currentGroup.id
            const newId = idMatch[1]
            currentGroup.id = newId

            // Update Block's groupIds array
            if (currentBlock) {
              const idx = currentBlock.groupIds.indexOf(oldId)
              if (idx !== -1) {
                currentBlock.groupIds[idx] = newId
                console.log(`[Line ${i}] Updated Block groupIds: ${oldId} → ${newId}`)
              }
            }
            // Also update in newBlocks array
            newBlocks.forEach(block => {
              const idx = block.groupIds.indexOf(oldId)
              if (idx !== -1) {
                block.groupIds[idx] = newId
              }
            })
          }
          // Check if this group has a BLOCK_ID metadata
          const blockIdMatch = noteContent.match(/BLOCK_ID:\s*(\S+)/)
          if (blockIdMatch && currentGroup) {
            const blockId = blockIdMatch[1]
            const targetBlock = newBlocks.find(b => b.id === blockId)
            if (targetBlock && currentGroup) {
              // Remove group from any other block first
              newBlocks.forEach(b => {
                if (currentGroup) {
                  const idx = b.groupIds.indexOf(currentGroup.id)
                  if (idx !== -1 && b.id !== blockId) {
                    b.groupIds.splice(idx, 1)
                    console.log(
                      `[Line ${i}] Removed group "${currentGroup.name}" from block "${b.name}"`
                    )
                  }
                }
              })
              // Add to target block
              if (!targetBlock.groupIds.includes(currentGroup.id)) {
                targetBlock.groupIds.push(currentGroup.id)
                console.log(
                  `[Line ${i}] Assigned group "${currentGroup.name}" to block "${targetBlock.name}" via metadata`
                )
              }
            } else {
              console.log(
                `[Line ${i}] WARNING: Block ${blockId} not found for group "${currentGroup.name}"`
              )
            }
          }
        }

        if (noteContent.includes('GROUP_DESC:')) {
          const descMatch = noteContent.match(/GROUP_DESC:\s*(.+)/)
          if (descMatch && currentGroup) {
            currentGroup.description = descMatch[1]
          }
        }

        if (noteContent.includes('BEAT_ID:')) {
          // Finalize previous beat if it exists
          if (currentBeat) {
            if (currentGroup && !currentGroup.beatIds.includes(currentBeat.id)) {
              currentGroup.beatIds.push(currentBeat.id)
              console.log(
                `[Line ${i}] New BEAT_ID found - Finalizing previous beat and adding to group "${currentGroup.name}"`
              )
            }
            newBeats.push(currentBeat)
            currentBeat = null
          }

          // Parse beat metadata
          currentMetadata = {}
          noteContent.split('|').forEach(part => {
            const [key, ...valueParts] = part.split(':')
            const value = valueParts.join(':').trim()
            if (key && value) {
              currentMetadata[key.trim()] = value
            }
          })

          // Create beat immediately from metadata
          currentBeat = this.createBeat(currentMetadata)
          console.log(
            `[Line ${i}] Created beat from metadata: ID=${currentBeat.id}, Title="${currentBeat.title}", Type=${currentBeat.typeId}`
          )
        }

        if (noteContent.startsWith('CUE:')) {
          const cueText = noteContent.substring(4).trim()
          currentCues = cueText.split(',').map(c => c.trim())
          // Add cues to current beat if it exists
          if (currentBeat) {
            currentBeat.cue = currentCues
            console.log(
              `[Line ${i}] Added ${currentCues.length} cues to beat (ID: ${currentBeat.id})`
            )
          }
        }
        continue
      }

      // Parse sections
      if (trimmed.startsWith('#')) {
        // Finish current beat if exists
        if (currentBeat) {
          // Add beat to current group before finalizing
          if (currentGroup && !currentGroup.beatIds.includes(currentBeat.id)) {
            currentGroup.beatIds.push(currentBeat.id)
          }
          newBeats.push(currentBeat)
          currentBeat = null
          currentMetadata = {}
          currentCues = []
          isInDialogue = false
        }

        const level = trimmed.match(/^#+/)?.[0].length || 0
        const name = trimmed.replace(/^#+\s*/, '')

        if (level === 1) {
          // Lane
          currentLane = {
            id: this.generateId('lane'),
            name,
            blockIds: [],
            position: { x: 0, y: newLanes.length * 100 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          newLanes.push(currentLane)
          currentBlock = null
          currentGroup = null
        } else if (level === 2) {
          // Block
          console.log(`[Line ${i}] Found Block: "${name}"`)
          currentBlock = {
            id: this.generateId('block'),
            name,
            groupIds: [],
            position: { x: 0, y: 0 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          newBlocks.push(currentBlock)
          console.log(`  -> Created Block with ID: ${currentBlock.id}`)
          if (currentLane) {
            currentLane.blockIds.push(currentBlock.id)
            console.log(`  -> Added to Lane: ${currentLane.name}`)
          } else {
            console.log(`  -> Orphan Block (no current Lane)`)
          }
          currentGroup = null
        } else if (level === 3) {
          // BeatGroup
          console.log(`[Line ${i}] Found BeatGroup: "${name}"`)
          currentGroup = {
            id: this.generateId('group'),
            name,
            beatIds: [],
            position: { x: 0, y: 0 },
            collapsed: false,
            order: newGroups.length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          newGroups.push(currentGroup)

          // Assign group to current block (will be overridden by BLOCK_ID metadata if present)
          if (currentBlock && !currentBlock.groupIds.includes(currentGroup.id)) {
            currentBlock.groupIds.push(currentGroup.id)
            console.log(
              `[Line ${i}] Assigned group "${currentGroup.name}" to current block "${currentBlock.name}"`
            )
          }
        }
        continue
      }

      // Scene heading (starts with INT, EXT, EST, I/E, or forced with .)
      const sceneMatch =
        trimmed.match(/^\.(.+)$/) ||
        (trimmed.match(/^(INT|EXT|EST|I\/E|INT\/EXT|INT\.?\/EXT\.?)[.\s]/i)
          ? [null, trimmed]
          : null)

      if (sceneMatch) {
        const scene = sceneMatch[1] || sceneMatch[0] || ''

        // If beat already exists (from metadata), just add scene
        if (currentBeat) {
          currentBeat.scene = scene || undefined
          console.log(
            `[Line ${i}] Added scene to existing beat: "${scene}" (ID: ${currentBeat.id})`
          )
        } else {
          // Create new beat from scene (for Fountain without metadata)
          currentBeat = this.createBeat(currentMetadata)
          currentBeat.scene = scene || undefined
          console.log(`[Line ${i}] Created beat from scene: "${scene}" (ID: ${currentBeat.id})`)
          if (currentCues.length > 0) {
            currentBeat.cue = currentCues
          }
        }
        continue
      }

      // Character (all UPPERCASE, not ending in TO:)
      if (
        trimmed === trimmed.toUpperCase() &&
        trimmed.length > 0 &&
        !trimmed.endsWith('TO:') &&
        !/^(INT|EXT|EST|I\/E|INT\.|EXT\.)/.test(trimmed)
      ) {
        // This might be a character
        isInDialogue = true

        if (!currentBeat) {
          // Create beat if it doesn't exist (for Fountain without metadata)
          currentBeat = this.createBeat(currentMetadata)
          console.log(
            `[Line ${i}] Created beat from character: "${trimmed}" (ID: ${currentBeat.id})`
          )
          if (currentCues.length > 0) {
            currentBeat.cue = currentCues
          }
        } else {
          console.log(
            `[Line ${i}] Added character to existing beat: "${trimmed}" (ID: ${currentBeat.id})`
          )
        }
        currentBeat.character = trimmed
        continue
      }

      // Dialogue or Action
      if (isInDialogue && currentBeat && currentBeat.character) {
        // Dialogue line
        if (currentBeat.description) {
          currentBeat.description += '\n' + trimmed
        } else {
          currentBeat.description = trimmed
        }
      } else {
        // Action
        if (!currentBeat) {
          // Create beat if it doesn't exist (for Fountain without metadata)
          currentBeat = this.createBeat(currentMetadata)
          console.log(
            `[Line ${i}] Created beat from action: "${trimmed.substring(0, 30)}..." (ID: ${currentBeat.id})`
          )
          if (currentCues.length > 0) {
            currentBeat.cue = currentCues
          }
        }
        // Add description to beat (whether it was created from metadata or action)
        if (currentBeat.description) {
          currentBeat.description += '\n' + trimmed
        } else {
          currentBeat.description = trimmed
          console.log(`[Line ${i}] Added description to beat (ID: ${currentBeat.id})`)
        }
      }
    }

    // Add last beat
    if (currentBeat) {
      if (currentGroup && !currentGroup.beatIds.includes(currentBeat.id)) {
        currentGroup.beatIds.push(currentBeat.id)
      }
      newBeats.push(currentBeat)
    }

    const updatedProject = {
      ...baseProject,
      beats: newBeats,
      beatGroups: newGroups,
      blocks: newBlocks,
      lanes: newLanes,
      updatedAt: new Date().toISOString()
    }

    // Debug summary
    console.log('\n=== PARSING SUMMARY ===')
    console.log(`Total beats created: ${newBeats.length}`)
    console.log(`Total groups created: ${newGroups.length}`)
    console.log(`Total blocks created: ${newBlocks.length}`)
    console.log(`Total lanes created: ${newLanes.length}`)
    console.log('\nBeats per group:')
    newGroups.forEach((group, idx) => {
      console.log(`  ${idx + 1}. "${group.name}": ${group.beatIds.length} beats`)
    })
    console.log('\nGroups per block:')
    newBlocks.forEach((block, idx) => {
      console.log(`  ${idx + 1}. "${block.name}": ${block.groupIds.length} groups`)
    })
    console.log('\nBlocks per lane:')
    newLanes.forEach((lane, idx) => {
      console.log(`  ${idx + 1}. "${lane.name}": ${lane.blockIds.length} blocks`)
      lane.blockIds.forEach(blockId => {
        const block = newBlocks.find(b => b.id === blockId)
        console.log(`     - Block ID: ${blockId}, Name: "${block?.name || 'NOT FOUND'}"`)
      })
    })
    const orphans = newBeats.filter(b => !newGroups.some(g => g.beatIds.includes(b.id)))
    console.log(`\nOrphan beats (not in any group): ${orphans.length}`)
    if (orphans.length > 0) {
      orphans.forEach(b => {
        console.log(
          `  - Beat ${b.id}: scene="${b.scene}", char="${b.character}", desc="${b.description?.substring(0, 30)}..."`
        )
      })
    }
    console.log('======================\n')

    // Calculate automatic layout based on hierarchy
    calculateHierarchyLayout(updatedProject)

    return updatedProject
  }

  private static createBeat(metadata: Record<string, string>): Beat {
    const now = new Date().toISOString()
    return {
      id: metadata.BEAT_ID || this.generateId('beat'),
      title: metadata.TITLE || '',
      description: '',
      typeId: metadata.TYPE || 'news',
      order: 0,
      position: { x: 0, y: 0 },
      links: [],
      eventDuration: metadata.DURATION,
      eventStartTime: metadata.START,
      assets: metadata.ASSETS ? metadata.ASSETS.split(',').map(a => a.trim()) : undefined,
      createdAt: now,
      updatedAt: now
    }
  }

  private static generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}
