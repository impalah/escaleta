<template>
  <v-data-table
    :headers="headers"
    :items="sortedBeats"
    :items-per-page="-1"
    class="elevation-1"
    density="comfortable"
  >
    <!-- Beat type with icon and color -->
    <template #item.typeId="{ item }">
      <div @click.stop="handleCellClick(item, 'typeId')" class="clickable-cell">
        <v-chip
          :color="getBeatType(item.typeId)?.color"
          variant="flat"
          size="small"
          class="font-weight-medium"
        >
          <v-icon
            start
            :icon="getBeatType(item.typeId)?.icon"
          />
          {{ t(`beatTypes.${item.typeId}`) }}
        </v-chip>
      </div>
    </template>

    <!-- Order column with badge -->
    <template #item.order="{ item }">
      <div @click.stop="handleCellClick(item, 'order')" class="clickable-cell">
        <v-badge
          :content="item.order"
          color="primary"
          inline
        />
      </div>
    </template>

    <!-- Title column (truncate long titles) -->
    <template #item.title="{ item }">
      <div
        @click.stop="handleCellClick(item, 'title')"
        class="text-truncate clickable-cell"
        style="max-width: 250px"
      >
        {{ item.title }}
      </div>
    </template>

    <!-- Duration column -->
    <template #item.eventDuration="{ item }">
      <div @click.stop="handleCellClick(item, 'eventDuration')" class="clickable-cell">
        {{ item.eventDuration || '—' }}
      </div>
    </template>

    <!-- Start Time column -->
    <template #item.eventStartTime="{ item }">
      <div @click.stop="handleCellClick(item, 'eventStartTime')" class="clickable-cell">
        {{ item.eventStartTime || '—' }}
      </div>
    </template>

    <!-- Scene column -->
    <template #item.scene="{ item }">
      <div @click.stop="handleCellClick(item, 'scene')" class="clickable-cell">
        {{ item.scene || '—' }}
      </div>
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Beat, BeatType } from '@/domain/entities'

const { t } = useI18n()

const props = defineProps<{
  beats: Beat[]
  beatTypes: BeatType[]
}>()

const emit = defineEmits<{
  'cell-click': [beat: Beat, field: string]
}>()

const headers = computed(() => [
  { title: t('beatGrid.order'), key: 'order', width: 80, sortable: true },
  { title: t('beatGrid.type'), key: 'typeId', width: 150, sortable: true },
  { title: t('beatGrid.title'), key: 'title', sortable: true },
  { title: t('beatGrid.duration'), key: 'eventDuration', width: 120, sortable: false },
  { title: t('beatGrid.startTime'), key: 'eventStartTime', width: 120, sortable: false },
  { title: t('beatGrid.scene'), key: 'scene', sortable: false }
])

const sortedBeats = computed(() => {
  return [...props.beats].sort((a, b) => a.order - b.order)
})

function getBeatType(typeId: string): BeatType | undefined {
  return props.beatTypes.find(t => t.id === typeId)
}

function handleCellClick(beat: Beat, field: string) {
  emit('cell-click', beat, field)
}
</script>

<style scoped>
/* Make cells clickable with hover effect */
.clickable-cell {
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.clickable-cell:hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

:deep(tbody tr) {
  cursor: default;
}
</style>
