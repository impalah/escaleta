<template>
  <div
    class="block-card-wrapper"
    :class="{ 'is-dragging': isDragging, 'block-hovered': isHovered }"
    :data-block-id="block.id"
    :style="{
      left: `${block.position.x}px`,
      top: `${block.position.y}px`,
      width: `${blockWidth}px`,
      zIndex: zIndex ?? 50 /* MENOR que grupos (100) y beats (200) */
    }"
  >
    <!-- Fondo del Block con borde -->
    <div
      class="block-background"
      :style="{
        left: `${blockBackgroundBounds.offsetX}px`,
        top: `${blockBackgroundBounds.offsetY}px`,
        width: `${blockBackgroundBounds.width}px`,
        height: `${blockBackgroundBounds.height}px`
      }"
    />

    <!-- Block Card Header (draggable) -->
    <v-card
      data-testid="block-card"
      class="block-card"
      :class="{ 'is-dragging': isDragging }"
      color="rgba(103, 58, 183, 0.15)"
      elevation="2"
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
import { onUnmounted, computed } from 'vue'
import type { Block, BeatGroup, Beat } from '@/domain/entities'
import { useDraggable } from '@/composables/useDraggable'

const props = defineProps<{
  block: Block
  blockWidth: number
  isHovered?: boolean
  zoom?: number
  zIndex?: number
  groups: BeatGroup[]  // Grupos dentro del Block
  beats: Beat[]        // Todos los beats para calcular bounds
}>()

const emit = defineEmits<{
  click: []
  dragstart: [blockId: string]
  dragmove: [blockId: string, deltaX: number, deltaY: number]
  dragend: [blockId: string]
  delete: [blockId: string]
}>()

// Constantes
const BLOCK_HEADER_HEIGHT = 50 // px
const GROUP_HEIGHT = 50 // px
const BEAT_HEIGHT = 80 // px
const BLOCK_PADDING = 15 // px - padding alrededor del contenido

// Calcular dimensiones del fondo del Block
const blockBackgroundBounds = computed(() => {
  if (props.groups.length === 0) {
    // Block sin grupos - solo header
    return {
      width: props.blockWidth,
      height: BLOCK_HEADER_HEIGHT,
      offsetX: 0,
      offsetY: 0
    }
  }

  // Encontrar bounds de todos los grupos y sus beats
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  props.groups.forEach(group => {
    const groupX = group.position.x
    const groupY = group.position.y
    const groupWidth = 424 // GROUP_WIDTH constante del proyecto

    minX = Math.min(minX, groupX)
    maxX = Math.max(maxX, groupX + groupWidth)
    minY = Math.min(minY, groupY)
    maxY = Math.max(maxY, groupY + GROUP_HEIGHT)

    // Beats de este grupo (filtrando por beatIds del grupo)
    const groupBeats = props.beats.filter(b => group.beatIds.includes(b.id))
    groupBeats.forEach(beat => {
      const beatX = beat.position.x
      const beatY = beat.position.y
      const beatWidth = 200 // BEAT_WIDTH

      minX = Math.min(minX, beatX)
      maxX = Math.max(maxX, beatX + beatWidth)
      minY = Math.min(minY, beatY)
      maxY = Math.max(maxY, beatY + BEAT_HEIGHT)
    })
  })

  // El fondo debe englobar desde el header hasta el último elemento
  const blockHeaderY = props.block.position.y
  minY = Math.min(minY, blockHeaderY + BLOCK_HEADER_HEIGHT)

  return {
    width: (maxX - minX) + (BLOCK_PADDING * 2),
    height: (maxY - blockHeaderY) + BLOCK_PADDING,
    offsetX: minX - props.block.position.x - BLOCK_PADDING,
    offsetY: 0 // Empieza en la posición Y del block
  }
})

// Use draggable composable
const {
  isDragging,
  handleMouseDown,
  handleTouchStart,
  cleanup
} = useDraggable({
  elementId: props.block.id,
  dragThreshold: 10,
  onClick: () => {
    emit('click')
  },
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
  pointer-events: none; /* Los eventos pasan al fondo y al header */
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

.block-background {
  position: absolute;
  background: rgba(103, 58, 183, 0.05); /* Fondo muy sutil */
  border: 2px solid rgba(103, 58, 183, 0.3); /* Borde visible */
  border-radius: 12px;
  pointer-events: none; /* No intercepta eventos */
  z-index: -1; /* Detrás del header */
}

.block-card {
  position: relative;
  height: 50px;
  cursor: grab;
  transition: transform 0.2s, box-shadow 0.2s;
  user-select: none;
  border: 2px dashed rgba(103, 58, 183, 0.4);
  pointer-events: auto; /* El header SÍ recibe eventos */
  z-index: 1; /* Sobre el fondo */
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
