<template>
  <div
    class="block-card"
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
          @click.stop="handleDelete"
          aria-label="Delete block"
          title="Delete block"
        >
          <span class="delete-icon">×</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Block } from '@/domain/entities'

const props = defineProps<{
  block: Block
  zoom?: number
}>()

const emit = defineEmits<{
  click: [block: Block]
  dragstart: [blockId: string]
  dragmove: [blockId: string, deltaX: number, deltaY: number]
  dragend: [blockId: string]
  delete: [blockId: string]
}>()

const isDragging = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const touchIdentifier = ref<number | null>(null)
const hasMoved = ref(false)

const blockStyle = computed(() => {
  const baseStyle = {
    position: 'absolute' as const,
    left: `${props.block.position.x}px`,
    top: `${props.block.position.y}px`,
    width: `${props.block.size.width}px`,
    height: `${props.block.size.height}px`,
    backgroundColor: props.block.backgroundColor,
    transform: `scale(${props.zoom || 1})`,
    transformOrigin: 'top left' as const,
    cursor: isDragging.value ? 'grabbing' : 'default',
    zIndex: isDragging.value ? 1000 : 1 // High z-index when dragging, lowest when not
  }
  return baseStyle
})

function handleMouseDown(event: MouseEvent) {
  // Only handle left mouse button
  if (event.button !== 0) return
  
  // Don't handle if clicking on delete button
  if ((event.target as HTMLElement).closest('.delete-btn')) {
    return
  }
  
  event.stopPropagation()
  event.preventDefault()
  
  isDragging.value = true
  hasMoved.value = false
  dragStartPos.value = { x: event.clientX, y: event.clientY }
  
  emit('dragstart', props.block.id)
  
  // Add global mouse listeners
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
}

function handleMouseMove(event: MouseEvent) {
  if (!isDragging.value) return
  
  const deltaX = event.clientX - dragStartPos.value.x
  const deltaY = event.clientY - dragStartPos.value.y
  
  // Mark as moved if moved more than 3 pixels
  if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
    hasMoved.value = true
  }
  
  emit('dragmove', props.block.id, deltaX, deltaY)
  
  // Update drag start position for next delta calculation
  dragStartPos.value = { x: event.clientX, y: event.clientY }
}

function handleMouseUp() {
  if (!isDragging.value) return
  
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
  
  const wasDragging = hasMoved.value
  
  isDragging.value = false
  hasMoved.value = false
  
  emit('dragend', props.block.id)
  
  // If it was just a click (no movement), emit click event
  if (!wasDragging) {
    emit('click', props.block)
  }
}

function handleTouchStart(event: TouchEvent) {
  if (event.touches.length !== 1) return
  
  // Don't handle if touching delete button
  if ((event.target as HTMLElement).closest('.delete-btn')) {
    return
  }
  
  event.stopPropagation()
  
  const touch = event.touches[0]
  touchIdentifier.value = touch.identifier
  
  isDragging.value = true
  hasMoved.value = false
  dragStartPos.value = { x: touch.clientX, y: touch.clientY }
  
  emit('dragstart', props.block.id)
  
  // Add global touch listeners
  window.addEventListener('touchmove', handleTouchMove, { passive: false })
  window.addEventListener('touchend', handleTouchEnd)
  window.addEventListener('touchcancel', handleTouchEnd)
}

function handleTouchMove(event: TouchEvent) {
  if (!isDragging.value || touchIdentifier.value === null) return
  
  const touch = Array.from(event.touches).find(t => t.identifier === touchIdentifier.value)
  if (!touch) return
  
  event.preventDefault()
  
  const deltaX = touch.clientX - dragStartPos.value.x
  const deltaY = touch.clientY - dragStartPos.value.y
  
  // Mark as moved if moved more than 3 pixels
  if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
    hasMoved.value = true
  }
  
  emit('dragmove', props.block.id, deltaX, deltaY)
  
  // Update drag start position for next delta calculation
  dragStartPos.value = { x: touch.clientX, y: touch.clientY }
}

function handleTouchEnd() {
  if (!isDragging.value) return
  
  window.removeEventListener('touchmove', handleTouchMove)
  window.removeEventListener('touchend', handleTouchEnd)
  window.removeEventListener('touchcancel', handleTouchEnd)
  
  const wasDragging = hasMoved.value
  
  isDragging.value = false
  touchIdentifier.value = null
  hasMoved.value = false
  
  emit('dragend', props.block.id)
  
  // If it was just a tap (no movement), emit click event
  if (!wasDragging) {
    emit('click', props.block)
  }
}

function handleDelete(event: Event) {
  event.stopPropagation()
  emit('delete', props.block.id)
}
</script>

<style scoped>
.block-card {
  border: 2px solid #999;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  user-select: none;
  /* z-index is now dynamic via inline style */
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
</style>
