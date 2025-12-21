<template>
  <div 
    class="properties-panel-container"
    :class="{ 
      'panel-right': !isHorizontal && anchorPosition === 'right',
      'panel-left': !isHorizontal && anchorPosition === 'left',
      'panel-top': isHorizontal && anchorPosition === 'top',
      'panel-bottom': isHorizontal && anchorPosition === 'bottom',
      'panel-maximized': isMaximized,
      'panel-collapsed': isCollapsed,
      'panel-horizontal': isHorizontal
    }"
    :style="panelStyle"
  >
    <!-- Side tab (always visible) -->
    <div 
      class="side-tab"
      @click="toggleCollapse"
      :title="`Collapsed: ${isCollapsed}, Horizontal: ${isHorizontal}, Anchor: ${anchorPosition}`"
    >
      <div class="tab-content">
        <v-icon
          v-if="isCollapsed"
          size="small"
          class="collapse-icon"
        >
          {{ collapseIcon }}
        </v-icon>
        <template v-else>
          <!-- Control buttons container -->
          <div class="tab-buttons">
            <v-btn
              icon
              size="small"
              variant="text"
              color="white"
              :class="{ 'active-control': isMaximized }"
              @click.stop="toggleMaximize"
            >
              <v-icon>{{ isMaximized ? 'mdi-window-restore' : 'mdi-window-maximize' }}</v-icon>
              <v-tooltip
                activator="parent"
                location="top"
              >
                {{ isMaximized ? t('propertiesPanel.restore') : t('propertiesPanel.maximize') }}
              </v-tooltip>
            </v-btn>

            <v-btn
              icon
              size="small"
              variant="text"
              color="white"
              @click.stop="toggleAnchor"
            >
              <v-icon>{{ anchorIcon }}</v-icon>
              <v-tooltip
                activator="parent"
                location="top"
              >
                {{ anchorTooltip }}
              </v-tooltip>
            </v-btn>
          </div>

          <div class="flex-spacer" />

          <!-- Title container -->
          <div class="tab-title-container">
            <span class="tab-text">{{ tabText }}</span>
          </div>
        </template>
      </div>
    </div>

    <!-- Main panel content -->
    <div 
      v-if="!isCollapsed"
      class="panel-content"
    >
      <!-- Properties form content via slot -->
      <div class="panel-body">
        <slot name="content">
          <!-- Default content when no slot provided -->
          <div class="empty-state">
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
        </slot>
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
        {{ isHorizontal ? 'mdi-drag-horizontal' : 'mdi-drag-vertical' }}
      </v-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  title?: string
  orientation?: 'vertical' | 'horizontal'
}>(), {
  title: '',
  orientation: 'vertical'
})

// Use explicit orientation prop
const isHorizontal = computed(() => props.orientation === 'horizontal')

// Panel state
const isMaximized = ref(false)
const isCollapsed = ref(false)
const anchorPosition = ref<'left' | 'right' | 'top' | 'bottom'>('right')
const panelWidth = ref(300)
const panelHeight = ref(250)
const panelWidthBeforeMaximize = ref(300)
const panelHeightBeforeMaximize = ref(250)

// Resize state
const isResizing = ref(false)
const resizeStartX = ref(0)
const resizeStartY = ref(0)
const resizeStartWidth = ref(0)
const resizeStartHeight = ref(0)

// Dynamic styles
const panelStyle = computed(() => {
  if (isHorizontal.value) {
    // Horizontal mode (top/bottom)
    if (isMaximized.value) {
      // When maximized, account for app bar height (64px)
      return { height: 'calc(100vh - 64px)' }
    }
    return { 
      height: isCollapsed.value ? '40px' : panelHeight.value + 'px'
    }
  } else {
    // Vertical mode (left/right)
    if (isMaximized.value) {
      return { width: '100vw' }
    }
    return { 
      width: isCollapsed.value ? '40px' : panelWidth.value + 'px'
    }
  }
})

// Collapse icon
const collapseIcon = computed(() => {
  if (isHorizontal.value) {
    return anchorPosition.value === 'top' ? 'mdi-chevron-up' : 'mdi-chevron-down'
  } else {
    return anchorPosition.value === 'right' ? 'mdi-chevron-left' : 'mdi-chevron-right'
  }
})

// Anchor icon and tooltip
const anchorIcon = computed(() => {
  if (isHorizontal.value) {
    return anchorPosition.value === 'top' ? 'mdi-dock-bottom' : 'mdi-dock-top'
  } else {
    return anchorPosition.value === 'right' ? 'mdi-dock-left' : 'mdi-dock-right'
  }
})

const anchorTooltip = computed(() => {
  if (isHorizontal.value) {
    return anchorPosition.value === 'top' ? t('propertiesPanel.dockBottom') : t('propertiesPanel.dockTop')
  } else {
    return anchorPosition.value === 'right' ? t('propertiesPanel.dockLeft') : t('propertiesPanel.dockRight')
  }
})

// Tab text - use provided title or default
const tabText = computed(() => {
  return props.title || t('propertiesPanel.properties').toUpperCase()
})

function toggleMaximize() {
  if (isMaximized.value) {
    // Restore previous size
    if (isHorizontal.value) {
      panelHeight.value = panelHeightBeforeMaximize.value
    } else {
      panelWidth.value = panelWidthBeforeMaximize.value
    }
    isMaximized.value = false
  } else {
    // Save current size before maximizing
    if (isHorizontal.value) {
      panelHeightBeforeMaximize.value = panelHeight.value
    } else {
      panelWidthBeforeMaximize.value = panelWidth.value
    }
    isMaximized.value = true
  }
  // Save state to localStorage
  localStorage.setItem('escaleta-properties-panel-maximized', JSON.stringify(isMaximized.value))
  if (isHorizontal.value) {
    localStorage.setItem('escaleta-properties-panel-height-before-maximize', String(panelHeightBeforeMaximize.value))
  } else {
    localStorage.setItem('escaleta-properties-panel-width-before-maximize', String(panelWidthBeforeMaximize.value))
  }
}

function toggleAnchor() {
  if (isHorizontal.value) {
    anchorPosition.value = anchorPosition.value === 'top' ? 'bottom' : 'top'
  } else {
    anchorPosition.value = anchorPosition.value === 'right' ? 'left' : 'right'
  }
  // Save preference to localStorage
  localStorage.setItem('escaleta-properties-panel-anchor', anchorPosition.value)
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
  // Save preference to localStorage
  localStorage.setItem('escaleta-properties-panel-collapsed', JSON.stringify(isCollapsed.value))
}

// Resize functionality
function startResize(event: MouseEvent) {
  event.preventDefault()
  isResizing.value = true
  
  if (isHorizontal.value) {
    resizeStartY.value = event.clientY
    resizeStartHeight.value = panelHeight.value
  } else {
    resizeStartX.value = event.clientX
    resizeStartWidth.value = panelWidth.value
  }
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

function handleResize(event: MouseEvent) {
  if (!isResizing.value) return
  if (isMaximized.value) return // Don't allow resize when maximized
  
  if (isHorizontal.value) {
    // Horizontal resize (top/bottom)
    const deltaY = anchorPosition.value === 'top' 
      ? event.clientY - resizeStartY.value 
      : resizeStartY.value - event.clientY
    const newHeight = Math.max(150, resizeStartHeight.value + deltaY)
    panelHeight.value = newHeight
    
    // Save to localStorage
    localStorage.setItem('escaleta-properties-panel-height', String(newHeight))
  } else {
    // Vertical resize (left/right)
    const deltaX = anchorPosition.value === 'right' 
      ? resizeStartX.value - event.clientX
      : event.clientX - resizeStartX.value
    
    const newWidth = Math.max(200, resizeStartWidth.value + deltaX)
    panelWidth.value = newWidth
    
    // Save to localStorage
    localStorage.setItem('escaleta-properties-panel-width', String(newWidth))
  }
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
if (props.orientation === 'horizontal') {
  // For horizontal mode, only use top/bottom
  if (savedAnchor === 'top' || savedAnchor === 'bottom') {
    anchorPosition.value = savedAnchor
  } else {
    anchorPosition.value = 'bottom' // Default for horizontal
  }
} else {
  // For vertical mode, only use left/right
  if (savedAnchor === 'left' || savedAnchor === 'right') {
    anchorPosition.value = savedAnchor
  } else {
    anchorPosition.value = 'right' // Default for vertical
  }
}

const savedWidth = localStorage.getItem('escaleta-properties-panel-width')
if (savedWidth) {
  panelWidth.value = parseInt(savedWidth, 10)
}

const savedHeight = localStorage.getItem('escaleta-properties-panel-height')
if (savedHeight) {
  panelHeight.value = parseInt(savedHeight, 10)
}

const savedWidthBeforeMaximize = localStorage.getItem('escaleta-properties-panel-width-before-maximize')
if (savedWidthBeforeMaximize) {
  panelWidthBeforeMaximize.value = parseInt(savedWidthBeforeMaximize, 10)
}

const savedHeightBeforeMaximize = localStorage.getItem('escaleta-properties-panel-height-before-maximize')
if (savedHeightBeforeMaximize) {
  panelHeightBeforeMaximize.value = parseInt(savedHeightBeforeMaximize, 10)
}

const savedCollapsed = localStorage.getItem('escaleta-properties-panel-collapsed')
if (savedCollapsed) {
  isCollapsed.value = JSON.parse(savedCollapsed)
}
</script>

<style scoped>
.properties-panel-container {
  position: fixed;
  z-index: 900;
  display: flex;
  transition: transform 0.3s ease-in-out;
}

/* Vertical mode (left/right) */
.properties-panel-container:not(.panel-horizontal) {
  top: 64px; /* Height of app bar */
  bottom: 0;
}

.properties-panel-container.panel-right {
  right: 0;
  flex-direction: row-reverse;
}

.properties-panel-container.panel-left {
  left: 0;
  flex-direction: row;
}

/* Horizontal mode (top/bottom) */
.properties-panel-container.panel-horizontal {
  left: 0;
  right: 0;
}

.properties-panel-container.panel-top {
  top: 64px; /* Height of app bar */
  flex-direction: column;
}

.properties-panel-container.panel-bottom {
  bottom: 0;
  flex-direction: column-reverse;
}

/* Maximized state */
.properties-panel-container.panel-maximized:not(.panel-horizontal) {
  left: 0 !important;
  right: 0 !important;
}

.properties-panel-container.panel-maximized.panel-horizontal {
  top: 64px !important;
  bottom: 0 !important;
}

.properties-panel-container.panel-maximized .resize-handle {
  display: none;
}

/* Collapsed state */
.properties-panel-container.panel-collapsed .resize-handle {
  display: none;
}

/* Side tab (vertical mode) */
.side-tab {
  background-color: #424242;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: background-color 0.2s;
}

/* Vertical mode tab */
.properties-panel-container:not(.panel-horizontal) .side-tab {
  width: 40px;
  box-shadow: -2px 0 4px rgba(0, 0, 0, 0.2);
}

/* Horizontal mode tab */
.properties-panel-container.panel-horizontal .side-tab {
  height: 40px;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.2);
}

.properties-panel-container.panel-bottom .side-tab {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.side-tab:hover {
  background-color: #505050;
}

.panel-left .side-tab {
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.2);
}

/* Tab content - vertical mode */
.properties-panel-container:not(.panel-horizontal) .tab-content {
  white-space: nowrap;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  height: 100%;
}

/* Tab content - horizontal mode */
.properties-panel-container.panel-horizontal .tab-content {
  white-space: nowrap;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

/* Buttons container */
.tab-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.properties-panel-container.panel-horizontal .tab-buttons {
  flex-direction: row;
}

/* Title container - only this gets rotated in vertical mode */
.tab-title-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.properties-panel-container:not(.panel-horizontal) .tab-title-container {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}

.tab-text {
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.collapse-icon {
  color: #fff;
}

/* Control buttons in tab */
.side-tab .v-btn {
  opacity: 0.9;
}

.side-tab .v-btn:hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.1);
}

.side-tab .v-btn.active-control {
  background-color: rgba(255, 255, 255, 0.15);
}

/* Flexible spacer */
.flex-spacer {
  flex: 1;
  min-height: 0;
  min-width: 0;
}

/* Spacer in vertical mode needs minimum height */
.properties-panel-container:not(.panel-horizontal) .flex-spacer {
  min-height: 60px;
}

/* Spacer in horizontal mode needs minimum width */
.properties-panel-container.panel-horizontal .flex-spacer {
  min-width: 20px;
}

/* Main panel content */
.panel-content {
  flex: 1;
  background-color: #2d2d2d;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

/* Vertical mode shadows */
.properties-panel-container:not(.panel-horizontal) .panel-content {
  box-shadow: -4px 0 8px rgba(0, 0, 0, 0.3);
}

.panel-left .panel-content {
  box-shadow: 4px 0 8px rgba(0, 0, 0, 0.3);
}

/* Horizontal mode shadows */
.properties-panel-container.panel-horizontal .panel-content {
  box-shadow: 0 -4px 8px rgba(0, 0, 0, 0.3);
}

.properties-panel-container.panel-bottom .panel-content {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  position: relative;
  z-index: 2;
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

/* Resize handle - vertical mode (left/right) */
.properties-panel-container:not(.panel-horizontal) .resize-handle {
  width: 4px;
  cursor: ew-resize;
}

/* Resize handle - horizontal mode (top/bottom) */
.properties-panel-container.panel-horizontal .resize-handle {
  height: 4px;
  cursor: ns-resize;
  width: 100%;
}

.resize-handle {
  background-color: #555;
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
}

/* Vertical mode icon */
.properties-panel-container:not(.panel-horizontal) .resize-icon {
  top: 50%;
  transform: translateY(-50%);
}

/* Horizontal mode icon */
.properties-panel-container.panel-horizontal .resize-icon {
  left: 50%;
  transform: translateX(-50%);
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
