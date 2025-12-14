<template>
  <div
    class="block-card-wrapper"
    :class="{ 'is-dragging': isDragging, 'block-hovered': isHovered }"
    :data-block-id="block.id"
    :style="{
      left: `${block.position.x}px`,
      top: `${block.position.y}px`,
      width: `${blockWidth}px`,
      zIndex: zIndex ?? 100
    }"
  >
    <!-- Block Card -->
    <v-card
      data-testid="block-card"
      class="block-card"
      :class="{ 'is-dragging': isDragging }"
      color="rgba(103, 58, 183, 0.15)"
      elevation="2"
      @click="handleClick"
      @mousedown="handleMouseDown"
      @touchstart="handleTouchStart"
    >
      <v-card-text class="pa-3">
        <div class="d-flex align-center">
          <v-icon
            color="deep-purple-darken-2"
            size="small"
            class="mr-2"
          >
            mdi-folder-multiple
          </v-icon>
          <span class="text-caption text-deep-purple-darken-2 font-weight-medium">
            {{ block.name }}
          </span>
          <v-spacer />
          <span class="text-caption text-deep-purple-lighten-1 mr-3">
            {{ block.groupIds.length }} groups
          </span>
          <button
            class="delete-btn"
            aria-label="Delete block"
            title="Delete block"
            @click.stop="handleDelete"
            @mousedown.stop
            @touchstart.stop
          >
            <span class="delete-icon">×</span>
          </button>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue'
import type { Block } from '@/domain/entities'
import { useDraggable } from '@/composables/useDraggable'

const props = defineProps<{
  block: Block
  blockWidth: number
  isHovered?: boolean
  zoom?: number
  zIndex?: number
}>()

const emit = defineEmits<{
  click: []
  dragstart: [blockId: string]
  dragmove: [blockId: string, deltaX: number, deltaY: number]
  dragend: [blockId: string]
  delete: [blockId: string]
}>()

// Use draggable composable
const {
  isDragging,
  hasMoved,
  handleMouseDown,
  handleTouchStart,
  cleanup
} = useDraggable({
  elementId: props.block.id,
  dragThreshold: 10,
  onDragStart: (blockId) => {
    emit('dragstart', blockId)
  },
  onDragMove: (blockId, deltaX, deltaY) => {
    emit('dragmove', blockId, deltaX, deltaY)
  },
  onDragEnd: (blockId) => {
    emit('dragend', blockId)
  }
})

// Cleanup on unmount
onUnmounted(() => {
  cleanup()
})

function handleClick() {
  // Only emit click if we didn't drag
  if (!hasMoved.value) {
    emit('click')
  }
}

function handleDelete(event: Event) {
  event.stopPropagation()
  emit('delete', props.block.id)
}
</script>

<style scoped>
.block-card-wrapper {
  position: absolute;
  height: 50px;
  transition: none;
  pointer-events: auto;
}

.block-card-wrapper.is-dragging,
.block-card-wrapper.no-transition {
  transition: none;
}

.block-card-wrapper.block-hovered .block-card {
  outline: 3px solid #fbbf24;
  outline-offset: 2px;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.6), 0 6px 20px rgba(0, 0, 0, 0.3) !important;
}

.block-card {
  position: relative;
  height: 50px;
  cursor: grab;
  transition: transform 0.2s, box-shadow 0.2s;
  user-select: none;
  border: 2px dashed rgba(103, 58, 183, 0.4);
}

.block-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(103, 58, 183, 0.3) !important;
}

.block-card.is-dragging {
  cursor: grabbing;
  transform: scale(1.02);
  box-shadow: 0 12px 24px rgba(103, 58, 183, 0.4) !important;
  transition: none;
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;
  opacity: 0;
}

.block-card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.9);
  transform: scale(1.1);
}

.delete-icon {
  font-size: 18px;
  font-weight: bold;
  color: white;
  line-height: 1;
}
</style>
