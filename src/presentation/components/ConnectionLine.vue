<template>
  <svg
    class="connection-line"
    :style="{ pointerEvents: 'none' }"
  >
    <defs>
      <marker
        id="arrowhead"
        markerWidth="8"
        markerHeight="8"
        refX="7"
        refY="4"
        orient="auto"
      >
        <polygon
          points="0 0, 8 4, 0 8"
          fill="#666"
        />
      </marker>
    </defs>
    <line
      :x1="startX"
      :y1="startY"
      :x2="endX"
      :y2="endY"
      stroke="#666"
      stroke-width="2"
      stroke-dasharray="5,5"
      marker-end="url(#arrowhead)"
      opacity="0.6"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Beat } from '@/domain/entities'

const props = defineProps<{
  sourceBeat: Beat
  targetBeat: Beat
}>()

// Calculate connection points (from right edge of source to left edge of target)
const startX = computed(() => props.sourceBeat.position.x + 200) // 200 = beat card width
const startY = computed(() => props.sourceBeat.position.y + 40) // 40 = half beat card height

const endX = computed(() => props.targetBeat.position.x)
const endY = computed(() => props.targetBeat.position.y + 40)
</script>

<style scoped>
.connection-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}
</style>
