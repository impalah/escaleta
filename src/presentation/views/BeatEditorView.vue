<template>
  <v-container fluid class="pa-0 fill-height">
    <!-- App Bar -->
    <v-app-bar color="primary" density="compact" elevation="2">
      <v-toolbar-title>{{ project.name }}</v-toolbar-title>

      <v-spacer />

      <!-- Toolbar buttons -->
      <v-btn icon @click="handleNewProject" aria-label="New project">
        <v-icon>mdi-file-plus</v-icon>
        <v-tooltip activator="parent" location="bottom">{{ t('toolbar.newProject') }}</v-tooltip>
      </v-btn>

      <v-btn icon @click="handleSave" aria-label="Save project">
        <v-icon>mdi-content-save</v-icon>
        <v-tooltip activator="parent" location="bottom">{{ t('toolbar.save') }}</v-tooltip>
      </v-btn>

      <v-menu>
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-export</v-icon>
            <v-tooltip activator="parent" location="bottom">{{ t('toolbar.export') }}</v-tooltip>
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

      <v-divider vertical class="mx-2" />

      <!-- View Mode Toggle -->
      <v-btn-toggle
        v-model="viewMode"
        mandatory
        density="compact"
        color="accent"
        class="mr-2"
      >
        <v-btn value="canvas" size="small" aria-label="Canvas view">
          <v-icon>mdi-grid</v-icon>
          <v-tooltip activator="parent" location="bottom">{{ t('toolbar.canvasView') }}</v-tooltip>
        </v-btn>
        <v-btn value="grid" size="small" aria-label="Grid view">
          <v-icon>mdi-view-list</v-icon>
          <v-tooltip activator="parent" location="bottom">{{ t('toolbar.gridView') }}</v-tooltip>
        </v-btn>
      </v-btn-toggle>

      <v-divider vertical class="mx-2" />

      <v-btn icon @click="handleZoomIn">
        <v-icon>mdi-magnify-plus</v-icon>
        <v-tooltip activator="parent" location="bottom">{{ t('toolbar.zoomIn') }}</v-tooltip>
      </v-btn>

      <v-btn icon @click="handleZoomOut">
        <v-icon>mdi-magnify-minus</v-icon>
        <v-tooltip activator="parent" location="bottom">{{ t('toolbar.zoomOut') }}</v-tooltip>
      </v-btn>

      <v-divider vertical class="mx-2" />

      <!-- Language Selector -->
      <v-menu>
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-translate</v-icon>
            <v-tooltip activator="parent" location="bottom">{{ t('toolbar.language') }}</v-tooltip>
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

      <v-divider vertical class="mx-2" />

      <v-btn icon color="accent" @click="showNewBeatDialog = true" aria-label="Add beat">
        <v-icon>mdi-plus-circle</v-icon>
        <v-tooltip activator="parent" location="bottom">{{ t('toolbar.addBeat') }}</v-tooltip>
      </v-btn>

      <v-btn icon color="secondary" @click="handleCreateGroup" aria-label="Create group">
        <v-icon>mdi-group</v-icon>
        <v-tooltip activator="parent" location="bottom">{{ t('toolbar.createGroup') }}</v-tooltip>
      </v-btn>
    </v-app-bar>

    <!-- Beat Canvas (shown in canvas mode) -->
    <v-sheet 
      v-if="viewMode === 'canvas'" 
      class="beat-canvas-container"
      @mousedown="handleCanvasMouseDown"
      @mousemove="handleCanvasMouseMove"
      @mouseup="handleCanvasMouseUp"
      @mouseleave="handleCanvasMouseUp"
      @touchstart="handleCanvasTouchStart"
      @touchmove="handleCanvasTouchMove"
      @touchend="handleCanvasTouchEnd"
      @touchcancel="handleCanvasTouchEnd"
      :style="{ cursor: isPanning ? 'grabbing' : 'grab' }"
    >
      <div
        ref="canvasRef"
        class="beat-canvas"
        :style="{ 
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`, 
          transformOrigin: 'top left' 
        }"
      >
        <!-- Beat Group Cards (rendered first, lower z-index) -->
        <BeatGroupCard
          v-for="group in project.beatGroups"
          :key="group.id"
          :group="group"
          :zoom="zoom"
          :is-hovered="hoveredGroupId === group.id"
          @click="selectGroup"
          @dragstart="handleGroupDragStart"
          @dragmove="handleGroupDragMove"
          @dragend="handleGroupDragEnd"
          @delete="handleDeleteGroup"
        />

        <!-- Group Connection Lines (from group header to first beat) -->
        <GroupConnectionLine
          v-for="group in project.beatGroups.filter(g => g.beatIds.length > 0)"
          :key="`group-line-${group.id}`"
          :group="group"
          :beat="project.beats.find(b => b.id === group.beatIds[0])!"
        />

        <!-- Beat Cards -->
        <BeatCard
          v-for="beat in project.beats"
          :key="beat.id"
          :beat="beat"
          :beat-type="getBeatType(beat.typeId)"
          :is-group-dragging="isDraggingGroup"
          @click="selectBeat(beat)"
          @dragstart="handleBeatDragStart"
          @dragmove="handleBeatDragMove"
          @dragend="handleBeatDragEnd"
          @delete="handleDeleteBeat"
        />
      </div>
    </v-sheet>

    <!-- Beat Grid (shown in grid mode) -->
    <v-sheet v-else class="beat-grid-container">
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
import type { Beat, BeatType, Project, BeatGroup } from '@/domain/entities'
import { projectService } from '@/application/ProjectService'
import BeatCard from '@/presentation/components/BeatCard.vue'
import BeatGroupCard from '@/presentation/components/BeatGroupCard.vue'
import GroupConnectionLine from '@/presentation/components/GroupConnectionLine.vue'
import PropertiesPanel from '@/presentation/components/PropertiesPanel.vue'
import BeatTypeSelectDialog from '@/presentation/components/BeatTypeSelectDialog.vue'
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
  type: 'project' | 'beat'
  data: Project | Beat
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

// Beat-to-Group hover state (for highlighting groups during beat drag)
const hoveredGroupId = ref<string | null>(null)

// Constants
const BEAT_HEIGHT = 80 // Must match constant in ProjectService

// View mode: 'canvas' or 'grid', persisted in localStorage
const VIEW_MODE_KEY = 'escaleta-view-mode'
const viewMode = ref<'canvas' | 'grid'>(
  (localStorage.getItem(VIEW_MODE_KEY) as 'canvas' | 'grid') || 'canvas'
)

// Computed property to get beats sorted by order
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

function handleUpdateProject(updatedProject: Project) {
  project.value = updatedProject
  projectService.saveCurrentProject(project.value)
  // Update selected entity to reflect changes
  if (selectedEntity.value?.type === 'project') {
    selectedEntity.value.data = updatedProject
  }
}

function handleUpdateBeat(updatedBeat: Beat) {
  project.value = projectService.updateBeat(project.value, updatedBeat.id, updatedBeat)
  projectService.saveCurrentProject(project.value)
  // Update selected entity to reflect changes
  if (selectedEntity.value?.type === 'beat') {
    selectedEntity.value.data = updatedBeat
  }
}

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
  const newProject = projectService.createDefaultProject()
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
  
  // Check if dropped into a BeatGroup
  if (hoveredGroupId.value) {
    project.value = projectService.dropBeatIntoGroup(project.value, beatId, hoveredGroupId.value)
    
    // Clear drag state
    isDraggingBeat.value = false
    draggingBeatId.value = null
    hoveredGroupId.value = null
    
    // Save project
    projectService.saveCurrentProject(project.value)
    console.log('Beat dropped into group')
    return
  }
  
  // Clear drag state
  isDraggingBeat.value = false
  draggingBeatId.value = null
  hoveredGroupId.value = null
  
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
}

function handleGroupDragEnd(groupId: string) {
  if (!isDraggingGroup.value || draggingGroupId.value !== groupId) return
  
  isDraggingGroup.value = false
  draggingGroupId.value = null
  
  // Save project with updated group position
  projectService.saveCurrentProject(project.value)
  console.log('Group position saved')
}

// Detect if dragged beat is over a BeatGroup
function detectGroupHover(beatX: number, beatY: number) {
  const BEAT_WIDTH = 400
  const BEAT_HEIGHT = 80
  const GROUP_WIDTH = 430
  const GROUP_HEIGHT = 50
  
  const beatLeft = beatX
  const beatRight = beatX + BEAT_WIDTH
  const beatTop = beatY
  const beatBottom = beatY + BEAT_HEIGHT
  
  // First check if beat is over ANY beat in ANY group
  for (const group of project.value.beatGroups) {
    if (group.beatIds.length === 0) continue
    
    for (const beatId of group.beatIds) {
      const groupBeat = project.value.beats.find((b: Beat) => b.id === beatId)
      if (!groupBeat) continue
      
      const groupBeatLeft = groupBeat.position.x
      const groupBeatRight = groupBeat.position.x + BEAT_WIDTH
      const groupBeatTop = groupBeat.position.y
      const groupBeatBottom = groupBeat.position.y + BEAT_HEIGHT
      
      const hasOverlapWithBeat = (
        beatRight > groupBeatLeft &&
        beatLeft < groupBeatRight &&
        beatBottom > groupBeatTop &&
        beatTop < groupBeatBottom
      )
      
      if (hasOverlapWithBeat) {
        // We're over a beat in the group, don't activate group hover
        // (Drop on beats in group not implemented yet)
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
    
    // Check if there's overlap with the header ONLY
    const hasOverlap = (
      beatRight > groupLeft &&
      beatLeft < groupRight &&
      beatBottom > groupTop &&
      beatTop < groupBottom
    )
    
    if (hasOverlap) {
      hoveredGroupId.value = group.id
      return
    }
  }
  
  // No collision found
  hoveredGroupId.value = null
}

// Group editing handlers
function selectGroup(group: BeatGroup) {
  selectedEntity.value = {
    type: 'group',
    data: group
  }
  console.log('Group selected:', group.name)
}

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
