<template>
  <v-container fluid class="pa-0 fill-height">
    <!-- App Bar -->
    <v-app-bar color="primary" density="compact" elevation="2">
      <v-toolbar-title>{{ project.name }}</v-toolbar-title>

      <v-spacer />

      <!-- Toolbar buttons -->
      <v-btn icon @click="handleNewProject" aria-label="New project">
        <v-icon>mdi-file-plus</v-icon>
        <v-tooltip activator="parent" location="bottom">Nuevo Proyecto</v-tooltip>
      </v-btn>

      <v-btn icon @click="handleSave" aria-label="Save project">
        <v-icon>mdi-content-save</v-icon>
        <v-tooltip activator="parent" location="bottom">Guardar</v-tooltip>
      </v-btn>

      <v-menu>
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-export</v-icon>
            <v-tooltip activator="parent" location="bottom">Exportar</v-tooltip>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="handleExportJSON">
            <v-list-item-title>Exportar a JSON</v-list-item-title>
          </v-list-item>
          <v-list-item @click="handleExportScript">
            <v-list-item-title>Exportar a Guion</v-list-item-title>
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
          <v-tooltip activator="parent" location="bottom">Vista Canvas</v-tooltip>
        </v-btn>
        <v-btn value="grid" size="small" aria-label="Grid view">
          <v-icon>mdi-view-list</v-icon>
          <v-tooltip activator="parent" location="bottom">Vista Grid</v-tooltip>
        </v-btn>
      </v-btn-toggle>

      <v-divider vertical class="mx-2" />

      <v-btn icon @click="handleZoomIn">
        <v-icon>mdi-magnify-plus</v-icon>
        <v-tooltip activator="parent" location="bottom">Zoom +</v-tooltip>
      </v-btn>

      <v-btn icon @click="handleZoomOut">
        <v-icon>mdi-magnify-minus</v-icon>
        <v-tooltip activator="parent" location="bottom">Zoom -</v-tooltip>
      </v-btn>

      <v-divider vertical class="mx-2" />

      <v-btn icon color="accent" @click="showNewBeatDialog = true" aria-label="Add beat">
        <v-icon>mdi-plus-circle</v-icon>
        <v-tooltip activator="parent" location="bottom">Añadir Beat</v-tooltip>
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
        <!-- Beat Cards -->
        <BeatCard
          v-for="beat in project.beats"
          :key="beat.id"
          :beat="beat"
          :beat-type="getBeatType(beat.typeId)"
          :magnet-zone="magnetZones.get(beat.id) || null"
          @click="openEditDialog(beat)"
          @dragstart="handleBeatDragStart"
          @dragmove="handleBeatDragMove"
          @dragend="handleBeatDragEnd"
        />
      </div>
    </v-sheet>

    <!-- Beat Grid (shown in grid mode) -->
    <v-sheet v-else class="beat-grid-container">
      <BeatGridView
        :beats="sortedBeats"
        :beat-types="project.beatTypes"
        @beat-click="openEditDialog"
      />
    </v-sheet>

    <!-- Edit Beat Dialog -->
    <BeatEditDialog
      v-model="showEditDialog"
      :beat="selectedBeat"
      :beat-types="project.beatTypes"
      @save="handleSaveBeat"
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
import type { Beat, BeatType, Project } from '@/domain/entities'
import { projectService } from '@/application/ProjectService'
import BeatCard from '@/presentation/components/BeatCard.vue'
import BeatEditDialog from '@/presentation/components/BeatEditDialog.vue'
import BeatTypeSelectDialog from '@/presentation/components/BeatTypeSelectDialog.vue'
import BeatGridView from '@/presentation/components/BeatGridView.vue'

const project = ref<Project>(projectService.loadCurrentProject())

// Zoom state with persistence
const ZOOM_KEY = 'escaleta-canvas-zoom'
const savedZoom = localStorage.getItem(ZOOM_KEY)
const zoom = ref(savedZoom ? parseFloat(savedZoom) : 1)

const showEditDialog = ref(false)
const showNewBeatDialog = ref(false)
const selectedBeat = ref<Beat | null>(null)
const canvasRef = ref<HTMLElement | null>(null)

// Pan state for canvas dragging
const isPanning = ref(false)
const PAN_OFFSET_KEY = 'escaleta-canvas-pan-offset'
const savedPanOffset = localStorage.getItem(PAN_OFFSET_KEY)
const panOffset = ref(savedPanOffset ? JSON.parse(savedPanOffset) : { x: 0, y: 0 })
const panStart = ref({ x: 0, y: 0 })
const lastPanOffset = ref({ x: 0, y: 0 })

// Beat drag state
const isDraggingBeat = ref(false)
const draggingBeatId = ref<string | null>(null)
const beatDragStartPosition = ref({ x: 0, y: 0 })

// Magnet zones state
const magnetZones = ref<Map<string, 'top' | 'bottom'>>(new Map())

// Constants for magnet zone detection
const BEAT_HEIGHT = 80 // Must match constant in ProjectService
const MAGNET_OVERLAP_THRESHOLD = 0.5 // 50% overlap required

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

function openEditDialog(beat: Beat) {
  selectedBeat.value = beat
  showEditDialog.value = true
}

function handleSaveBeat(updates: Partial<Beat>) {
  if (!selectedBeat.value) return

  project.value = projectService.updateBeat(project.value, selectedBeat.value.id, updates)
  projectService.saveCurrentProject(project.value)

  showEditDialog.value = false
  selectedBeat.value = null
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
  // TODO: Implement new project dialog
  console.log('TODO: New project')
}

function handleExportJSON() {
  // TODO: Implement JSON export
  console.log('TODO: Export to JSON')
}

function handleExportScript() {
  // TODO: Implement script export
  console.log('TODO: Export to script format')
}

function handleZoomIn() {
  zoom.value = Math.min(zoom.value + 0.1, 2)
}

function handleZoomOut() {
  zoom.value = Math.max(zoom.value - 0.1, 0.5)
}

// Canvas panning handlers
function handleCanvasMouseDown(event: MouseEvent) {
  // Don't pan if dragging a beat or clicking on a beat card
  if (isDraggingBeat.value) return
  
  const target = event.target as HTMLElement
  if (target.closest('[data-testid="beat-card"]')) {
    return // Clicked on a beat card, don't pan
  }

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

// Beat drag handlers
function handleBeatDragStart(beatId: string) {
  isDraggingBeat.value = true
  draggingBeatId.value = beatId
  
  const beat = project.value.beats.find(b => b.id === beatId)
  if (beat) {
    beatDragStartPosition.value = { ...beat.position }
  }
}

function handleBeatDragMove(beatId: string, deltaX: number, deltaY: number) {
  if (!isDraggingBeat.value || draggingBeatId.value !== beatId) return
  
  // Calculate new position accounting for zoom
  const newX = beatDragStartPosition.value.x + (deltaX / zoom.value)
  const newY = beatDragStartPosition.value.y + (deltaY / zoom.value)
  
  // Update beat position in project (allow negative coordinates)
  const beatIndex = project.value.beats.findIndex(b => b.id === beatId)
  if (beatIndex !== -1) {
    project.value.beats[beatIndex] = {
      ...project.value.beats[beatIndex],
      position: { x: newX, y: newY },
      updatedAt: new Date().toISOString()
    }
  }
  
  // Detect magnet zone overlaps with other beats
  detectMagnetZones(beatId, newX, newY)
}

function detectMagnetZones(draggingBeatId: string, beatX: number, beatY: number) {
  const newMagnetZones = new Map<string, 'top' | 'bottom'>()
  const BEAT_WIDTH = 200 // BeatCard width
  
  // Check overlap with each beat (except the dragging beat itself)
  for (const targetBeat of project.value.beats) {
    if (targetBeat.id === draggingBeatId) continue
    
    // Calculate bounding boxes
    const draggedLeft = beatX
    const draggedRight = beatX + BEAT_WIDTH
    const draggedTop = beatY
    const draggedBottom = beatY + BEAT_HEIGHT
    const draggedMidY = beatY + BEAT_HEIGHT / 2
    
    const targetLeft = targetBeat.position.x
    const targetRight = targetBeat.position.x + BEAT_WIDTH
    const targetTop = targetBeat.position.y
    const targetBottom = targetBeat.position.y + BEAT_HEIGHT
    const targetMidY = targetBeat.position.y + BEAT_HEIGHT / 2
    
    // Check horizontal overlap
    const hasHorizontalOverlap = draggedRight > targetLeft && draggedLeft < targetRight
    if (!hasHorizontalOverlap) continue
    
    // Calculate vertical overlap
    const overlapTop = Math.max(draggedTop, targetTop)
    const overlapBottom = Math.min(draggedBottom, targetBottom)
    const overlapHeight = Math.max(0, overlapBottom - overlapTop)
    const overlapRatio = overlapHeight / BEAT_HEIGHT
    
    // Check if overlap exceeds threshold
    if (overlapRatio < MAGNET_OVERLAP_THRESHOLD) continue
    
    // Determine which zone: top if dragged beat's center is above target's center
    if (draggedMidY < targetMidY) {
      newMagnetZones.set(targetBeat.id, 'top')
    } else {
      newMagnetZones.set(targetBeat.id, 'bottom')
    }
  }
  
  magnetZones.value = newMagnetZones
}

function handleBeatDragEnd(beatId: string) {
  if (!isDraggingBeat.value || draggingBeatId.value !== beatId) return
  
  // Check if dragged beat landed on a magnet zone
  let connectionMade = false
  for (const [targetBeatId, zone] of magnetZones.value.entries()) {
    if (zone === 'top') {
      project.value = projectService.connectToTop(project.value, beatId, targetBeatId)
      connectionMade = true
    } else if (zone === 'bottom') {
      project.value = projectService.connectToBottom(project.value, beatId, targetBeatId)
      connectionMade = true
    }
    
    // Only connect to first magnet zone found
    break
  }
  
  // Clear drag state
  isDraggingBeat.value = false
  draggingBeatId.value = null
  magnetZones.value.clear()
  
  // Save project with updated position and connections
  projectService.saveCurrentProject(project.value)
  console.log(connectionMade ? 'Beat connected' : 'Beat position saved')
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
