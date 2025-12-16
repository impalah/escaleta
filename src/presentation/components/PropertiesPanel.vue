<template>
  <div 
    class="properties-panel-container"
    :class="{ 
      'panel-right': anchorSide === 'right',
      'panel-left': anchorSide === 'left',
      'panel-maximized': isMaximized
    }"
    :style="{ width: isMaximized ? '100vw' : panelWidth + 'px' }"
  >
    <!-- Side tab (always visible) -->
    <div class="side-tab">
      <div class="tab-content">
        <span class="tab-text">{{ tabText }}</span>
      </div>
    </div>

    <!-- Main panel content -->
    <div class="panel-content">
      <!-- Header with controls -->
      <div class="panel-header">
        <v-btn
          icon
          size="small"
          variant="text"
          :color="isMaximized ? 'primary' : 'default'"
          class="mr-2"
          @click="toggleMaximize"
        >
          <v-icon>{{ isMaximized ? 'mdi-window-restore' : 'mdi-window-maximize' }}</v-icon>
          <v-tooltip
            activator="parent"
            location="bottom"
          >
            {{ isMaximized ? t('propertiesPanel.restore') : t('propertiesPanel.maximize') }}
          </v-tooltip>
        </v-btn>

        <v-btn
          icon
          size="small"
          variant="text"
          @click="toggleAnchor"
        >
          <v-icon>{{ anchorSide === 'right' ? 'mdi-dock-left' : 'mdi-dock-right' }}</v-icon>
          <v-tooltip
            activator="parent"
            location="bottom"
          >
            {{ anchorSide === 'right' ? t('propertiesPanel.dockLeft') : t('propertiesPanel.dockRight') }}
          </v-tooltip>
        </v-btn>
      </div>

      <!-- Properties form content -->
      <div class="panel-body">
        <ProjectPropertiesForm 
          v-if="selectedEntity?.type === 'project'"
          :project="selectedEntity.data as Project"
          @update="handleProjectUpdate"
        />
        <BeatPropertiesForm 
          v-else-if="selectedEntity?.type === 'beat'"
          :beat="selectedEntity.data as Beat"
          :beat-types="beatTypes"
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
      </div>
    </div>

    <!-- Resize handle -->
    <div 
      class="resize-handle"
      @mousedown="startResize"
    >
      <v-icon
        size="small"
        class="resize-icon"
      >
        {{ anchorSide === 'right' ? 'mdi-drag-vertical' : 'mdi-drag-vertical' }}
      </v-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Beat, BeatType, Project, BeatGroup, Block, Lane } from '@/domain/entities'
import ProjectPropertiesForm from './ProjectPropertiesForm.vue'
import BeatPropertiesForm from './BeatPropertiesForm.vue'
import GroupPropertiesForm from './GroupPropertiesForm.vue'
import BlockPropertiesForm from './BlockPropertiesForm.vue'
import LanePropertiesForm from './LanePropertiesForm.vue'

const { t } = useI18n()

interface SelectedEntity {
  type: 'project' | 'beat' | 'group' | 'block' | 'lane'
  data: Project | Beat | BeatGroup | Block | Lane
}

const props = defineProps<{
  selectedEntity: SelectedEntity | null
  beatTypes: BeatType[]
}>()

const emit = defineEmits<{
  updateProject: [project: Project]
  updateBeat: [beat: Beat]
  updateGroup: [group: BeatGroup]
  updateBlock: [block: Block]
  updateLane: [lane: Lane]
}>()

// Panel state
const isMaximized = ref(false)
const anchorSide = ref<'left' | 'right'>('right')
const panelWidth = ref(300)
const panelWidthBeforeMaximize = ref(300)

// Resize state
const isResizing = ref(false)
const resizeStartX = ref(0)
const resizeStartWidth = ref(0)

// Tab text
const tabText = computed(() => {
  if (!props.selectedEntity) return t('propertiesPanel.project').toUpperCase()
  
  if (props.selectedEntity.type === 'project') {
    const projectData = props.selectedEntity.data as Project
    return `${t('propertiesPanel.project').toUpperCase()} - ${projectData.name}`
  } else if (props.selectedEntity.type === 'beat') {
    const beatData = props.selectedEntity.data as Beat
    return `BEAT - ${beatData.title}`
  } else if (props.selectedEntity.type === 'group') {
    const groupData = props.selectedEntity.data as BeatGroup
    return `${t('propertiesPanel.group').toUpperCase()} - ${groupData.name}`
  } else if (props.selectedEntity.type === 'block') {
    const blockData = props.selectedEntity.data as Block
    return `BLOCK - ${blockData.name}`
  } else if (props.selectedEntity.type === 'lane') {
    const laneData = props.selectedEntity.data as Lane
    return `LANE - ${laneData.name}`
  }
  
  return t('propertiesPanel.project').toUpperCase()
})

function toggleMaximize() {
  if (isMaximized.value) {
    // Restore previous width
    panelWidth.value = panelWidthBeforeMaximize.value
    isMaximized.value = false
  } else {
    // Save current width before maximizing
    panelWidthBeforeMaximize.value = panelWidth.value
    isMaximized.value = true
  }
  // Save state to localStorage
  localStorage.setItem('escaleta-properties-panel-maximized', JSON.stringify(isMaximized.value))
  localStorage.setItem('escaleta-properties-panel-width-before-maximize', String(panelWidthBeforeMaximize.value))
}

function toggleAnchor() {
  anchorSide.value = anchorSide.value === 'right' ? 'left' : 'right'
  // Save preference to localStorage
  localStorage.setItem('escaleta-properties-panel-anchor', anchorSide.value)
}

function handleProjectUpdate(project: Project) {
  emit('updateProject', project)
}

function handleBeatUpdate(beat: Beat) {
  emit('updateBeat', beat)
}

function handleGroupUpdate(group: BeatGroup) {
  emit('updateGroup', group)
}

function handleBlockUpdate(block: Block) {
  emit('updateBlock', block)
}

function handleLaneUpdate(lane: Lane) {
  emit('updateLane', lane)
}

// Resize functionality
function startResize(event: MouseEvent) {
  event.preventDefault()
  isResizing.value = true
  resizeStartX.value = event.clientX
  resizeStartWidth.value = panelWidth.value
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

function handleResize(event: MouseEvent) {
  if (!isResizing.value) return
  if (isMaximized.value) return // Don't allow resize when maximized
  
  const deltaX = anchorSide.value === 'right' 
    ? resizeStartX.value - event.clientX
    : event.clientX - resizeStartX.value
  
  const newWidth = Math.max(200, resizeStartWidth.value + deltaX) // Only minimum 200px, no maximum
  panelWidth.value = newWidth
  
  // Save to localStorage
  localStorage.setItem('escaleta-properties-panel-width', String(newWidth))
}

function stopResize() {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

// Load preferences from localStorage on mount
const savedMaximized = localStorage.getItem('escaleta-properties-panel-maximized')
if (savedMaximized) {
  isMaximized.value = JSON.parse(savedMaximized)
}

const savedAnchor = localStorage.getItem('escaleta-properties-panel-anchor')
if (savedAnchor === 'left' || savedAnchor === 'right') {
  anchorSide.value = savedAnchor
}

const savedWidth = localStorage.getItem('escaleta-properties-panel-width')
if (savedWidth) {
  panelWidth.value = parseInt(savedWidth, 10)
}

const savedWidthBeforeMaximize = localStorage.getItem('escaleta-properties-panel-width-before-maximize')
if (savedWidthBeforeMaximize) {
  panelWidthBeforeMaximize.value = parseInt(savedWidthBeforeMaximize, 10)
}
</script>

<style scoped>
.properties-panel-container {
  position: fixed;
  top: 64px; /* Height of app bar */
  bottom: 0;
  z-index: 100;
  display: flex;
  transition: transform 0.3s ease-in-out;
}

.properties-panel-container.panel-right {
  right: 0;
  flex-direction: row-reverse;
}

.properties-panel-container.panel-left {
  left: 0;
  flex-direction: row;
}

/* Maximized state */
.properties-panel-container.panel-maximized {
  left: 0 !important;
  right: 0 !important;
}

.properties-panel-container.panel-maximized .side-tab {
  display: none;
}

.properties-panel-container.panel-maximized .resize-handle {
  display: none;
}

/* Side tab */
.side-tab {
  width: 40px;
  background-color: #424242;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: -2px 0 4px rgba(0, 0, 0, 0.2);
}

.panel-left .side-tab {
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.2);
}

.tab-content {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  white-space: nowrap;
  padding: 16px 0;
}

.tab-text {
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* Main panel content */
.panel-content {
  flex: 1;
  background-color: #2d2d2d;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: -4px 0 8px rgba(0, 0, 0, 0.3);
}

.panel-left .panel-content {
  box-shadow: 4px 0 8px rgba(0, 0, 0, 0.3);
}

.panel-header {
  padding: 12px;
  border-bottom: 1px solid #444;
  display: flex;
  align-items: center;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 32px;
}

.empty-state p {
  margin-top: 16px;
}

/* Resize handle */
.resize-handle {
  width: 4px;
  background-color: #555;
  cursor: ew-resize;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.resize-handle:hover {
  background-color: #666;
}

.resize-icon {
  color: #888;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

/* Scrollbar styling */
.panel-body::-webkit-scrollbar {
  width: 8px;
}

.panel-body::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.panel-body::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

.panel-body::-webkit-scrollbar-thumb:hover {
  background: #666;
}
</style>
