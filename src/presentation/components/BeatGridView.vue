<template>
  <v-data-table
    :headers="headers"
    :items="sortedBeats"
    :items-per-page="-1"
    class="excel-grid elevation-1"
    density="comfortable"
    fixed-header
    height="calc(100vh - 128px)"
    hide-default-footer
  >
    <!-- Beat type with icon and color -->
    <template #[`item.typeId`]="{ item }">
      <div
        class="grid-cell"
        @click.stop="handleCellClick(item, 'typeId')"
      >
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
    <template #[`item.order`]="{ item }">
      <div
        class="grid-cell"
        @click.stop="handleCellClick(item, 'order')"
      >
        <v-badge
          :content="item.order"
          color="primary"
          inline
        />
      </div>
    </template>

    <!-- Title column (truncate long titles) -->
    <template #[`item.title`]="{ item }">
      <div
        class="text-truncate grid-cell"
        style="max-width: 250px"
        @click.stop="handleCellClick(item, 'title')"
      >
        {{ item.title }}
      </div>
    </template>

    <!-- Duration column -->
    <template #[`item.eventDuration`]="{ item }">
      <div
        class="grid-cell"
        @click.stop="handleCellClick(item, 'eventDuration')"
      >
        {{ item.eventDuration || '—' }}
      </div>
    </template>

    <!-- Start Time column -->
    <template #[`item.eventStartTime`]="{ item }">
      <div
        class="grid-cell"
        @click.stop="handleCellClick(item, 'eventStartTime')"
      >
        {{ item.eventStartTime || '—' }}
      </div>
    </template>

    <!-- Scene column -->
    <template #[`item.scene`]="{ item }">
      <div
        class="grid-cell"
        @click.stop="handleCellClick(item, 'scene')"
      >
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
/* Excel-like grid styling */
.excel-grid {
  border: 1px solid #ddd;
  background-color: #fff;
}

/* Cell styling with borders on all sides */
.grid-cell {
  cursor: pointer;
  padding: 8px 12px;
  transition: background-color 0.15s;
  min-height: 40px;
  display: flex;
  align-items: center;
}

.grid-cell:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

/* Add borders to all cells */
:deep(.v-data-table) {
  border-collapse: separate;
  border-spacing: 0;
}

:deep(.v-data-table th) {
  border: 1px solid #ddd !important;
  border-top: none !important;
  background-color: #f5f5f5 !important;
  font-weight: 600 !important;
  padding: 12px !important;
}

:deep(.v-data-table td) {
  border: 1px solid #ddd !important;
  padding: 0 !important;
  vertical-align: middle;
}

/* Remove double borders */
:deep(.v-data-table th:not(:first-child)) {
  border-left: none !important;
}

:deep(.v-data-table td:not(:first-child)) {
  border-left: none !important;
}

:deep(.v-data-table tr:not(:last-child) td) {
  border-bottom: none !important;
}

/* Header row styling */
:deep(.v-data-table thead tr) {
  background-color: #f5f5f5;
}

/* Body row styling - zebra striping like Excel */
:deep(.v-data-table tbody tr:nth-child(even)) {
  background-color: #fafafa;
}

:deep(.v-data-table tbody tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.04) !important;
}

/* Remove default Vuetify row cursor */
:deep(tbody tr) {
  cursor: default;
}

/* Scrollbar styling for fixed header */
:deep(.v-table__wrapper) {
  overflow-y: auto;
}

:deep(.v-table__wrapper::-webkit-scrollbar) {
  width: 12px;
}

:deep(.v-table__wrapper::-webkit-scrollbar-track) {
  background: #f1f1f1;
}

:deep(.v-table__wrapper::-webkit-scrollbar-thumb) {
  background: #888;
  border-radius: 6px;
}

:deep(.v-table__wrapper::-webkit-scrollbar-thumb:hover) {
  background: #555;
}
</style>
