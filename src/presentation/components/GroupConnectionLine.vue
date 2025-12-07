<template>
  <svg
    class="group-connection-line"
    :style="{ pointerEvents: 'none' }"
  >
    <line
      :x1="startX"
      :y1="startY"
      :x2="endX"
      :y2="endY"
      stroke="#fbbf24"
      stroke-width="3"
      opacity="0.7"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BeatGroup, Beat } from '@/domain/entities'

const props = defineProps<{
  group: BeatGroup
  beat: Beat
}>()

const GROUP_WIDTH = 430
const GROUP_HEIGHT = 50
const BEAT_WIDTH = 400

// Calculate connection points (from bottom center of group to top center of beat)
const startX = computed(() => props.group.position.x + GROUP_WIDTH / 2)
const startY = computed(() => props.group.position.y + GROUP_HEIGHT)

const endX = computed(() => props.beat.position.x + BEAT_WIDTH / 2)
const endY = computed(() => props.beat.position.y)
</script>

<style scoped>
.group-connection-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 6; /* Above groups (z-index: 5) but below beats */
}
</style>
