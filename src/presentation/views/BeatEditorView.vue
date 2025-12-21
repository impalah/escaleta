<template>
  <v-container
    fluid
    class="pa-0 fill-height"
  >
    <!-- App Bar -->
    <AppToolbar
      :project-name="project.name"
      :show-zoom-controls="true"
      @new-project="handleNewProject"
      @save="handleSave"
      @export-json="handleExportJSON"
      @export-script="handleExportScript"
      @zoom-in="handleZoomIn"
      @zoom-out="handleZoomOut"
      @change-language="changeLanguage"
      @add-beat="showNewBeatDialog = true"
      @create-group="handleCreateGroup"
    />

    <!-- Beat Canvas -->
    <v-sheet 
      class="beat-canvas-container"
      :style="{ cursor: isPanning ? 'grabbing' : 'grab' }"
      @mousedown="handleCanvasMouseDown"
      @mousemove="handleCanvasMouseMove"
      @mouseup="handleCanvasMouseUp"
      @mouseleave="handleCanvasMouseUp"
      @touchstart="handleCanvasTouchStart"
      @touchmove="handleCanvasTouchMove"
      @touchend="handleCanvasTouchEnd"
      @touchcancel="handleCanvasTouchEnd"
    >
      <div
        ref="canvasRef"
        class="beat-canvas"
        :style="{ 
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`, 
          transformOrigin: 'top left' 
        }"
      >
        <!-- Lane Cards (rendered first, behind blocks) -->
        <LaneCard
          v-for="lane in project.lanes || []"
          :key="lane.id"
          :lane="lane"
          :lane-width="getLaneWidth(lane)"
          :zoom="zoom"
          :z-index="getOrAssignZIndex(lane.id, isDraggingLane && draggingLaneId === lane.id)"
          @click="selectLane(lane)"
          @dragstart="handleLaneDragStart"
          @dragmove="handleLaneDragMove"
          @dragend="handleLaneDragEnd"
          @delete="handleDeleteLane"
        />

        <!-- Block Cards (rendered after lanes, behind groups) -->
        <BlockCard
          v-for="block in project.blocks || []"
          :key="block.id"
          :block="block"
          :block-width="projectService.getBlockWidth(block)"
          :zoom="zoom"
          :is-hovered="hoveredBlockId === block.id"
          :z-index="getOrAssignZIndex(block.id, isDraggingBlock && draggingBlockId === block.id)"
          :groups="getGroupsInBlock(block.id)"
          :beats="project.beats"
          @click="selectBlock(block)"
          @dragstart="handleBlockDragStart"
          @dragmove="handleBlockDragMove"
          @dragend="handleBlockDragEnd"
          @delete="handleDeleteBlock"
        />

        <!-- Beat Group Cards -->
        <BeatGroupCard
          v-for="group in project.beatGroups"
          :key="group.id"
          :group="group"
          :zoom="zoom"
          :is-hovered="hoveredGroupId === group.id"
          :z-index="getOrAssignZIndex(group.id, isDraggingGroup && draggingGroupId === group.id)"
          @click="selectGroup"
          @dragstart="handleGroupDragStart"
          @dragmove="handleGroupDragMove"
          @dragend="handleGroupDragEnd"
          @delete="handleDeleteGroup"
        />

        <!-- Beat Cards that belong to groups -->
        <template
          v-for="group in project.beatGroups"
          :key="`group-${group.id}-beats-container`"
        >
          <BeatCard
            v-for="beatId in group.beatIds"
            :key="`beat-${beatId}`"
            :beat="project.beats.find(b => b.id === beatId)!"
            :beat-type="getBeatType(project.beats.find(b => b.id === beatId)!.typeId)"
            :is-group-dragging="isDraggingGroup"
            :is-hovered="hoveredBeatId === beatId"
            :is-in-group="true"
            :z-index="
              isDraggingBeat && draggingBeatId === beatId
                ? getOrAssignZIndex(beatId, true)
                : getGroupZIndex(beatId) ?? getOrAssignZIndex(beatId, false)
            "
            @click="selectBeat(project.beats.find(b => b.id === beatId)!)"
            @dragstart="handleBeatDragStart"
            @dragmove="handleBeatDragMove"
            @dragend="handleBeatDragEnd"
            @delete="handleDeleteBeat"
          />
        </template>

        <!-- Beat Cards NOT in groups -->
        <BeatCard
          v-for="beat in project.beats.filter(b => !projectService.belongsToBeatGroup(project, b.id))"
          :key="beat.id"
          :beat="beat"
          :beat-type="getBeatType(beat.typeId)"
          :is-group-dragging="isDraggingGroup"
          :is-hovered="hoveredBeatId === beat.id"
          :is-in-group="false"
          :z-index="
            isDraggingBeat && draggingBeatId === beat.id
              ? getOrAssignZIndex(beat.id, true)
              : getOrAssignZIndex(beat.id, false)
          "
          @click="selectBeat(beat)"
          @dragstart="handleBeatDragStart"
          @dragmove="handleBeatDragMove"
          @dragend="handleBeatDragEnd"
          @delete="handleDeleteBeat"
        />
      </div>
    </v-sheet>

    <!-- Properties Panel -->
    <PropertiesPanel
      :title="getPanelTitle()"
      orientation="vertical"
    >
      <template #content>
        <ProjectPropertiesForm 
          v-if="selectedEntity?.type === 'project'"
          :project="selectedEntity.data as Project"
          @update="handleProjectUpdate"
        />
        <BeatPropertiesForm 
          v-else-if="selectedEntity?.type === 'beat'"
          :beat="selectedEntity.data as Beat"
          :beat-types="project.beatTypes"
          @update="handleBeatUpdate"
        />
        <GroupPropertiesForm
          v-else-if="selectedEntity?.type === 'group'"
          :group="selectedEntity.data as BeatGroup"
          @update="handleGroupUpdate"
        />
        <BlockPropertiesForm
          v-else-if="selectedEntity?.type === 'block'"
          :block="selectedEntity.data as Block"
          @update="handleBlockUpdate"
        />
        <LanePropertiesForm
          v-else-if="selectedEntity?.type === 'lane'"
          :lane="selectedEntity.data as Lane"
          @update="handleLaneUpdate"
        />
        <div
          v-else
          class="empty-state"
        >
          <v-icon
            size="64"
            color="grey-lighten-1"
          >
            mdi-information-outline
          </v-icon>
          <p class="text-grey">
            Selecciona un elemento para editar sus propiedades
          </p>
        </div>
      </template>
    </PropertiesPanel>

    <!-- New Beat Dialog -->
    <BeatTypeSelectDialog
      v-model="showNewBeatDialog"
      :beat-types="project.beatTypes"
      @select="handleCreateBeat"
    />
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLanguage } from '@/i18n'
import type { Beat, BeatType, Project, BeatGroup, Block, Lane } from '@/domain/entities'
import { projectService } from '@/application/ProjectService'
import { dragAndDropService } from '@/services/DragAndDropService'
import { positionCalculationService } from '@/services/PositionCalculationService'
import AppToolbar from '@/presentation/components/AppToolbar.vue'
import BeatCard from '@/presentation/components/BeatCard.vue'
import BeatGroupCard from '@/presentation/components/BeatGroupCard.vue'
import BlockCard from '@/presentation/components/BlockCard.vue'
import LaneCard from '@/presentation/components/LaneCard.vue'
import PropertiesPanel from '@/presentation/components/PropertiesPanel.vue'
import ProjectPropertiesForm from '@/presentation/components/ProjectPropertiesForm.vue'
import BeatPropertiesForm from '@/presentation/components/BeatPropertiesForm.vue'
import GroupPropertiesForm from '@/presentation/components/GroupPropertiesForm.vue'
import BlockPropertiesForm from '@/presentation/components/BlockPropertiesForm.vue'
import LanePropertiesForm from '@/presentation/components/LanePropertiesForm.vue'
// @ts-expect-error - Dialog reserved for beat creation feature
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import BeatTypeSelectDialog from '@/presentation/components/BeatTypeSelectDialog.vue'

const { t } = useI18n()

const project = ref<Project>(projectService.loadCurrentProject())

// Zoom state with persistence
const ZOOM_KEY = 'escaleta-canvas-zoom'
const savedZoom = localStorage.getItem(ZOOM_KEY)
const zoom = ref(savedZoom ? parseFloat(savedZoom) : 1)

const showNewBeatDialog = ref(false)
const canvasRef = ref<HTMLElement | null>(null)

// Selected entity for properties panel
interface SelectedEntity {
  type: 'project' | 'beat' | 'group' | 'block' | 'lane'
  data: Project | Beat | BeatGroup | Block | Lane
}
const selectedEntity = ref<SelectedEntity | null>({
  type: 'project',
  data: project.value
})

// Pan state for canvas dragging
const isPanning = ref(false)
const PAN_OFFSET_KEY = 'escaleta-canvas-pan-offset'
const savedPanOffset = localStorage.getItem(PAN_OFFSET_KEY)
const panOffset = ref(savedPanOffset ? JSON.parse(savedPanOffset) : { x: 0, y: 0 })
const panStart = ref({ x: 0, y: 0 })
const lastPanOffset = ref({ x: 0, y: 0 })
const canvasTouchIdentifier = ref<number | null>(null)

// Beat drag state
const isDraggingBeat = ref(false)
const draggingBeatId = ref<string | null>(null)
const beatDragStartPosition = ref({ x: 0, y: 0 })

// Group drag state
const isDraggingGroup = ref(false)
const draggingGroupId = ref<string | null>(null)
const groupDragStartPosition = ref({ x: 0, y: 0 })

// Block drag state
const isDraggingBlock = ref(false)
const draggingBlockId = ref<string | null>(null)
const blockDragStartPosition = ref({ x: 0, y: 0 })

// Lane drag state
const isDraggingLane = ref(false)
const draggingLaneId = ref<string | null>(null)
const laneDragStartPosition = ref({ x: 0, y: 0 })

// Beat-to-Group hover state (for highlighting groups during beat drag)
const hoveredGroupId = ref<string | null>(null)

// Beat-to-Beat hover state (for highlighting beats in groups during beat drag)
const hoveredBeatId = ref<string | null>(null)

// Block hover state (for highlighting blocks during block drag)
const hoveredBlockId = ref<string | null>(null)

// Z-index stack management
// Blocks: base 1, Beats/Groups: dynamic (1000+), Dragging: max + 10000
const elementZIndexMap = ref<Map<string, number>>(new Map())

// Constants
// _BEAT_HEIGHT is reserved for beat height calculations (80px to match ProjectService)

// _sortedBeats computed property reserved for future sorting feature

// Watch panOffset and persist changes
watch(panOffset, (newOffset) => {
  localStorage.setItem(PAN_OFFSET_KEY, JSON.stringify(newOffset))
}, { deep: true })

// Watch zoom and persist changes
watch(zoom, (newZoom) => {
  localStorage.setItem(ZOOM_KEY, newZoom.toString())
})

onMounted(() => {
  // Project is already loaded in ref initialization
  console.log('Loaded project:', project.value.name)
})

function getBeatType(typeId: string): BeatType | undefined {
  return project.value.beatTypes.find(t => t.id === typeId)
}

function getOrAssignZIndex(elementId: string, isDragging: boolean): number {
  // If dragging, return max existing z-index + 10000
  if (isDragging) {
    const maxZIndex = Math.max(0, ...Array.from(elementZIndexMap.value.values()))
    return maxZIndex + 10000
  }
  
  // Get existing z-index or assign a new one
  if (!elementZIndexMap.value.has(elementId)) {
    // Find the current maximum z-index to ensure new elements are on top
    const maxZIndex = Math.max(999, ...Array.from(elementZIndexMap.value.values()))
    elementZIndexMap.value.set(elementId, maxZIndex + 1)
  }
  
  return elementZIndexMap.value.get(elementId)!
}

function bringToFront(elementId: string) {
  // Find the current maximum z-index and assign a higher one
  const maxZIndex = Math.max(999, ...Array.from(elementZIndexMap.value.values()))
  elementZIndexMap.value.set(elementId, maxZIndex + 1)
  
  console.log(`Brought ${elementId} to front with z-index: ${maxZIndex + 1}`)
}

function getGroupZIndex(beatId: string): number | undefined {
  const group = projectService.getGroupForBeat(project.value, beatId)
  if (!group) {
    return undefined
  }
  
  // Return the group's z-index so beats inherit it
  return getOrAssignZIndex(group.id, false)
}

function selectBeat(beat: Beat) {
  selectedEntity.value = {
    type: 'beat',
    data: beat
  }
}

function selectProject() {
  selectedEntity.value = {
    type: 'project',
    data: project.value
  }
}

function getPanelTitle(): string {
  if (!selectedEntity.value) return t('propertiesPanel.project').toUpperCase()
  
  if (selectedEntity.value.type === 'project') {
    const projectData = selectedEntity.value.data as Project
    return `${t('propertiesPanel.project').toUpperCase()} - ${projectData.name}`
  } else if (selectedEntity.value.type === 'beat') {
    const beatData = selectedEntity.value.data as Beat
    return `BEAT - ${beatData.title}`
  } else if (selectedEntity.value.type === 'group') {
    const groupData = selectedEntity.value.data as BeatGroup
    return `${t('propertiesPanel.group').toUpperCase()} - ${groupData.name}`
  } else if (selectedEntity.value.type === 'block') {
    const blockData = selectedEntity.value.data as Block
    return `BLOCK - ${blockData.name}`
  } else if (selectedEntity.value.type === 'lane') {
    const laneData = selectedEntity.value.data as Lane
    return `LANE - ${laneData.name}`
  }
  
  return t('propertiesPanel.project').toUpperCase()
}

function handleProjectUpdate(updatedProject: Project) {
  project.value = updatedProject
  projectService.saveCurrentProject(project.value)
  if (selectedEntity.value?.type === 'project') {
    selectedEntity.value.data = updatedProject
  }
}

function handleBeatUpdate(updatedBeat: Beat) {
  project.value = projectService.updateBeat(project.value, updatedBeat.id, updatedBeat)
  projectService.saveCurrentProject(project.value)
  // Update selected entity to reflect changes
  if (selectedEntity.value?.type === 'beat') {
    selectedEntity.value.data = updatedBeat
  }
}

// @ts-expect-error - Handler for beat creation
function handleCreateBeat(_typeId: string) {
  const newBeat = projectService.createBeat(_typeId, project.value)
  project.value = {
    ...project.value,
    beats: [...project.value.beats, newBeat],
    updatedAt: new Date().toISOString()
  }
  projectService.saveCurrentProject(project.value)

  showNewBeatDialog.value = false
}

function handleSave() {
  projectService.saveCurrentProject(project.value)
  console.log('Project saved')
  // TODO: Show success notification
}

function handleNewProject() {
  // Confirm if user wants to discard current project
  if (!confirm(t('toolbar.newProjectConfirm') || 'Create new project? Current work will be lost.')) {
    return
  }
  
  // Create new empty project
  const projectName = prompt('Enter project name', 'New Project')
  if (!projectName) return
  
  const newProject = projectService.createNewProject(projectName, '')
  project.value = newProject
  
  // Clear localStorage and save new empty project
  projectService.saveCurrentProject(newProject)
  
  // Reset selected entity to project
  selectedEntity.value = {
    type: 'project',
    data: newProject
  }
  
  console.log('New project created')
}

function handleExportJSON() {
  // TODO: Implement JSON export
  console.log('TODO: Export to JSON')
}

function handleExportScript() {
  // TODO: Implement script export
  console.log('TODO: Export to Script')
}

function changeLanguage(locale: string) {
  setLanguage(locale)
}

function handleCreateGroup() {
  const groupName = prompt(t('toolbar.createGroup'), 'New Group')
  if (!groupName) return
  
  const newGroup = projectService.createBeatGroup(project.value, groupName)
  project.value = projectService.addBeatGroup(project.value, newGroup)
  projectService.saveCurrentProject(project.value)
  
  console.log('Group created:', newGroup.name)
}

function handleZoomIn() {
  zoom.value = Math.min(zoom.value + 0.1, 2)
}

function handleZoomOut() {
  zoom.value = Math.max(zoom.value - 0.1, 0.5)
}

// Canvas panning handlers
function handleCanvasMouseDown(event: MouseEvent) {
  // Don't pan if dragging a beat or group
  if (isDraggingBeat.value || isDraggingGroup.value) return
  
  const target = event.target as HTMLElement
  if (target.closest('[data-testid="beat-card"]') || target.closest('[data-group-id]')) {
    return // Clicked on a beat card or group card, don't pan
  }

  // Clicking on empty canvas shows project properties
  selectProject()

  isPanning.value = true
  panStart.value = { x: event.clientX, y: event.clientY }
  lastPanOffset.value = { ...panOffset.value }
}

function handleCanvasMouseMove(event: MouseEvent) {
  if (!isPanning.value) return

  const deltaX = event.clientX - panStart.value.x
  const deltaY = event.clientY - panStart.value.y

  panOffset.value = {
    x: lastPanOffset.value.x + deltaX,
    y: lastPanOffset.value.y + deltaY
  }
}

function handleCanvasMouseUp() {
  isPanning.value = false
}

// Touch event handlers for canvas panning on mobile
function handleCanvasTouchStart(event: TouchEvent) {
  // Only start panning if touching the canvas background (not a beat card)
  const target = event.target as HTMLElement
  if (target.closest('.beat-card-wrapper')) {
    // Let beat handle its own touch events
    return
  }
  
  const touch = event.touches[0]
  if (!touch) return
  
  canvasTouchIdentifier.value = touch.identifier
  isPanning.value = true
  panStart.value = { x: touch.clientX, y: touch.clientY }
  lastPanOffset.value = { ...panOffset.value }
}

function handleCanvasTouchMove(event: TouchEvent) {
  if (!isPanning.value || canvasTouchIdentifier.value === null) return
  
  // Prevent default to avoid scrolling
  event.preventDefault()
  
  // Find the touch that matches our identifier
  const touch = Array.from(event.touches).find(t => t.identifier === canvasTouchIdentifier.value)
  if (!touch) return
  
  const deltaX = touch.clientX - panStart.value.x
  const deltaY = touch.clientY - panStart.value.y
  
  panOffset.value = {
    x: lastPanOffset.value.x + deltaX,
    y: lastPanOffset.value.y + deltaY
  }
}

function handleCanvasTouchEnd(event: TouchEvent) {
  if (!isPanning.value || canvasTouchIdentifier.value === null) return
  
  // Check if our touch ended
  const touchEnded = !Array.from(event.touches).some(t => t.identifier === canvasTouchIdentifier.value)
  
  if (touchEnded) {
    isPanning.value = false
    canvasTouchIdentifier.value = null
  }
}

// Beat drag handlers
function handleBeatDragStart(beatId: string) {
  isDraggingBeat.value = true
  draggingBeatId.value = beatId
  
  const { project: updatedProject, startPosition } = dragAndDropService.handleBeatDragStart(project.value, beatId)
  project.value = updatedProject
  beatDragStartPosition.value = startPosition
}

function handleBeatDragMove(beatId: string, deltaX: number, deltaY: number) {
  if (!isDraggingBeat.value || draggingBeatId.value !== beatId) return
  
  // Calculate deltas accounting for zoom
  const deltaXScaled = deltaX / zoom.value
  const deltaYScaled = deltaY / zoom.value
  
  // Update beat position using service
  project.value = dragAndDropService.handleBeatDragMove(
    project.value,
    beatId,
    beatDragStartPosition.value,
    deltaXScaled,
    deltaYScaled
  )
  
  // Update start position for next delta
  beatDragStartPosition.value = {
    x: beatDragStartPosition.value.x + deltaXScaled,
    y: beatDragStartPosition.value.y + deltaYScaled
  }
  
  // Detect hover for groups (for visual feedback)
  const beat = project.value.beats.find(b => b.id === beatId)
  if (beat) {
    detectGroupHover(beat.position.x, beat.position.y)
  }
}

function handleBeatDragEnd(beatId: string) {
  if (!isDraggingBeat.value || draggingBeatId.value !== beatId) return
  
  // Use service to handle drag end logic
  project.value = dragAndDropService.handleBeatDragEnd(
    project.value,
    beatId,
    hoveredGroupId.value,
    hoveredBeatId.value
  )
  
  // Clear drag state
  isDraggingBeat.value = false
  draggingBeatId.value = null
  hoveredBeatId.value = null
  hoveredGroupId.value = null
  
  // Save project
  projectService.saveCurrentProject(project.value)
}

// Group drag handlers
function handleGroupDragStart(groupId: string) {
  isDraggingGroup.value = true
  draggingGroupId.value = groupId
  
  const group = project.value.beatGroups.find(g => g.id === groupId)
  if (!group) return
  
  groupDragStartPosition.value = { ...group.position }
  
  // Bring group to front when starting to drag
  bringToFront(groupId)
  
  console.log('Group drag started:', group.name)
}

function handleGroupDragMove(groupId: string, deltaX: number, deltaY: number) {
  if (!isDraggingGroup.value || draggingGroupId.value !== groupId) return
  
  const group = project.value.beatGroups.find(g => g.id === groupId)
  if (!group) return
  
  // Calculate new position accounting for zoom
  const deltaXScaled = deltaX / zoom.value
  const deltaYScaled = deltaY / zoom.value
  
  // Add delta to current position (not start position)
  const newX = group.position.x + deltaXScaled
  const newY = group.position.y + deltaYScaled
  
  // Update group position
  project.value = projectService.updateBeatGroup(project.value, groupId, {
    position: { x: newX, y: newY }
  })
  
  // Move all beats in the group by the same delta
  if (group.beatIds.length > 0) {
    project.value = {
      ...project.value,
      beats: project.value.beats.map(beat => {
        if (group.beatIds.includes(beat.id)) {
          return {
            ...beat,
            position: {
              x: beat.position.x + deltaXScaled,
              y: beat.position.y + deltaYScaled
            },
            updatedAt: new Date().toISOString()
          }
        }
        return beat
      })
    }
  }
  
  // Detect if dragged group is over another group (for block creation)
  detectGroupToGroupHover(newX, newY, groupId)
}

function handleGroupDragEnd(groupId: string) {
  if (!isDraggingGroup.value || draggingGroupId.value !== groupId) return
  
  // Use dragAndDropService to handle block creation/update logic
  project.value = dragAndDropService.handleGroupDragEnd(
    project.value,
    groupId,
    hoveredGroupId.value
  )
  
  isDraggingGroup.value = false
  draggingGroupId.value = null
  hoveredGroupId.value = null
  
  // Save project with updated group position and block relationships
  projectService.saveCurrentProject(project.value)
  console.log('Group position saved')
}

// Detect if dragged beat is over a BeatGroup or Beat in group
function detectGroupHover(beatX: number, beatY: number) {
  const BEAT_WIDTH = 424 // 400px + 12px padding left + 12px padding right (v-card-text pa-3)
  const BEAT_HEIGHT = 80
  const GROUP_WIDTH = 424 // Same as BEAT_WIDTH
  const GROUP_HEIGHT = 50
  
  // Center points reserved for future precise collision detection
  // _beatCenterX = beatX + BEAT_WIDTH / 2
  // _beatCenterY = beatY + BEAT_HEIGHT / 2
  
  // For overlap detection with other beats/groups, use smaller overlap threshold (30% instead of 1px)
  const OVERLAP_THRESHOLD = 0.3
  const beatLeft = beatX
  const beatRight = beatX + BEAT_WIDTH
  const beatTop = beatY
  const beatBottom = beatY + BEAT_HEIGHT
  
  // Don't highlight beats if we're dragging the entire group
  if (isDraggingGroup.value) {
    hoveredBeatId.value = null
    hoveredGroupId.value = null
    return
  }
  
  // First check if beat is over ANY beat in ANY group
  for (const group of project.value.beatGroups) {
    if (group.beatIds.length === 0) continue
    
    for (const beatId of group.beatIds) {
      // Skip if this is the beat being dragged
      if (beatId === draggingBeatId.value) continue
      
      const groupBeat = project.value.beats.find((b: Beat) => b.id === beatId)
      if (!groupBeat) continue
      
      // FIX: Use absolute position (accounts for parent block)
      const absolutePos = positionCalculationService.getAbsoluteBeatPosition(groupBeat, project.value)
      const groupBeatLeft = absolutePos.x
      const groupBeatRight = absolutePos.x + BEAT_WIDTH
      const groupBeatTop = absolutePos.y
      const groupBeatBottom = absolutePos.y + BEAT_HEIGHT
      
      // Calculate overlap area to require significant overlap (not just 1px)
      const overlapWidth = Math.min(beatRight, groupBeatRight) - Math.max(beatLeft, groupBeatLeft)
      const overlapHeight = Math.min(beatBottom, groupBeatBottom) - Math.max(beatTop, groupBeatTop)
      const hasOverlapWithBeat = (
        overlapWidth > 0 && overlapHeight > 0 &&
        (overlapWidth * overlapHeight) > (BEAT_WIDTH * BEAT_HEIGHT * OVERLAP_THRESHOLD)
      )
      
      if (hasOverlapWithBeat) {
        // We're over a beat in the group - highlight it!
        hoveredBeatId.value = beatId
        hoveredGroupId.value = null
        return
      }
    }
  }
  
  // Check collision with each BeatGroup header (only if not colliding with beats)
  for (const group of project.value.beatGroups) {
    // Skip if dragging the group itself
    if (isDraggingGroup.value && draggingGroupId.value === group.id) continue
    
    // FIX: Use absolute position (accounts for parent block)
    const absolutePos = positionCalculationService.getAbsoluteGroupPosition(group)
    const groupLeft = absolutePos.x
    const groupRight = absolutePos.x + GROUP_WIDTH
    const groupTop = absolutePos.y
    const groupBottom = absolutePos.y + GROUP_HEIGHT
    
    // Check if there's overlap with the header ONLY - require significant overlap
    const overlapWidth = Math.min(beatRight, groupRight) - Math.max(beatLeft, groupLeft)
    const overlapHeight = Math.min(beatBottom, groupBottom) - Math.max(beatTop, groupTop)
    const hasOverlap = (
      overlapWidth > 0 && overlapHeight > 0 &&
      (overlapWidth * overlapHeight) > (GROUP_WIDTH * GROUP_HEIGHT * OVERLAP_THRESHOLD)
    )
    
    if (hasOverlap) {
      hoveredGroupId.value = group.id
      hoveredBeatId.value = null
      return
    }
  }
  
  // No collision found
  hoveredGroupId.value = null
  hoveredBeatId.value = null
}

/**
 * Detect if a dragging BeatGroup collides with another BeatGroup (for block creation)
 */
function detectGroupToGroupHover(groupX: number, groupY: number, draggingGroupId: string) {
  const GROUP_WIDTH = 424
  const GROUP_HEIGHT = 50
  const OVERLAP_THRESHOLD = 0.3
  
  const groupLeft = groupX
  const groupRight = groupX + GROUP_WIDTH
  const groupTop = groupY
  const groupBottom = groupY + GROUP_HEIGHT
  
  // Check collision with other groups (not the one being dragged)
  for (const group of project.value.beatGroups) {
    if (group.id === draggingGroupId) continue
    
    const otherLeft = group.position.x
    const otherRight = group.position.x + GROUP_WIDTH
    const otherTop = group.position.y
    const otherBottom = group.position.y + GROUP_HEIGHT
    
    // Calculate overlap
    const overlapWidth = Math.min(groupRight, otherRight) - Math.max(groupLeft, otherLeft)
    const overlapHeight = Math.min(groupBottom, otherBottom) - Math.max(groupTop, otherTop)
    
    const hasOverlap = (
      overlapWidth > 0 && overlapHeight > 0 &&
      (overlapWidth * overlapHeight) > (GROUP_WIDTH * GROUP_HEIGHT * OVERLAP_THRESHOLD)
    )
    
    if (hasOverlap) {
      hoveredGroupId.value = group.id
      return
    }
  }
  
  // No collision found
  hoveredGroupId.value = null
}

/**
 * Detect if a dragging Block collides with another Block
 */
function detectBlockToBlockHover(blockX: number, blockY: number, draggingBlockId: string) {
  const OVERLAP_THRESHOLD = 0.3
  const BLOCK_HEADER_HEIGHT = 50
  const GROUP_HEIGHT = 50
  const BEAT_HEIGHT = 80
  const BLOCK_PADDING = 15
  
  // Get the dragging block to calculate its full dimensions (including content)
  const draggingBlock = project.value.blocks?.find(b => b.id === draggingBlockId)
  if (!draggingBlock) return
  
  // Calculate full bounds of dragging block
  const draggingBounds = calculateBlockBounds(draggingBlock, blockX, blockY)
  
  const blockLeft = draggingBounds.left
  const blockRight = draggingBounds.right
  const blockTop = draggingBounds.top
  const blockBottom = draggingBounds.bottom
  const blockArea = draggingBounds.width * draggingBounds.height
  
  // Check collision with other blocks (not the one being dragged)
  for (const block of project.value.blocks || []) {
    if (block.id === draggingBlockId) continue
    
    // Calculate full bounds of target block
    const targetBounds = calculateBlockBounds(block, block.position.x, block.position.y)
    
    const otherLeft = targetBounds.left
    const otherRight = targetBounds.right
    const otherTop = targetBounds.top
    const otherBottom = targetBounds.bottom
    
    // Calculate overlap
    const overlapWidth = Math.min(blockRight, otherRight) - Math.max(blockLeft, otherLeft)
    const overlapHeight = Math.min(blockBottom, otherBottom) - Math.max(blockTop, otherTop)
    
    const hasOverlap = (
      overlapWidth > 0 && overlapHeight > 0 &&
      (overlapWidth * overlapHeight) > (blockArea * OVERLAP_THRESHOLD)
    )
    
    if (hasOverlap) {
      hoveredBlockId.value = block.id
      return
    }
  }
  
  // No collision found
  hoveredBlockId.value = null
  
  /**
   * Calculate full bounds of a block including all its content
   */
  function calculateBlockBounds(block: Block, x: number, y: number) {
    const groups = project.value.beatGroups.filter(g => block.groupIds.includes(g.id))
    
    if (groups.length === 0) {
      // Block without groups - only header
      return {
        left: x,
        right: x + projectService.getBlockWidth(block),
        top: y,
        bottom: y + BLOCK_HEADER_HEIGHT,
        width: projectService.getBlockWidth(block),
        height: BLOCK_HEADER_HEIGHT
      }
    }
    
    // Find bounds of all groups and their beats
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    
    groups.forEach(group => {
      const groupX = group.position.x
      const groupY = group.position.y
      const groupWidth = 424 // GROUP_WIDTH
      
      minX = Math.min(minX, groupX)
      maxX = Math.max(maxX, groupX + groupWidth)
      minY = Math.min(minY, groupY)
      maxY = Math.max(maxY, groupY + GROUP_HEIGHT)
      
      // Beats of this group
      const groupBeats = project.value.beats.filter(b => group.beatIds.includes(b.id))
      groupBeats.forEach(beat => {
        const beatX = beat.position.x
        const beatY = beat.position.y
        const beatWidth = 200 // BEAT_WIDTH
        
        minX = Math.min(minX, beatX)
        maxX = Math.max(maxX, beatX + beatWidth)
        minY = Math.min(minY, beatY)
        maxY = Math.max(maxY, beatY + BEAT_HEIGHT)
      })
    })
    
    // Background must encompass from header to last element
    const blockHeaderY = y
    minY = Math.min(minY, blockHeaderY + BLOCK_HEADER_HEIGHT)
    
    const width = (maxX - minX) + (BLOCK_PADDING * 2)
    const height = (maxY - blockHeaderY) + BLOCK_PADDING
    const offsetX = minX - x - BLOCK_PADDING
    
    return {
      left: x + offsetX,
      right: x + offsetX + width,
      top: y,
      bottom: y + height,
      width,
      height
    }
  }
}

/**
 * Check if a dragging BeatGroup collides with any Block
 */
// @ts-expect-error - Parameters temporarily unused during diagnostics


// Group editing handlers
function selectGroup(group: BeatGroup) {
  selectedEntity.value = {
    type: 'group',
    data: group
  }
  console.log('Group selected:', group.name)
}

// Block editing handlers
// @ts-expect-error - Handler for group updates
function handleGroupUpdate(updatedGroup: BeatGroup) {
  project.value = projectService.updateBeatGroup(project.value, updatedGroup.id, updatedGroup)
  projectService.saveCurrentProject(project.value)
  
  // Update selected entity with the new data
  if (selectedEntity.value?.type === 'group' && selectedEntity.value.data.id === updatedGroup.id) {
    selectedEntity.value = {
      type: 'group',
      data: updatedGroup
    }
  }
  console.log('Group updated:', updatedGroup.name)
}

// @ts-expect-error - Handler for block updates
function handleBlockUpdate(updatedBlock: Block) {
  project.value = projectService.updateBlock(project.value, updatedBlock.id, updatedBlock)
  projectService.saveCurrentProject(project.value)
  
  // Update selected entity with the new data
  if (selectedEntity.value?.type === 'block' && selectedEntity.value.data.id === updatedBlock.id) {
    selectedEntity.value = {
      type: 'block',
      data: updatedBlock
    }
  }
  console.log('Block updated:', updatedBlock.name)
}

// @ts-expect-error - Handler for lane updates
function handleLaneUpdate(updatedLane: Lane) {
  project.value = projectService.updateLane(project.value, updatedLane.id, updatedLane)
  projectService.saveCurrentProject(project.value)
  
  // Update selected entity with the new data
  if (selectedEntity.value?.type === 'lane' && selectedEntity.value.data.id === updatedLane.id) {
    selectedEntity.value = {
      type: 'lane',
      data: updatedLane
    }
  }
  console.log('Lane updated:', updatedLane.name)
}

// ============================================================
// Block Drag Handlers
// ============================================================

function handleBlockDragStart(blockId: string) {
  const result = dragAndDropService.handleBlockDragStart(project.value, blockId)
  
  isDraggingBlock.value = true
  draggingBlockId.value = blockId
  blockDragStartPosition.value = result.startPosition
  
  project.value = result.project
  console.log('Block drag started:', blockId)
}

function handleBlockDragMove(blockId: string, deltaX: number, deltaY: number) {
  if (!isDraggingBlock.value || draggingBlockId.value !== blockId) return
  
  // Calculate deltas accounting for zoom
  const deltaXScaled = deltaX / zoom.value
  const deltaYScaled = deltaY / zoom.value
  
  const result = dragAndDropService.handleBlockDragMove(
    project.value,
    blockId,
    blockDragStartPosition.value,
    deltaXScaled,
    deltaYScaled
  )
  
  project.value = result
  
  // Update start position for next delta
  blockDragStartPosition.value = {
    x: blockDragStartPosition.value.x + deltaXScaled,
    y: blockDragStartPosition.value.y + deltaYScaled
  }
  
  // Detect Block-to-Block collision
  const currentBlock = project.value.blocks?.find(b => b.id === blockId)
  if (currentBlock) {
    detectBlockToBlockHover(currentBlock.position.x, currentBlock.position.y, blockId)
  }
}

function handleBlockDragEnd(blockId: string) {
  if (!isDraggingBlock.value || draggingBlockId.value !== blockId) return
  
  const targetBlockId = hoveredBlockId.value
  
  project.value = dragAndDropService.handleBlockDragEnd(project.value, blockId)
  
  // Check if block was dropped on another block
  if (targetBlockId && targetBlockId !== blockId) {
    // Check if either block is already in a lane
    const draggingBlockLane = projectService.getLaneForBlock(project.value, blockId)
    const targetBlockLane = projectService.getLaneForBlock(project.value, targetBlockId)
    
    // Check if dragging block is NOT the first in its lane
    const isFirstInLane = projectService.isFirstBlockInLane(project.value, blockId)
    
    if (draggingBlockLane && !isFirstInLane) {
      // Dragging a non-first block from a lane - disconnect it
      project.value = projectService.removeBlockFromLane(project.value, blockId)
      console.log('Block disconnected from lane:', blockId)
    } else if (draggingBlockLane && isFirstInLane && targetBlockId) {
      // Dragging first block of a lane - this is not allowed, ignore drop
      console.log('Cannot drop first block of lane - entire lane moves together')
    } else if (targetBlockLane) {
      // Target is in a lane - add dragging block to that lane
      project.value = projectService.addBlockToLane(project.value, targetBlockLane.id, blockId, targetBlockId)
      console.log('Block added to existing lane:', targetBlockLane.name)
    } else {
      // Neither block is in a lane - create new lane with both blocks
      const targetBlock = project.value.blocks.find(b => b.id === targetBlockId)
      if (targetBlock) {
        project.value = projectService.createLane(project.value, [targetBlockId, blockId])
        console.log('New lane created with blocks:', targetBlockId, blockId)
      }
    }
  }
  
  isDraggingBlock.value = false
  draggingBlockId.value = null
  hoveredBlockId.value = null // Limpiar hover state
  
  // Save project with updated block position and/or lane structure
  projectService.saveCurrentProject(project.value)
  console.log('Block position and lane structure saved')
}

function selectBlock(block: Block) {
  selectedEntity.value = {
    type: 'block',
    data: block
  }
  console.log('Block selected:', block.name)
}

// Helper para obtener grupos dentro de un Block
function getGroupsInBlock(blockId: string) {
  const block = project.value.blocks?.find(b => b.id === blockId)
  if (!block) return []
  
  return project.value.beatGroups.filter(g => block.groupIds.includes(g.id))
}

function handleDeleteBlock(blockId: string) {
  if (confirm(t('messages.confirmDeleteBlock'))) {
    project.value = projectService.deleteBlock(project.value, blockId)
    projectService.saveCurrentProject(project.value)
    
    // Clear selection if deleted block was selected
    if (selectedEntity.value?.type === 'block' && selectedEntity.value.data.id === blockId) {
      selectedEntity.value = {
        type: 'project',
        data: project.value
      }
    }
    console.log('Block deleted:', blockId)
  }
}


function handleDeleteBeat(beatId: string) {
  const beat = project.value.beats.find((b: Beat) => b.id === beatId)
  if (!beat) return
  
  const confirmed = confirm(t('beatCard.deleteConfirm', { title: beat.title }))
  if (!confirmed) return
  
  // Check if beat is in a group
  const parentGroup = projectService.getGroupForBeat(project.value, beatId)
  
  if (parentGroup) {
    // Remove from group first (this will reposition remaining beats)
    project.value = projectService.removeBeatFromGroup(project.value, beatId, parentGroup.id)
  }
  
  // Delete the beat
  project.value = projectService.deleteBeat(project.value, beatId)
  projectService.saveCurrentProject(project.value)
  
  // Clear selection if deleted beat was selected
  if (selectedEntity.value?.type === 'beat' && (selectedEntity.value.data as Beat).id === beatId) {
    selectedEntity.value = {
      type: 'project',
      data: project.value
    }
  }
  
  console.log('Beat deleted:', beatId)
}

function handleDeleteGroup(groupId: string) {
  const group = project.value.beatGroups.find((g: BeatGroup) => g.id === groupId)
  if (!group) return
  
  const confirmed = confirm(t('groupProperties.deleteConfirm', { name: group.name }))
  if (!confirmed) return
  
  project.value = projectService.deleteBeatGroup(project.value, groupId)
  projectService.saveCurrentProject(project.value)
  
  // Clear selection if deleted group was selected
  if (selectedEntity.value?.type === 'group') {
    selectedEntity.value = {
      type: 'project',
      data: project.value
    }
  }
  
  console.log('Group deleted:', groupId)
}

// ============================================================
// Lane Management Functions
// ============================================================

function getLaneWidth(_lane: Lane): number {
  // Lane width should be wide enough to contain all its blocks
  // For now, use a fixed width (can be made dynamic later)
  return 500
}

function selectLane(lane: Lane) {
  selectedEntity.value = {
    type: 'lane',
    data: lane
  }
  console.log('Lane selected:', lane.name)
}

function handleLaneDragStart(laneId: string) {
  isDraggingLane.value = true
  draggingLaneId.value = laneId
  
  const lane = project.value.lanes?.find(l => l.id === laneId)
  if (lane) {
    laneDragStartPosition.value = { ...lane.position }
  }
  
  console.log('Lane drag started:', laneId)
}

function handleLaneDragMove(laneId: string, deltaX: number, deltaY: number) {
  if (!isDraggingLane.value || draggingLaneId.value !== laneId) return
  
  // Calculate deltas accounting for zoom
  const deltaXScaled = deltaX / zoom.value
  const deltaYScaled = deltaY / zoom.value
  
  const lane = project.value.lanes?.find(l => l.id === laneId)
  if (!lane) return
  
  // Move lane header
  const newPosition = {
    x: laneDragStartPosition.value.x + deltaXScaled,
    y: laneDragStartPosition.value.y + deltaYScaled
  }
  
  // Update lane position
  project.value = projectService.updateLane(project.value, laneId, { position: newPosition })
  
  // Move all blocks in lane
  const blocksInLane = project.value.blocks.filter(b => lane.blockIds.includes(b.id))
  
  blocksInLane.forEach(block => {
    const blockNewPosition = {
      x: block.position.x + deltaXScaled,
      y: block.position.y + deltaYScaled
    }
    project.value = projectService.updateBlock(project.value, block.id, { position: blockNewPosition })
    
    // Move all groups within this block
    block.groupIds.forEach(groupId => {
      const group = project.value.beatGroups.find(g => g.id === groupId)
      if (group) {
        const groupNewPosition = {
          x: group.position.x + deltaXScaled,
          y: group.position.y + deltaYScaled
        }
        project.value = projectService.updateBeatGroup(project.value, group.id, { position: groupNewPosition })
        
        // Move all beats within this group
        group.beatIds.forEach(beatId => {
          const beat = project.value.beats.find(b => b.id === beatId)
          if (beat) {
            const beatNewPosition = {
              x: beat.position.x + deltaXScaled,
              y: beat.position.y + deltaYScaled
            }
            project.value = projectService.updateBeat(project.value, beat.id, { position: beatNewPosition })
          }
        })
      }
    })
  })
  
  // Update start position for next delta
  laneDragStartPosition.value = newPosition
}

function handleLaneDragEnd(laneId: string) {
  if (!isDraggingLane.value || draggingLaneId.value !== laneId) return
  
  isDraggingLane.value = false
  draggingLaneId.value = null
  
  // Save project with updated lane position
  projectService.saveCurrentProject(project.value)
  console.log('Lane position saved')
}

function handleDeleteLane(laneId: string) {
  if (confirm(t('messages.confirmDeleteLane'))) {
    project.value = projectService.deleteLane(project.value, laneId)
    projectService.saveCurrentProject(project.value)
    
    // Clear selection if deleted lane was selected
    if (selectedEntity.value?.type === 'lane' && selectedEntity.value.data.id === laneId) {
      selectedEntity.value = {
        type: 'project',
        data: project.value
      }
    }
    console.log('Lane deleted:', laneId)
  }
}

</script>

<style scoped>
.beat-canvas-container {
  flex: 1;
  overflow: hidden; /* Changed from auto to hidden to prevent scrollbars during pan */
  background: #f5f5f5;
  position: relative;
  user-select: none; /* Prevent text selection during drag */
}

.beat-canvas {
  position: relative;
  min-width: 2000px;
  min-height: 1000px;
  /* TODO: Add grid background for visual reference */
}

.beat-grid-container {
  flex: 1;
  overflow: auto;
  background: #ffffff;
  padding: 16px;
}
</style>
