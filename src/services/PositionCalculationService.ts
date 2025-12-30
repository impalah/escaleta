import type { Beat, BeatGroup, Position, Project } from '@/domain/entities'
import { projectService } from '@/application/ProjectService'

/**
 * Service for calculating positions of beats within groups
 */
export class PositionCalculationService {
  private static readonly GROUP_HEADER_HEIGHT = 50
  private static readonly BEAT_HEIGHT = 80
  private static readonly GAP = 10

  /**
   * Get absolute position of a beat (accounting for group container)
   */
  getAbsoluteBeatPosition(beat: Beat, project: Project): Position {
    const parentGroup = projectService.getGroupForBeat(project, beat.id)

    if (!parentGroup) {
      // Beat is standalone
      return beat.position
    }

    // Beat is inside a group - position is already absolute on canvas
    return beat.position
  }

  /**
   * Get absolute position of a group
   */
  getAbsoluteGroupPosition(group: BeatGroup): Position {
    // Groups are always at their absolute position
    return group.position
  }

  /**
   * Calculate the position of a beat within its group
   */
  calculateBeatPositionInGroup(group: BeatGroup, beatIndex: number): Position {
    const beatY =
      group.position.y +
      PositionCalculationService.GROUP_HEADER_HEIGHT +
      PositionCalculationService.GAP +
      beatIndex * (PositionCalculationService.BEAT_HEIGHT + PositionCalculationService.GAP)

    return {
      x: group.position.x,
      y: beatY
    }
  }
}

export const positionCalculationService = new PositionCalculationService()
