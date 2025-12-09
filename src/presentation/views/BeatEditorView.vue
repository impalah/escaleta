<template>
  <v-container
    fluid
    class="pa-0 fill-height"
  >
    <!-- App Bar -->
    <v-app-bar
      color="primary"
      density="compact"
      elevation="2"
    >
      <v-toolbar-title>{{ project.name }}</v-toolbar-title>

      <v-spacer />

      <!-- Toolbar buttons -->
      <v-btn
        icon
        aria-label="New project"
        @click="handleNewProject"
      >
        <v-icon>mdi-file-plus</v-icon>
        <v-tooltip
          activator="parent"
          location="bottom"
        >
          {{ t('toolbar.newProject') }}
        </v-tooltip>
      </v-btn>

      <v-btn
        icon
        aria-label="Save project"
        @click="handleSave"
      >
        <v-icon>mdi-content-save</v-icon>
        <v-tooltip
          activator="parent"
          location="bottom"
        >
          {{ t('toolbar.save') }}
        </v-tooltip>
      </v-btn>

      <v-menu>
        <template #activator="{ props }">
          <v-btn
            icon
            v-bind="props"
          >
            <v-icon>mdi-export</v-icon>
            <v-tooltip
              activator="parent"
              location="bottom"
            >
              {{ t('toolbar.export') }}
            </v-tooltip>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="handleExportJSON">
            <v-list-item-title>{{ t('toolbar.exportToJSON') }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="handleExportScript">
            <v-list-item-title>{{ t('toolbar.exportToScript') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-divider
        vertical
        class="mx-2"
      />

      <!-- View Mode Toggle -->
      <v-btn-toggle
        v-model="viewMode"
        mandatory
        density="compact"
        color="accent"
        class="mr-2"
      >
        <v-btn
          value="canvas"
          size="small"
          aria-label="Canvas view"
        >
          <v-icon>mdi-grid</v-icon>
          <v-tooltip
            activator="parent"
            location="bottom"
          >
            {{ t('toolbar.canvasView') }}
          </v-tooltip>
        </v-btn>
        <v-btn
          value="grid"
          size="small"
          aria-label="Grid view"
        >
          <v-icon>mdi-view-list</v-icon>
          <v-tooltip
            activator="parent"
            location="bottom"
          >
            {{ t('toolbar.gridView') }}
          </v-tooltip>
        </v-btn>
      </v-btn-toggle>

      <v-divider
        vertical
        class="mx-2"
      />

      <v-btn
        icon
        @click="handleZoomIn"
      >
        <v-icon>mdi-magnify-plus</v-icon>
        <v-tooltip
          activator="parent"
          location="bottom"
        >
          {{ t('toolbar.zoomIn') }}
        </v-tooltip>
      </v-btn>

      <v-btn
        icon
        @click="handleZoomOut"
      >
        <v-icon>mdi-magnify-minus</v-icon>
        <v-tooltip
          activator="parent"
          location="bottom"
        >
          {{ t('toolbar.zoomOut') }}
        </v-tooltip>
      </v-btn>

      <v-divider
        vertical
        class="mx-2"
      />

      <!-- Language Selector -->
      <v-menu>
        <template #activator="{ props }">
          <v-btn
            icon
            v-bind="props"
          >
            <v-icon>mdi-translate</v-icon>
            <v-tooltip
              activator="parent"
              location="bottom"
            >
              {{ t('toolbar.language') }}
            </v-tooltip>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="changeLanguage('es-ES')">
            <v-list-item-title>{{ t('languages.es-ES') }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="changeLanguage('en-US')">
            <v-list-item-title>{{ t('languages.en-US') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-divider
        vertical
        class="mx-2"
      />

      <v-btn
        icon
        color="accent"
        aria-label="Add beat"
        @click="showNewBeatDialog = true"
      >
        <v-icon>mdi-plus-circle</v-icon>
        <v-tooltip
          activator="parent"
          location="bottom"
        >
          {{ t('toolbar.addBeat') }}
        </v-tooltip>
      </v-btn>

      <v-btn
        icon
        color="secondary"
        aria-label="Create group"
        @click="handleCreateGroup"
      >
        <v-icon>mdi-group</v-icon>
        <v-tooltip
          activator="parent"
          location="bottom"
        >
          {{ t('toolbar.createGroup') }}
        </v-tooltip>
      </v-btn>

      <v-btn
        icon
        color="info"
        aria-label="Create block"
        @click="handleCreateBlock"
      >
        <v-icon>mdi-square</v-icon>
        <v-tooltip
          activator="parent"
          location="bottom"
        >
          {{ t('toolbar.createBlock') }}
        </v-tooltip>
      </v-btn>
    </v-app-bar>

    <!-- Beat Canvas (shown in canvas mode) -->
    <v-sheet 
      v-if="viewMode === 'canvas'" 
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
        <!-- Block Cards (rendered first, lowest z-index) -->
        <BlockCard
          v-for="block in project.blocks"
          :key="block.id"
          :block="block"
          :zoom="zoom"
          :is-hovered="hoveredBlockId === block.id"
          :is-dragging-content="isDraggingBeat || isDraggingGroup"
          @click="selectBlock"
          @dragstart="handleBlockDragStart"
          @dragmove="handleBlockDragMove"
          @dragend="handleBlockDragEnd"
          @resize="handleBlockResize"
          @delete="handleDeleteBlock"
        >
          <!-- Content inside Block (groups and beats) -->
          <template #content>
            <!-- BeatGroups inside this Block -->
            <BeatGroupCard
              v-for="groupId in block.groupIds"
              :key="`block-${block.id}-group-${groupId}`"
              :group="project.beatGroups.find(g => g.id === groupId)!"
              :zoom="1"
              :is-hovered="hoveredGroupId === groupId"
              :z-index="getOrAssignZIndex(groupId, isDraggingGroup && draggingGroupId === groupId)"
              :parent-block-id="block.id"
              @click="selectGroup"
              @dragstart="handleGroupDragStart"
              @dragmove="handleGroupDragMove"
              @dragend="handleGroupDragEnd"
              @delete="handleDeleteGroup"
            />

            <!-- Individual Beats inside this Block -->
            <BeatCard
              v-for="beatId in block.beatIds"
              :key="`block-${block.id}-beat-${beatId}`"
              :beat="project.beats.find(b => b.id === beatId)!"
              :beat-type="getBeatType(project.beats.find(b => b.id === beatId)!.typeId)"
              :is-group-dragging="isDraggingGroup"
              :is-hovered="hoveredBeatId === beatId"
              :is-in-group="false"
              :z-index="
                isDraggingBeat && draggingBeatId === beatId
                  ? getOrAssignZIndex(beatId, true)
                  : getOrAssignZIndex(beatId, false)
              "
              :parent-block-id="block.id"
              @click="selectBeat(project.beats.find(b => b.id === beatId)!)"
              @dragstart="handleBeatDragStart"
              @dragmove="handleBeatDragMove"
              @dragend="handleBeatDragEnd"
              @delete="handleDeleteBeat"
            />

            <!-- Group Connection Lines for groups inside this Block -->
            <GroupConnectionLine
              v-for="groupId in block.groupIds.filter(gId => {
                const g = project.beatGroups.find(group => group.id === gId)
                return g && g.beatIds.length > 0
              })"
              :key="`block-${block.id}-group-line-${groupId}`"
              :group="project.beatGroups.find(g => g.id === groupId)!"
              :beat="project.beats.find(b => b.id === project.beatGroups.find(g => g.id === groupId)!.beatIds[0])!"
            />

            <!-- Beat Cards that belong to groups inside this Block -->
            <template
              v-for="groupId in block.groupIds"
              :key="`block-${block.id}-group-${groupId}-beats`"
            >
              <BeatCard
                v-for="beatId in (project.beatGroups.find(g => g.id === groupId)?.beatIds || [])"
                :key="`block-${block.id}-group-${groupId}-beat-${beatId}`"
                :beat="project.beats.find(b => b.id === beatId)!"
                :beat-type="getBeatType(project.beats.find(b => b.id === beatId)!.typeId)"
                :is-group-dragging="isDraggingGroup"
                :is-hovered="hoveredBeatId === beatId"
                :is-in-group="true"
                :z-index="getGroupZIndex(beatId) ?? getOrAssignZIndex(beatId, false)"
                :parent-block-id="block.id"
                @click="selectBeat(project.beats.find(b => b.id === beatId)!)"
                @dragstart="handleBeatDragStart"
                @dragmove="handleBeatDragMove"
                @dragend="handleBeatDragEnd"
                @delete="handleDeleteBeat"
              />
            </template>
          </template>
        </BlockCard>

        <!-- Beat Group Cards NOT in blocks (rendered second, higher z-index than blocks) -->
        <BeatGroupCard
          v-for="group in project.beatGroups.filter(g => !projectService.groupBelongsToBlock(project, g.id))"
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

        <!-- Group Connection Lines (from group header to first beat) for groups NOT in blocks -->
        <GroupConnectionLine
          v-for="group in project.beatGroups.filter(g => g.beatIds.length > 0 && !projectService.groupBelongsToBlock(project, g.id))"
          :key="`group-line-${group.id}`"
          :group="group"
          :beat="project.beats.find(b => b.id === group.beatIds[0])!"
        />

        <!-- Beat Cards that belong to groups NOT in blocks -->
        <template
          v-for="group in project.beatGroups.filter(g => !projectService.groupBelongsToBlock(project, g.id))"
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

        <!-- Beat Cards NOT in blocks or groups -->
        <BeatCard
          v-for="beat in project.beats.filter(b => 
            !projectService.belongsToBeatGroup(project, b.id) && 
            !projectService.belongsToBlock(project, b.id)
          )"
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

    <!-- Beat Grid (shown in grid mode) -->
    <v-sheet
      v-else
      class="beat-grid-container"
    >
      <BeatGridView
        :beats="sortedBeats"
        :beat-types="project.beatTypes"
        @beat-click="selectBeat"
      />
    </v-sheet>

    <!-- Properties Panel -->
    <PropertiesPanel
      :selected-entity="selectedEntity"
      :beat-types="project.beatTypes"
      @update-project="handleUpdateProject"
      @update-beat="handleUpdateBeat"
      @update-group="handleUpdateGroup"
      @update-block="handleUpdateBlock"
    />

    <!-- New Beat Dialog -->
    <BeatTypeSelectDialog
      v-model="showNewBeatDialog"
      :beat-types="project.beatTypes"
      @select="handleCreateBeat"
    />
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLanguage } from '@/i18n'
import type { Beat, BeatType, Project, BeatGroup, Block } from '@/domain/entities'
import { projectService } from '@/application/ProjectService'
import BeatCard from '@/presentation/components/BeatCard.vue'
import BeatGroupCard from '@/presentation/components/BeatGroupCard.vue'
import BlockCard from '@/presentation/components/BlockCard.vue'
import GroupConnectionLine from '@/presentation/components/GroupConnectionLine.vue'
// @ts-ignore - Component reserved for future features
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import PropertiesPanel from '@/presentation/components/PropertiesPanel.vue'
// @ts-ignore - Dialog reserved for beat creation feature
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import BeatTypeSelectDialog from '@/presentation/components/BeatTypeSelectDialog.vue'
// @ts-ignore - Grid view reserved for future features
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import BeatGridView from '@/presentation/components/BeatGridView.vue'

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
  type: 'project' | 'beat' | 'group' | 'block'
  data: Project | Beat | BeatGroup | Block
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

// Beat-to-Group hover state (for highlighting groups during beat drag)
const hoveredGroupId = ref<string | null>(null)

// Beat-to-Beat hover state (for highlighting beats in groups during beat drag)
const hoveredBeatId = ref<string | null>(null)

// Hover state for Blocks (when dragging beats or groups over blocks)
const hoveredBlockId = ref<string | null>(null)

// Z-index stack management
// Blocks: base 1, Beats/Groups: dynamic (1000+), Dragging: max + 10000
const elementZIndexMap = ref<Map<string, number>>(new Map())

// Constants
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-ignore - Constant reserved for beat height calculations
const BEAT_HEIGHT = 80 // Must match constant in ProjectService

// View mode: 'canvas' or 'grid', persisted in localStorage
const VIEW_MODE_KEY = 'escaleta-view-mode'
const viewMode = ref<'canvas' | 'grid'>(
  (localStorage.getItem(VIEW_MODE_KEY) as 'canvas' | 'grid') || 'canvas'
)

// Computed property to get beats sorted by order
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-ignore - Computed property for future sorting feature
const sortedBeats = computed(() => {
  return projectService.getSortedBeats(project.value)
})

// Watch viewMode and persist changes
watch(viewMode, (newMode) => {
  localStorage.setItem(VIEW_MODE_KEY, newMode)
})

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-ignore - Handler for project updates
function handleUpdateProject(updatedProject: Project) {
  project.value = updatedProject
  projectService.saveCurrentProject(project.value)
  // Update selected entity to reflect changes
  if (selectedEntity.value?.type === 'project') {
    selectedEntity.value.data = updatedProject
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-ignore - Handler for beat updates
function handleUpdateBeat(updatedBeat: Beat) {
  project.value = projectService.updateBeat(project.value, updatedBeat.id, updatedBeat)
  projectService.saveCurrentProject(project.value)
  // Update selected entity to reflect changes
  if (selectedEntity.value?.type === 'beat') {
    selectedEntity.value.data = updatedBeat
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-ignore - Handler for beat creation
function handleCreateBeat(typeId: string) {
  const newBeat = projectService.createBeat(typeId, project.value)
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

function handleCreateBlock() {
  const blockName = prompt(t('toolbar.createBlock'), 'New Block')
  if (!blockName) return
  
  const newBlock = projectService.createBlock(project.value, blockName)
  project.value = projectService.addBlock(project.value, newBlock)
  projectService.saveCurrentProject(project.value)
  
  console.log('Block created:', newBlock.name)
}

function handleZoomIn() {
  zoom.value = Math.min(zoom.value + 0.1, 2)
}

function handleZoomOut() {
  zoom.value = Math.max(zoom.value - 0.1, 0.5)
}

// Canvas panning handlers
function handleCanvasMouseDown(event: MouseEvent) {
  // Don't pan if dragging a beat, group, or block
  if (isDraggingBeat.value || isDraggingGroup.value || isDraggingBlock.value) return
  
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
  
  const beat = project.value.beats.find((b: Beat) => b.id === beatId)
  if (!beat) return
  
  // Check if beat belongs to a group
  const parentGroup = projectService.getGroupForBeat(project.value, beatId)
  
  // Si el beat está en un grupo, extraerlo del grupo al hacer drag
  if (parentGroup) {
    project.value = projectService.removeBeatFromGroup(project.value, beatId, parentGroup.id)
  }
  
  // Guardar posición inicial del beat
  beatDragStartPosition.value = { ...beat.position }
}

function handleBeatDragMove(beatId: string, deltaX: number, deltaY: number) {
  if (!isDraggingBeat.value || draggingBeatId.value !== beatId) return
  
  // Calculate new position accounting for zoom
  const deltaXScaled = deltaX / zoom.value
  const deltaYScaled = deltaY / zoom.value
  
  const beat = project.value.beats.find(b => b.id === beatId)
  if (!beat) return
  
  // Mover el beat a la nueva posición
  const newX = beatDragStartPosition.value.x + deltaXScaled
  const newY = beatDragStartPosition.value.y + deltaYScaled
  
  const beatIndex = project.value.beats.findIndex(b => b.id === beatId)
  if (beatIndex !== -1) {
    project.value.beats[beatIndex] = {
      ...project.value.beats[beatIndex],
      position: { x: newX, y: newY },
      updatedAt: new Date().toISOString()
    }
  }
  
  // Detectar colisión con BeatGroups
  detectGroupHover(newX, newY)
}

function handleBeatDragEnd(beatId: string) {
  if (!isDraggingBeat.value || draggingBeatId.value !== beatId) return
  
  // First, check if beat was in a block and is being dragged out
  const currentBlock = projectService.getBlockForBeat(project.value, beatId)
  if (currentBlock) {
    const beat = project.value.beats.find(b => b.id === beatId)
    if (beat) {
      const isInsideBlock = isPointInsideBlock(beat.position, currentBlock)
      if (!isInsideBlock && !hoveredBlockId.value) {
        // Beat dragged out of block and not over another block
        project.value = projectService.removeBeatFromBlock(project.value, beatId, currentBlock.id)
        console.log('Beat removed from block')
      }
    }
  }
  
  // Check if dropped onto a beat within a group (higher priority than group header)
  if (hoveredBeatId.value) {
    const targetBeat = project.value.beats.find(b => b.id === hoveredBeatId.value)
    if (targetBeat) {
      // Find which group the target beat belongs to
      const targetGroup = projectService.getGroupForBeat(project.value, hoveredBeatId.value)
      if (targetGroup) {
        // Remove from any block first
        const beatBlock = projectService.getBlockForBeat(project.value, beatId)
        if (beatBlock) {
          project.value = projectService.removeBeatFromBlock(project.value, beatId, beatBlock.id)
        }
        
        // Insert source beat at target beat's position
        project.value = projectService.insertBeatIntoGroupAtPosition(
          project.value,
          beatId,
          hoveredBeatId.value,
          targetGroup.id
        )
        
        // Clear drag state
        isDraggingBeat.value = false
        draggingBeatId.value = null
        hoveredBeatId.value = null
        hoveredGroupId.value = null
        
        // Save project
        projectService.saveCurrentProject(project.value)
        console.log('Beat inserted into group at specific position')
        return
      }
    }
  }
  
  // Check if dropped into a BeatGroup header (append to end)
  if (hoveredGroupId.value) {
    // Remove from any block first
    const beatBlock = projectService.getBlockForBeat(project.value, beatId)
    if (beatBlock) {
      project.value = projectService.removeBeatFromBlock(project.value, beatId, beatBlock.id)
    }
    
    project.value = projectService.dropBeatIntoGroup(project.value, beatId, hoveredGroupId.value)
    
    // Clear drag state
    isDraggingBeat.value = false
    draggingBeatId.value = null
    hoveredBeatId.value = null
    hoveredGroupId.value = null
    
    // Save project
    projectService.saveCurrentProject(project.value)
    console.log('Beat dropped into group')
    return
  }
  
  // Drop beat into Block with horizontal alignment
  if (hoveredBlockId.value) {
    const targetBlock = project.value.blocks.find(b => b.id === hoveredBlockId.value)
    if (targetBlock) {
      // Remove beat from any existing block
      const beatBlock = projectService.getBlockForBeat(project.value, beatId)
      if (beatBlock && beatBlock.id !== hoveredBlockId.value) {
        project.value = projectService.removeBeatFromBlock(project.value, beatId, beatBlock.id)
      }
      
      // Add beat to the hovered block
      project.value = projectService.addBeatToBlock(project.value, beatId, hoveredBlockId.value)
      
      // Calculate horizontal position (align to the right of the last element)
      const BEAT_WIDTH = 400
      const GROUP_WIDTH = 430
      const HORIZONTAL_MARGIN = 20
      const VERTICAL_MARGIN = 20 // Distance from top of block
      
      let rightmostX = HORIZONTAL_MARGIN // Start position if block is empty
      
      // Check all beats in this block
      const beatsInBlock = project.value.beats.filter(b => 
        targetBlock.beatIds.includes(b.id) && b.id !== beatId
      )
      for (const beat of beatsInBlock) {
        const beatRight = beat.position.x + BEAT_WIDTH
        if (beatRight > rightmostX) {
          rightmostX = beatRight
        }
      }
      
      // Check all groups in this block
      const groupsInBlock = project.value.beatGroups.filter(g => 
        targetBlock.groupIds.includes(g.id)
      )
      for (const group of groupsInBlock) {
        const groupRight = group.position.x + GROUP_WIDTH
        if (groupRight > rightmostX) {
          rightmostX = groupRight
        }
      }
      
      // Position the beat to the right of the last element (or at start if empty)
      const beat = project.value.beats.find(b => b.id === beatId)
      if (beat) {
        beat.position.x = rightmostX + (rightmostX > HORIZONTAL_MARGIN ? HORIZONTAL_MARGIN : 0)
        beat.position.y = VERTICAL_MARGIN
      }
    }
    
    // Clear drag state
    isDraggingBeat.value = false
    draggingBeatId.value = null
    hoveredBeatId.value = null
    hoveredGroupId.value = null
    hoveredBlockId.value = null
    
    // Save project
    projectService.saveCurrentProject(project.value)
    console.log('Beat dropped into block with horizontal alignment')
    return
  }
  
  // Clear drag state
  isDraggingBeat.value = false
  draggingBeatId.value = null
  hoveredBeatId.value = null
  hoveredGroupId.value = null
  hoveredBlockId.value = null
  
  // Save project with updated position
  projectService.saveCurrentProject(project.value)
  console.log('Beat position saved')
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
  
  // Check for block collisions during group drag
  checkGroupBlockCollision(newX, newY)
}

function handleGroupDragEnd(groupId: string) {
  if (!isDraggingGroup.value || draggingGroupId.value !== groupId) return
  
  // Drop group into Block with horizontal alignment
  if (hoveredBlockId.value) {
    const targetBlock = project.value.blocks.find(b => b.id === hoveredBlockId.value)
    if (targetBlock) {
      // Remove group from any existing block
      const currentBlock = projectService.getBlockForGroup(project.value, groupId)
      if (currentBlock) {
        project.value = projectService.removeGroupFromBlock(project.value, groupId, currentBlock.id)
      }
      
      // Add group to the hovered block
      project.value = projectService.addGroupToBlock(project.value, groupId, hoveredBlockId.value)
      
      // Calculate horizontal position (align to the right of the last element)
      const BEAT_WIDTH = 400
      const GROUP_WIDTH = 430
      const HORIZONTAL_MARGIN = 20
      const VERTICAL_MARGIN = 20 // Distance from top of block
      
      let rightmostX = HORIZONTAL_MARGIN // Start position if block is empty
      
      // Check all beats in this block
      const beatsInBlock = project.value.beats.filter(b => 
        targetBlock.beatIds.includes(b.id)
      )
      for (const beat of beatsInBlock) {
        const beatRight = beat.position.x + BEAT_WIDTH
        if (beatRight > rightmostX) {
          rightmostX = beatRight
        }
      }
      
      // Check all groups in this block (excluding the one being dropped)
      const groupsInBlock = project.value.beatGroups.filter(g => 
        targetBlock.groupIds.includes(g.id) && g.id !== groupId
      )
      for (const group of groupsInBlock) {
        const groupRight = group.position.x + GROUP_WIDTH
        if (groupRight > groupRight) {
          rightmostX = groupRight
        }
      }
      
      // Position the group to the right of the last element (or at start if empty)
      const group = project.value.beatGroups.find(g => g.id === groupId)
      if (group) {
        group.position.x = rightmostX + (rightmostX > HORIZONTAL_MARGIN ? HORIZONTAL_MARGIN : 0)
        group.position.y = VERTICAL_MARGIN
      }
    }
    
    // Clear drag state
    isDraggingGroup.value = false
    draggingGroupId.value = null
    hoveredBlockId.value = null
    
    // Save project
    projectService.saveCurrentProject(project.value)
    console.log('Group dropped into block with horizontal alignment')
    return
  }
  
  // If dragged out of a block, remove from block
  const currentBlock = projectService.getBlockForGroup(project.value, groupId)
  if (currentBlock) {
    // Check if group is still inside the block bounds
    const group = project.value.beatGroups.find(g => g.id === groupId)
    if (group) {
      const isInsideBlock = isPointInsideBlock(group.position, currentBlock)
      if (!isInsideBlock) {
        project.value = projectService.removeGroupFromBlock(project.value, groupId, currentBlock.id)
        console.log('Group removed from block')
      }
    }
  }
  
  isDraggingGroup.value = false
  draggingGroupId.value = null
  hoveredBlockId.value = null
  
  // Save project with updated group position
  projectService.saveCurrentProject(project.value)
  console.log('Group position saved')
}

// Block drag handlers
function handleBlockDragStart(blockId: string) {
  isDraggingBlock.value = true
  draggingBlockId.value = blockId
  
  const block = project.value.blocks.find(b => b.id === blockId)
  if (!block) return
  
  blockDragStartPosition.value = { ...block.position }
  console.log('Block drag started:', block.name)
}

function handleBlockDragMove(blockId: string, deltaX: number, deltaY: number) {
  if (!isDraggingBlock.value || draggingBlockId.value !== blockId) return
  
  const block = project.value.blocks.find(b => b.id === blockId)
  if (!block) return
  
  // Calculate new position accounting for zoom
  const deltaXScaled = deltaX / zoom.value
  const deltaYScaled = deltaY / zoom.value
  
  // Add delta to current position
  const newX = block.position.x + deltaXScaled
  const newY = block.position.y + deltaYScaled
  
  // Update block position
  project.value = projectService.updateBlock(project.value, blockId, {
    position: { x: newX, y: newY }
  })
}

function handleBlockDragEnd(blockId: string) {
  if (!isDraggingBlock.value || draggingBlockId.value !== blockId) return
  
  isDraggingBlock.value = false
  draggingBlockId.value = null
  
  // Save project with updated block position
  projectService.saveCurrentProject(project.value)
  console.log('Block position saved')
}

function handleBlockResize(blockId: string, newSize: { width: number; height: number }, newPosition?: { x: number; y: number }) {
  const updates: Partial<Block> = { size: newSize }
  if (newPosition) {
    updates.position = newPosition
  }
  
  project.value = projectService.updateBlock(project.value, blockId, updates)
  
  // Save immediately for real-time feedback
  projectService.saveCurrentProject(project.value)
}

// Detect if dragged beat is over a BeatGroup or Beat in group
function detectGroupHover(beatX: number, beatY: number) {
  const BEAT_WIDTH = 400
  const BEAT_HEIGHT = 80
  const GROUP_WIDTH = 430
  const GROUP_HEIGHT = 50
  
  // Use center point of dragged element for more precise collision detection
  // @ts-ignore - Temporarily unused during diagnostics
  const beatCenterX = beatX + BEAT_WIDTH / 2
  // @ts-ignore - Temporarily unused during diagnostics
  const beatCenterY = beatY + BEAT_HEIGHT / 2
  
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
    hoveredBlockId.value = null
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
      
      const groupBeatLeft = groupBeat.position.x
      const groupBeatRight = groupBeat.position.x + BEAT_WIDTH
      const groupBeatTop = groupBeat.position.y
      const groupBeatBottom = groupBeat.position.y + BEAT_HEIGHT
      
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
    
    const groupLeft = group.position.x
    const groupRight = group.position.x + GROUP_WIDTH
    const groupTop = group.position.y
    const groupBottom = group.position.y + GROUP_HEIGHT
    
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
  
  // DIAGNOSTIC MODE - Block collision detection ENABLED for visual feedback (hover)
  // Drop functionality remains DISABLED
  // Use CENTER POINT with DOM coordinates (not canvas coordinates)
  
  for (const block of project.value.blocks) {
    // Get actual DOM bounds of the BlockCard element
    const blockElement = document.querySelector(`[data-block-id="${block.id}"]`)
    if (!blockElement) continue
    
    const blockRect = blockElement.getBoundingClientRect()
    const canvasRect = canvasRef.value?.getBoundingClientRect()
    if (!canvasRect) continue
    
    // Convert beat center from canvas coordinates to viewport coordinates
    const beatCenterViewportX = canvasRect.left + beatCenterX
    const beatCenterViewportY = canvasRect.top + beatCenterY
    
    // Check if CENTER of beat is inside the block's VISUAL bounds
    const isCenterInside = (
      beatCenterViewportX > blockRect.left &&
      beatCenterViewportX < blockRect.right &&
      beatCenterViewportY > blockRect.top &&
      beatCenterViewportY < blockRect.bottom
    )
    
    // DIAGNOSTIC LOGGING when hover CHANGES (not every frame)
    if (isCenterInside && hoveredBlockId.value !== block.id) {
      console.log('🟢 HOVER ACTIVATED on Block (DOM-based)', {
        blockId: block.id,
        beatCenterCanvas: { x: Math.round(beatCenterX), y: Math.round(beatCenterY) },
        beatCenterViewport: { x: Math.round(beatCenterViewportX), y: Math.round(beatCenterViewportY) },
        blockBoundsViewport: { 
          left: Math.round(blockRect.left), 
          right: Math.round(blockRect.right), 
          top: Math.round(blockRect.top), 
          bottom: Math.round(blockRect.bottom) 
        }
      })
      hoveredBlockId.value = block.id
      hoveredGroupId.value = null
      hoveredBeatId.value = null
      return
    } else if (isCenterInside) {
      // Still hovering, don't log
      hoveredBlockId.value = block.id
      hoveredGroupId.value = null
      hoveredBeatId.value = null
      return
    }
  }
  
  // No collision found - log if we're leaving a hover
  if (hoveredBlockId.value !== null) {
    console.log('🔴 HOVER DEACTIVATED')
  }
  hoveredGroupId.value = null
  hoveredBeatId.value = null
  hoveredBlockId.value = null
}

/**
 * Check if a dragging BeatGroup collides with any Block
 */
// @ts-ignore - Parameters temporarily unused during diagnostics
function checkGroupBlockCollision(groupX: number, groupY: number) {
  // DIAGNOSTIC MODE - Block collision detection ENABLED for visual feedback (hover)
  // Drop functionality remains DISABLED
  const GROUP_WIDTH = 430
  const GROUP_HEIGHT = 50
  
  // Use center point for collision detection
  const groupCenterX = groupX + GROUP_WIDTH / 2
  const groupCenterY = groupY + GROUP_HEIGHT / 2
  
  // Check collision with each Block using DOM coordinates (not canvas coordinates)
  for (const block of project.value.blocks) {
    // Get actual DOM bounds of the BlockCard element
    const blockElement = document.querySelector(`[data-block-id="${block.id}"]`)
    if (!blockElement) continue
    
    const blockRect = blockElement.getBoundingClientRect()
    const canvasRect = canvasRef.value?.getBoundingClientRect()
    if (!canvasRect) continue
    
    // Convert group center from canvas coordinates to viewport coordinates
    const groupCenterViewportX = canvasRect.left + groupCenterX
    const groupCenterViewportY = canvasRect.top + groupCenterY
    
    // Check if CENTER of group is inside the block's VISUAL bounds
    const isCenterInside = (
      groupCenterViewportX > blockRect.left &&
      groupCenterViewportX < blockRect.right &&
      groupCenterViewportY > blockRect.top &&
      groupCenterViewportY < blockRect.bottom
    )
    
    // DIAGNOSTIC LOGGING when hover is detected
    if (isCenterInside && hoveredBlockId.value !== block.id) {
      console.log('🟢 GROUP HOVER ACTIVATED on Block (DOM-based)', {
        blockId: block.id,
        groupCenterCanvas: { x: Math.round(groupCenterX), y: Math.round(groupCenterY) },
        groupCenterViewport: { x: Math.round(groupCenterViewportX), y: Math.round(groupCenterViewportY) },
        blockBoundsViewport: { 
          left: Math.round(blockRect.left), 
          right: Math.round(blockRect.right), 
          top: Math.round(blockRect.top), 
          bottom: Math.round(blockRect.bottom) 
        }
      })
      hoveredBlockId.value = block.id
      return
    } else if (isCenterInside) {
      hoveredBlockId.value = block.id
      return
    }
  }
  
  // No collision found
  hoveredBlockId.value = null
}

/**
 * Check if a point is inside a Block
 */
function isPointInsideBlock(point: { x: number; y: number }, block: Block): boolean {
  return (
    point.x >= block.position.x &&
    point.x <= block.position.x + block.size.width &&
    point.y >= block.position.y &&
    point.y <= block.position.y + block.size.height
  )
}

// Group editing handlers
function selectGroup(group: BeatGroup) {
  selectedEntity.value = {
    type: 'group',
    data: group
  }
  console.log('Group selected:', group.name)
}

// Block editing handlers
function selectBlock(block: Block) {
  selectedEntity.value = {
    type: 'block',
    data: block
  }
  console.log('Block selected:', block.name)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-ignore - Handler for group updates
function handleUpdateGroup(updatedGroup: BeatGroup) {
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-ignore - Handler for block updates
function handleUpdateBlock(updatedBlock: Block) {
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

function handleDeleteBlock(blockId: string) {
  const block = project.value.blocks.find((b: Block) => b.id === blockId)
  if (!block) return
  
  const confirmed = confirm(t('blockProperties.deleteConfirm', { name: block.name }))
  if (!confirmed) return
  
  project.value = projectService.deleteBlock(project.value, blockId)
  projectService.saveCurrentProject(project.value)
  
  // Clear selection if deleted block was selected
  if (selectedEntity.value?.type === 'block') {
    selectedEntity.value = {
      type: 'project',
      data: project.value
    }
  }
  
  console.log('Block deleted:', blockId)
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
