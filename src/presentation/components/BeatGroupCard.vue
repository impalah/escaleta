<template>
  <div
    class="beat-group-card"
    :class="{ 'group-hovered': isHovered }"
    :style="groupStyle"
    :data-group-id="group.id"
    @mousedown="handleMouseDown"
    @touchstart="handleTouchStart"
  >
    <div class="group-header">
      <span class="group-name">{{ group.name }}</span>
      <div class="group-actions">
        <span class="group-badge">{{ group.beatIds.length }}</span>
        <button
          class="delete-btn"
          aria-label="Delete group"
          title="Delete group"
          @click.stop="handleDelete"
        >
          <span class="delete-icon">×</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { BeatGroup } from '@/domain/entities'

const props = defineProps<{
  group: BeatGroup
  zoom?: number
  isHovered?: boolean
  zIndex?: number // Assigned z-index from parent
}>()

const emit = defineEmits<{
  click: [group: BeatGroup]
  dragstart: [groupId: string]
  dragmove: [groupId: string, deltaX: number, deltaY: number]
  dragend: [groupId: string]
  delete: [groupId: string]
}>()

const isDragging = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const touchIdentifier = ref<number | null>(null)
const hasMoved = ref(false)

const groupStyle = computed(() => {
  const baseStyle = {
    position: 'absolute' as const,
    left: `${props.group.position.x}px`,
    top: `${props.group.position.y}px`,
    transform: `scale(${props.zoom || 1})`,
    transformOrigin: 'top left' as const,
    cursor: isDragging.value ? 'grabbing' : 'grab',
    zIndex: props.zIndex || 1000 // Use assigned z-index or fallback
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
  
  emit('dragstart', props.group.id)
  
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
  
  emit('dragmove', props.group.id, deltaX, deltaY)
  
  // Update drag start position for next delta calculation
  dragStartPos.value = { x: event.clientX, y: event.clientY }
}

function handleMouseUp() {
  if (!isDragging.value) return
  
  const wasDragging = hasMoved.value
  
  isDragging.value = false
  emit('dragend', props.group.id)
  
  // If didn't move, treat as click
  if (!wasDragging) {
    emit('click', props.group)
  }
  
  // Remove global listeners
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
}

// Touch event handlers
function handleTouchStart(event: TouchEvent) {
  // Don't handle if touching delete button
  if ((event.target as HTMLElement).closest('.delete-btn')) {
    return
  }
  
  event.stopPropagation()
  
  const touch = event.touches[0]
  if (!touch) return
  
  touchIdentifier.value = touch.identifier
  isDragging.value = true
  hasMoved.value = false
  dragStartPos.value = { x: touch.clientX, y: touch.clientY }
  
  emit('dragstart', props.group.id)
  
  // Add global touch listeners
  window.addEventListener('touchmove', handleTouchMove)
  window.addEventListener('touchend', handleTouchEnd)
  window.addEventListener('touchcancel', handleTouchEnd)
}

function handleTouchMove(event: TouchEvent) {
  if (!isDragging.value || touchIdentifier.value === null) return
  
  // Find the touch with the matching identifier
  const touch = Array.from(event.touches).find(t => t.identifier === touchIdentifier.value)
  if (!touch) return
  
  const deltaX = touch.clientX - dragStartPos.value.x
  const deltaY = touch.clientY - dragStartPos.value.y
  
  // Mark as moved if moved more than 3 pixels
  if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
    hasMoved.value = true
  }
  
  emit('dragmove', props.group.id, deltaX, deltaY)
  
  // Update drag start position for next delta calculation
  dragStartPos.value = { x: touch.clientX, y: touch.clientY }
}

function handleTouchEnd() {
  if (!isDragging.value) return
  
  const wasDragging = hasMoved.value
  
  isDragging.value = false
  touchIdentifier.value = null
  emit('dragend', props.group.id)
  
  // If didn't move, treat as click
  if (!wasDragging) {
    emit('click', props.group)
  }
  
  // Remove global listeners
  window.removeEventListener('touchmove', handleTouchMove)
  window.removeEventListener('touchend', handleTouchEnd)
  window.removeEventListener('touchcancel', handleTouchEnd)
}

function handleDelete(event: Event) {
  event.stopPropagation()
  emit('delete', props.group.id)
}
</script>

<style scoped>
.beat-group-card {
  width: 430px; /* 400px (beat width) + 15px each side */
  min-height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 2px solid #5a67d8;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  user-select: none;
  /* z-index is now dynamic via inline style */
}

.beat-group-card:hover {
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}
.beat-group-card.group-hovered {
  outline: 3px solid #fbbf24;
  outline-offset: 2px;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.6), 0 6px 16px rgba(102, 126, 234, 0.5);
  background: linear-gradient(135deg, #7c8ff0 0%, #8557b0 100%);
}
.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  height: 50px;
}

.group-name {
  font-weight: 700;
  font-size: 16px;
  color: white;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-badge {
  background: rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  min-width: 24px;
  text-align: center;
}

.delete-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
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
  color: white;
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}
</style>
