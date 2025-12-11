<template>
  <div
    class="block-card"
    :class="{ 'is-hovered': isHovered, 'allow-overflow': isDraggingContent }"
    :style="blockStyle"
    :data-block-id="block.id"
  >
    <!-- Title bar (draggable area) -->
    <div 
      class="block-header"
      @mousedown="handleMouseDown"
      @touchstart="handleTouchStart"
    >
      <span class="block-name">{{ block.name }}</span>
      <div class="block-actions">
        <button
          class="delete-btn"
          aria-label="Delete block"
          title="Delete block"
          @click.stop="handleDelete"
        >
          <span class="delete-icon">×</span>
        </button>
      </div>
    </div>

    <!-- Content container (for beats and groups inside block) -->
    <div class="block-content">
      <slot name="content" />
    </div>

    <!-- Resize Handles -->
    <div
      class="resize-handle resize-handle-top"
      @mousedown.stop="handleResizeStart($event, 'top')"
      @touchstart.stop="handleResizeTouchStart($event, 'top')"
    />
    <div
      class="resize-handle resize-handle-right"
      @mousedown.stop="handleResizeStart($event, 'right')"
      @touchstart.stop="handleResizeTouchStart($event, 'right')"
    />
    <div
      class="resize-handle resize-handle-bottom"
      @mousedown.stop="handleResizeStart($event, 'bottom')"
      @touchstart.stop="handleResizeTouchStart($event, 'bottom')"
    />
    <div
      class="resize-handle resize-handle-left"
      @mousedown.stop="handleResizeStart($event, 'left')"
      @touchstart.stop="handleResizeTouchStart($event, 'left')"
    />

    <!-- Corner Resize Handles -->
    <div
      class="resize-handle resize-handle-top-left"
      @mousedown.stop="handleResizeStart($event, 'top-left')"
      @touchstart.stop="handleResizeTouchStart($event, 'top-left')"
    />
    <div
      class="resize-handle resize-handle-top-right"
      @mousedown.stop="handleResizeStart($event, 'top-right')"
      @touchstart.stop="handleResizeTouchStart($event, 'top-right')"
    />
    <div
      class="resize-handle resize-handle-bottom-left"
      @mousedown.stop="handleResizeStart($event, 'bottom-left')"
      @touchstart.stop="handleResizeTouchStart($event, 'bottom-left')"
    />
    <div
      class="resize-handle resize-handle-bottom-right"
      @mousedown.stop="handleResizeStart($event, 'bottom-right')"
      @touchstart.stop="handleResizeTouchStart($event, 'bottom-right')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue'
import type { Block } from '@/domain/entities'
import { useDraggable } from '@/composables/useDraggable'

const props = defineProps<{
  block: Block
  zoom?: number
  isHovered?: boolean
  isDraggingContent?: boolean // True when beats/groups are being dragged
}>()

const emit = defineEmits<{
  click: [block: Block]
  dragstart: [blockId: string]
  dragmove: [blockId: string, deltaX: number, deltaY: number]
  dragend: [blockId: string]
  resize: [blockId: string, newSize: { width: number; height: number }, newPosition?: { x: number; y: number }]
  delete: [blockId: string]
}>()

// Use draggable composable for block movement
const {
  isDragging,
  hasMoved,
  handleMouseDown: dragMouseDown,
  handleTouchStart: dragTouchStart,
  cleanup: cleanupDrag
} = useDraggable({
  elementId: props.block.id,
  dragThreshold: 3,
  onDragStart: (blockId) => {
    emit('dragstart', blockId)
  },
  onDragMove: (blockId, deltaX, deltaY) => {
    emit('dragmove', blockId, deltaX, deltaY)
  },
  onDragEnd: (blockId) => {
    emit('dragend', blockId)
    
    // If didn't move, emit click
    if (!hasMoved.value) {
      emit('click', props.block)
    }
  }
})

// Wrapper functions to handle header-specific logic
function handleMouseDown(event: MouseEvent) {
  // Don't handle if clicking on delete button
  if ((event.target as HTMLElement).closest('.delete-btn')) {
    return
  }
  
  dragMouseDown(event)
}

function handleTouchStart(event: TouchEvent) {
  // Don't handle if touching delete button
  if ((event.target as HTMLElement).closest('.delete-btn')) {
    return
  }
  
  dragTouchStart(event)
}

// Resize state (unchanged)
const isResizing = ref(false)
const resizeDirection = ref<'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null>(null)
const resizeStartPos = ref({ x: 0, y: 0 })
const resizeStartSize = ref({ width: 0, height: 0 })
const resizeStartBlockPos = ref({ x: 0, y: 0 })
const resizeTouchIdentifier = ref<number | null>(null)
const MIN_BLOCK_WIDTH = 200
const MIN_BLOCK_HEIGHT = 150

const blockStyle = computed(() => {
  const baseStyle = {
    position: 'absolute' as const,
    left: `${props.block.position.x}px`,
    top: `${props.block.position.y}px`,
    width: `${props.block.size.width}px`,
    height: `${props.block.size.height}px`,
    backgroundColor: props.block.backgroundColor,
    // No aplicar transform scale - el canvas ya aplica el zoom
    cursor: isDragging.value ? 'grabbing' : 'default',
    zIndex: (isDragging.value || isResizing.value) ? 1000 : 1 // High z-index when dragging/resizing
  }
  return baseStyle
})

// Resize handlers
function handleResizeStart(event: MouseEvent, direction: typeof resizeDirection.value) {
  if (event.button !== 0) return
  
  event.stopPropagation()
  event.preventDefault()
  
  isResizing.value = true
  resizeDirection.value = direction
  resizeStartPos.value = { x: event.clientX, y: event.clientY }
  resizeStartSize.value = { ...props.block.size }
  resizeStartBlockPos.value = { ...props.block.position }
  
  window.addEventListener('mousemove', handleResizeMove)
  window.addEventListener('mouseup', handleResizeEnd)
}

function handleResizeMove(event: MouseEvent) {
  if (!isResizing.value || !resizeDirection.value) return
  
  const zoom = props.zoom || 1
  const deltaX = (event.clientX - resizeStartPos.value.x) / zoom
  const deltaY = (event.clientY - resizeStartPos.value.y) / zoom
  
  let newWidth = resizeStartSize.value.width
  let newHeight = resizeStartSize.value.height
  let newX = resizeStartBlockPos.value.x
  let newY = resizeStartBlockPos.value.y
  
  // Calculate new size and position based on direction
  switch (resizeDirection.value) {
    case 'right':
      newWidth = Math.max(MIN_BLOCK_WIDTH, resizeStartSize.value.width + deltaX)
      break
    case 'bottom':
      newHeight = Math.max(MIN_BLOCK_HEIGHT, resizeStartSize.value.height + deltaY)
      break
    case 'left':
      newWidth = Math.max(MIN_BLOCK_WIDTH, resizeStartSize.value.width - deltaX)
      newX = resizeStartBlockPos.value.x + (resizeStartSize.value.width - newWidth)
      break
    case 'top':
      newHeight = Math.max(MIN_BLOCK_HEIGHT, resizeStartSize.value.height - deltaY)
      newY = resizeStartBlockPos.value.y + (resizeStartSize.value.height - newHeight)
      break
    case 'top-left':
      newWidth = Math.max(MIN_BLOCK_WIDTH, resizeStartSize.value.width - deltaX)
      newHeight = Math.max(MIN_BLOCK_HEIGHT, resizeStartSize.value.height - deltaY)
      newX = resizeStartBlockPos.value.x + (resizeStartSize.value.width - newWidth)
      newY = resizeStartBlockPos.value.y + (resizeStartSize.value.height - newHeight)
      break
    case 'top-right':
      newWidth = Math.max(MIN_BLOCK_WIDTH, resizeStartSize.value.width + deltaX)
      newHeight = Math.max(MIN_BLOCK_HEIGHT, resizeStartSize.value.height - deltaY)
      newY = resizeStartBlockPos.value.y + (resizeStartSize.value.height - newHeight)
      break
    case 'bottom-left':
      newWidth = Math.max(MIN_BLOCK_WIDTH, resizeStartSize.value.width - deltaX)
      newHeight = Math.max(MIN_BLOCK_HEIGHT, resizeStartSize.value.height + deltaY)
      newX = resizeStartBlockPos.value.x + (resizeStartSize.value.width - newWidth)
      break
    case 'bottom-right':
      newWidth = Math.max(MIN_BLOCK_WIDTH, resizeStartSize.value.width + deltaX)
      newHeight = Math.max(MIN_BLOCK_HEIGHT, resizeStartSize.value.height + deltaY)
      break
  }
  
  emit('resize', props.block.id, { width: newWidth, height: newHeight }, { x: newX, y: newY })
}

function handleResizeEnd() {
  if (!isResizing.value) return
  
  window.removeEventListener('mousemove', handleResizeMove)
  window.removeEventListener('mouseup', handleResizeEnd)
  
  isResizing.value = false
  resizeDirection.value = null
}

// Touch resize handlers
function handleResizeTouchStart(event: TouchEvent, direction: typeof resizeDirection.value) {
  if (event.touches.length !== 1) return
  
  event.stopPropagation()
  
  const touch = event.touches[0]
  resizeTouchIdentifier.value = touch.identifier
  
  isResizing.value = true
  resizeDirection.value = direction
  resizeStartPos.value = { x: touch.clientX, y: touch.clientY }
  resizeStartSize.value = { ...props.block.size }
  resizeStartBlockPos.value = { ...props.block.position }
  
  window.addEventListener('touchmove', handleResizeTouchMove, { passive: false })
  window.addEventListener('touchend', handleResizeTouchEnd)
  window.addEventListener('touchcancel', handleResizeTouchEnd)
}

function handleResizeTouchMove(event: TouchEvent) {
  if (!isResizing.value || !resizeDirection.value || resizeTouchIdentifier.value === null) return
  
  const touch = Array.from(event.touches).find(t => t.identifier === resizeTouchIdentifier.value)
  if (!touch) return
  
  event.preventDefault()
  
  const zoom = props.zoom || 1
  const deltaX = (touch.clientX - resizeStartPos.value.x) / zoom
  const deltaY = (touch.clientY - resizeStartPos.value.y) / zoom
  
  let newWidth = resizeStartSize.value.width
  let newHeight = resizeStartSize.value.height
  let newX = resizeStartBlockPos.value.x
  let newY = resizeStartBlockPos.value.y
  
  // Calculate new size and position based on direction (same logic as mouse)
  switch (resizeDirection.value) {
    case 'right':
      newWidth = Math.max(MIN_BLOCK_WIDTH, resizeStartSize.value.width + deltaX)
      break
    case 'bottom':
      newHeight = Math.max(MIN_BLOCK_HEIGHT, resizeStartSize.value.height + deltaY)
      break
    case 'left':
      newWidth = Math.max(MIN_BLOCK_WIDTH, resizeStartSize.value.width - deltaX)
      newX = resizeStartBlockPos.value.x + (resizeStartSize.value.width - newWidth)
      break
    case 'top':
      newHeight = Math.max(MIN_BLOCK_HEIGHT, resizeStartSize.value.height - deltaY)
      newY = resizeStartBlockPos.value.y + (resizeStartSize.value.height - newHeight)
      break
    case 'top-left':
      newWidth = Math.max(MIN_BLOCK_WIDTH, resizeStartSize.value.width - deltaX)
      newHeight = Math.max(MIN_BLOCK_HEIGHT, resizeStartSize.value.height - deltaY)
      newX = resizeStartBlockPos.value.x + (resizeStartSize.value.width - newWidth)
      newY = resizeStartBlockPos.value.y + (resizeStartSize.value.height - newHeight)
      break
    case 'top-right':
      newWidth = Math.max(MIN_BLOCK_WIDTH, resizeStartSize.value.width + deltaX)
      newHeight = Math.max(MIN_BLOCK_HEIGHT, resizeStartSize.value.height - deltaY)
      newY = resizeStartBlockPos.value.y + (resizeStartSize.value.height - newHeight)
      break
    case 'bottom-left':
      newWidth = Math.max(MIN_BLOCK_WIDTH, resizeStartSize.value.width - deltaX)
      newHeight = Math.max(MIN_BLOCK_HEIGHT, resizeStartSize.value.height + deltaY)
      newX = resizeStartBlockPos.value.x + (resizeStartSize.value.width - newWidth)
      break
    case 'bottom-right':
      newWidth = Math.max(MIN_BLOCK_WIDTH, resizeStartSize.value.width + deltaX)
      newHeight = Math.max(MIN_BLOCK_HEIGHT, resizeStartSize.value.height + deltaY)
      break
  }
  
  emit('resize', props.block.id, { width: newWidth, height: newHeight }, { x: newX, y: newY })
}

function handleResizeTouchEnd() {
  if (!isResizing.value) return
  
  window.removeEventListener('touchmove', handleResizeTouchMove)
  window.removeEventListener('touchend', handleResizeTouchEnd)
  window.removeEventListener('touchcancel', handleResizeTouchEnd)
  
  isResizing.value = false
  resizeDirection.value = null
  resizeTouchIdentifier.value = null
}

// Cleanup resize handlers
function cleanupResize() {
  window.removeEventListener('mousemove', handleResizeMove)
  window.removeEventListener('mouseup', handleResizeEnd)
  window.removeEventListener('touchmove', handleResizeTouchMove)
  window.removeEventListener('touchend', handleResizeTouchEnd)
  window.removeEventListener('touchcancel', handleResizeTouchEnd)
}

function handleDelete(event: Event) {
  event.stopPropagation()
  emit('delete', props.block.id)
}

// Cleanup on unmount
onUnmounted(() => {
  cleanupDrag()
  cleanupResize()
})
</script>

<style scoped>
.block-card {
  border: 2px solid #999;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  user-select: none;
  /* z-index is now dynamic via inline style */
  position: relative;
  overflow: hidden; /* Default: hide overflow */
}

.block-card.allow-overflow {
  overflow: visible; /* Allow overflow when dragging content */
}

.block-content {
  position: relative;
  width: 100%;
  height: calc(100% - 36px); /* Subtract header height */
}

.block-card.is-hovered {
  outline: 3px solid #fbbf24;
  outline-offset: 2px;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.6), 0 6px 20px rgba(0, 0, 0, 0.3) !important;
}

.block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  cursor: grab;
  min-height: 36px;
}

.block-header:active {
  cursor: grabbing;
}

.block-content {
  position: relative;
  width: 100%;
  height: calc(100% - 36px); /* Full height minus header */
  overflow: hidden; /* Clip content that exceeds block size */
}

.block-name {
  font-weight: 600;
  font-size: 14px;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.block-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.delete-btn {
  background: rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.delete-btn:hover {
  background: rgba(255, 255, 255, 0.9);
}

.delete-btn:hover .delete-icon {
  color: #f44336;
}

.delete-icon {
  color: #666;
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
}

/* Resize Handles */
.resize-handle {
  position: absolute;
  background: transparent;
  z-index: 10;
}

.resize-handle:hover {
  background: rgba(33, 150, 243, 0.3);
}

/* Edge handles */
.resize-handle-top {
  top: 0;
  left: 8px;
  right: 8px;
  height: 8px;
  cursor: ns-resize;
}

.resize-handle-right {
  top: 8px;
  right: 0;
  bottom: 8px;
  width: 8px;
  cursor: ew-resize;
}

.resize-handle-bottom {
  bottom: 0;
  left: 8px;
  right: 8px;
  height: 8px;
  cursor: ns-resize;
}

.resize-handle-left {
  top: 8px;
  left: 0;
  bottom: 8px;
  width: 8px;
  cursor: ew-resize;
}

/* Corner handles */
.resize-handle-top-left {
  top: 0;
  left: 0;
  width: 12px;
  height: 12px;
  cursor: nwse-resize;
}

.resize-handle-top-right {
  top: 0;
  right: 0;
  width: 12px;
  height: 12px;
  cursor: nesw-resize;
}

.resize-handle-bottom-left {
  bottom: 0;
  left: 0;
  width: 12px;
  height: 12px;
  cursor: nesw-resize;
}

.resize-handle-bottom-right {
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  cursor: nwse-resize;
}
</style>
