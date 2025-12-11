<template>
  <div
    class="beat-card-wrapper" 
    :class="{ 'is-dragging': isDragging, 'beat-hovered': isHovered }"
    :data-beat-id="beat.id"
    :style="{
      left: `${beat.position.x}px`,
      top: `${beat.position.y}px`,
      zIndex: zIndex ?? 1000
    }"
  >
    <!-- Beat Card -->
    <v-card
      data-testid="beat-card"
      class="beat-card"
      :class="{ 
        'is-dragging': isDragging
      }"
      :style="{
        backgroundColor: beatType?.color || '#9E9E9E'
      }"
      elevation="4"
      @click="handleClick"
      @mousedown="handleMouseDown"
      @touchstart="handleTouchStart"
    >
      <v-card-text class="pa-3">
        <div class="d-flex align-center mb-2">
          <v-icon
            :color="getContrastColor(beatType?.color)"
            size="small"
            class="mr-2"
          >
            {{ beatType?.icon || 'mdi-file' }}
          </v-icon>
          <span
            class="text-caption"
            :style="{ color: getContrastColor(beatType?.color) }"
          >
            {{ beatType?.name || 'Unknown' }}
          </span>
          <v-spacer />
          <button
            class="delete-btn"
            aria-label="Delete beat"
            title="Delete beat"
            @click.stop="handleDelete"
            @mousedown.stop
            @touchstart.stop
          >
            <span class="delete-icon">×</span>
          </button>
        </div>
        <div
          class="beat-title"
          :style="{ color: getContrastColor(beatType?.color) }"
        >
          {{ beat.title }}
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue'
import type { Beat, BeatType } from '@/domain/entities'
import { useDraggable } from '@/composables/useDraggable'

const props = defineProps<{
  beat: Beat
  beatType: BeatType | undefined
  isGroupDragging?: boolean // True when entire group is being dragged
  isHovered?: boolean // True when another beat is being dragged over this beat
  isInGroup?: boolean // True when beat belongs to a BeatGroup
  zoom?: number // Zoom level (1 = normal, for beats inside blocks to avoid double zoom)
  zIndex?: number // Assigned z-index from parent (includes group inheritance)
  parentBlockId?: string // If set, position is relative to parent block
}>()

const emit = defineEmits<{
  click: []
  dragstart: [beatId: string]
  dragmove: [beatId: string, deltaX: number, deltaY: number]
  dragend: [beatId: string]
  delete: [beatId: string]
}>()

// Use draggable composable for unified drag behavior
const {
  isDragging,
  hasMoved,
  handleMouseDown,
  handleTouchStart,
  cleanup
} = useDraggable({
  elementId: props.beat.id,
  dragThreshold: 10,
  onDragStart: (beatId) => {
    emit('dragstart', beatId)
  },
  onDragMove: (beatId, deltaX, deltaY) => {
    emit('dragmove', beatId, deltaX, deltaY)
  },
  onDragEnd: (beatId) => {
    emit('dragend', beatId)
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
  emit('delete', props.beat.id)
}

/**
 * Calculate contrast color (white or black) based on background color
 */
function getContrastColor(hexColor: string | undefined): string {
  if (!hexColor) return '#000000'

  const color = hexColor.replace('#', '')
  const r = parseInt(color.substr(0, 2), 16)
  const g = parseInt(color.substr(2, 2), 16)
  const b = parseInt(color.substr(4, 2), 16)

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}
</script>

<style scoped>
.beat-card-wrapper {
  position: absolute;
  width: 400px;
  transition: none; /* No animation when moving */
}

.beat-card-wrapper.is-dragging,
.beat-card-wrapper.no-transition {
  transition: none; /* Disable transition during active drag or group movement */
}

.beat-card-wrapper.beat-hovered .beat-card {
  outline: 3px solid #fbbf24;
  outline-offset: 2px;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.6), 0 6px 20px rgba(0, 0, 0, 0.3) !important;
}

.beat-card {
  position: relative;
  width: 400px;
  cursor: grab;
  transition: transform 0.2s, box-shadow 0.2s;
  user-select: none;
}

.beat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2) !important;
}

.beat-card.is-dragging {
  cursor: grabbing;
  transform: scale(1.05);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3) !important;
  transition: none;
  /* z-index is now on beat-card-wrapper via inline style */
}

.beat-title {
  font-weight: 500;
  font-size: 0.9rem;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;
  opacity: 0;
}

.beat-card:hover .delete-btn {
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
