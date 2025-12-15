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
import { computed, onUnmounted } from 'vue'
import type { BeatGroup } from '@/domain/entities'
import { useDraggable } from '@/composables/useDraggable'

const props = defineProps<{
  group: BeatGroup
  zoom?: number
  isHovered?: boolean
  zIndex?: number // Assigned z-index from parent
  parentBlockId?: string // If set, position is relative to parent block
}>()

const emit = defineEmits<{
  click: [group: BeatGroup]
  dragstart: [groupId: string]
  dragmove: [groupId: string, deltaX: number, deltaY: number]
  dragend: [groupId: string]
  delete: [groupId: string]
}>()

// Use draggable composable for unified drag behavior
const {
  isDragging,
  handleMouseDown,
  handleTouchStart,
  cleanup
} = useDraggable({
  elementId: props.group.id,
  dragThreshold: 3,
  onClick: () => {
    emit('click', props.group)
  },
  onDragStart: (groupId) => {
    emit('dragstart', groupId)
  },
  onDragMove: (groupId, deltaX, deltaY) => {
    emit('dragmove', groupId, deltaX, deltaY)
  },
  onDragEnd: (groupId) => {
    emit('dragend', groupId)
  }
})

// Cleanup on unmount
onUnmounted(() => {
  cleanup()
})

const groupStyle = computed(() => {
  const baseStyle = {
    position: 'absolute' as const,
    left: `${props.group.position.x}px`,
    top: `${props.group.position.y}px`,
    // No transform scale here - zoom is applied by parent container to avoid double zoom
    cursor: isDragging.value ? 'grabbing' : 'grab',
    zIndex: props.zIndex || 1000 // Use assigned z-index or fallback
  }
  return baseStyle
})

function handleDelete(event: Event) {
  event.stopPropagation()
  emit('delete', props.group.id)
}
</script>

<style scoped>
.beat-group-card {
  width: 424px; /* Match BeatCard width (400px + 12px padding left + 12px padding right) */
  min-height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 2px solid #5a67d8;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  user-select: none;
  box-sizing: border-box; /* Include border in width calculation */
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
