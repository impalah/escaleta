<template>
  <div
    class="lane-card-wrapper"
    :class="{ 'is-dragging': isDragging, 'lane-hovered': isHovered }"
    :data-lane-id="lane.id"
    :style="{
      left: `${lane.position.x}px`,
      top: `${lane.position.y}px`,
      width: `${laneWidth}px`,
      zIndex: zIndex ?? 25 /* MENOR que Blocks (50) */
    }"
  >
    <!-- Lane Header (draggable) -->
    <v-card
      data-testid="lane-card"
      class="lane-card"
      :class="{ 'is-dragging': isDragging }"
      color="rgba(33, 150, 243, 0.15)"
      elevation="2"
      @mousedown="handleMouseDown"
      @touchstart="handleTouchStart"
    >
      <v-card-text class="pa-3">
        <div class="d-flex align-center">
          <v-icon
            color="blue-darken-2"
            size="small"
            class="mr-2"
          >
            mdi-link-variant
          </v-icon>
          <span class="text-caption text-blue-darken-2 font-weight-medium">
            {{ lane.name }}
          </span>
          <v-spacer />
          <span class="text-caption text-blue-lighten-1 mr-3">
            {{ lane.blockIds.length }} blocks
          </span>
          <button
            class="delete-btn"
            aria-label="Delete lane"
            title="Delete lane"
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
import type { Lane } from '@/domain/entities'
import { useDraggable } from '@/composables/useDraggable'

const props = defineProps<{
  lane: Lane
  laneWidth: number
  isHovered?: boolean
  zoom?: number
  zIndex?: number
}>()

const emit = defineEmits<{
  click: []
  dragstart: [laneId: string]
  dragmove: [laneId: string, deltaX: number, deltaY: number]
  dragend: [laneId: string]
  delete: [laneId: string]
}>()

// Use draggable composable
const {
  isDragging,
  handleMouseDown,
  handleTouchStart,
  cleanup
} = useDraggable({
  elementId: props.lane.id,
  dragThreshold: 10,
  onClick: () => {
    emit('click')
  },
  onDragStart: (laneId) => {
    emit('dragstart', laneId)
  },
  onDragMove: (laneId, deltaX, deltaY) => {
    emit('dragmove', laneId, deltaX, deltaY)
  },
  onDragEnd: (laneId) => {
    emit('dragend', laneId)
  }
})

// Cleanup on unmount
onUnmounted(() => {
  cleanup()
})

function handleDelete(event: Event) {
  event.stopPropagation()
  emit('delete', props.lane.id)
}
</script>

<style scoped>
.lane-card-wrapper {
  position: absolute;
  height: 50px;
  transition: none;
  pointer-events: auto;
}

.lane-card-wrapper.is-dragging,
.lane-card-wrapper.no-transition {
  transition: none;
}

.lane-card-wrapper.lane-hovered .lane-card {
  outline: 3px solid #fbbf24;
  outline-offset: 2px;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.6), 0 6px 20px rgba(0, 0, 0, 0.3) !important;
}

.lane-card {
  position: relative;
  height: 50px;
  cursor: grab;
  transition: transform 0.2s, box-shadow 0.2s;
  user-select: none;
  border: 2px solid rgba(33, 150, 243, 0.5);
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.15), rgba(33, 150, 243, 0.25));
}

.lane-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(33, 150, 243, 0.3) !important;
}

.lane-card.is-dragging {
  cursor: grabbing;
  transform: scale(1.02);
  box-shadow: 0 12px 24px rgba(33, 150, 243, 0.4) !important;
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

.lane-card:hover .delete-btn {
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
