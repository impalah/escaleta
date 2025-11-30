<template>
  <v-card
    data-testid="beat-card"
    class="beat-card"
    :style="{
      left: `${beat.position.x}px`,
      top: `${beat.position.y}px`,
      backgroundColor: beatType?.color || '#9E9E9E'
    }"
    elevation="4"
    @click="$emit('click')"
  >
    <v-card-text class="pa-3">
      <div class="d-flex align-center mb-2">
        <v-icon :color="getContrastColor(beatType?.color)" size="small" class="mr-2">
          {{ beatType?.icon || 'mdi-file' }}
        </v-icon>
        <span class="text-caption" :style="{ color: getContrastColor(beatType?.color) }">
          {{ beatType?.name || 'Unknown' }}
        </span>
      </div>
      <div class="beat-title" :style="{ color: getContrastColor(beatType?.color) }">
        {{ beat.title }}
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { Beat, BeatType } from '@/domain/entities'

defineProps<{
  beat: Beat
  beatType: BeatType | undefined
}>()

defineEmits<{
  click: []
}>()

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
.beat-card {
  position: absolute;
  width: 200px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  /* TODO: Add support for drag & drop */
}

.beat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2) !important;
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
</style>
