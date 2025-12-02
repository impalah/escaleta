<template>
  <v-data-table
    :headers="headers"
    :items="sortedBeats"
    :items-per-page="25"
    class="elevation-1"
    density="comfortable"
    @click:row="handleRowClick"
  >
    <!-- Beat type with icon and color -->
    <template #item.typeId="{ item }">
      <v-chip
        :color="getBeatType(item.typeId)?.color"
        variant="flat"
        size="small"
        class="font-weight-medium"
      >
        <v-icon start :icon="getBeatType(item.typeId)?.icon" />
        {{ getBeatType(item.typeId)?.name }}
      </v-chip>
    </template>

    <!-- Order column with badge -->
    <template #item.order="{ item }">
      <v-badge :content="item.order" color="primary" inline />
    </template>

    <!-- Title column (truncate long titles) -->
    <template #item.title="{ item }">
      <div class="text-truncate" style="max-width: 250px">
        {{ item.title }}
      </div>
    </template>

    <!-- Description column (truncate long descriptions) -->
    <template #item.description="{ item }">
      <div class="text-truncate" style="max-width: 300px">
        {{ item.description || '—' }}
      </div>
    </template>

    <!-- Created date formatted -->
    <template #item.createdAt="{ item }">
      <span class="text-caption text-medium-emphasis">
        {{ formatDate(item.createdAt) }}
      </span>
    </template>

    <!-- Updated date formatted -->
    <template #item.updatedAt="{ item }">
      <span class="text-caption text-medium-emphasis">
        {{ formatDate(item.updatedAt) }}
      </span>
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Beat, BeatType } from '@/domain/entities'

const props = defineProps<{
  beats: Beat[]
  beatTypes: BeatType[]
}>()

const emit = defineEmits<{
  'beat-click': [beat: Beat]
}>()

const headers = [
  { title: 'Order', key: 'order', width: 80, sortable: true },
  { title: 'Type', key: 'typeId', width: 150, sortable: true },
  { title: 'Title', key: 'title', sortable: true },
  { title: 'Description', key: 'description', sortable: false },
  { title: 'Created', key: 'createdAt', width: 120, sortable: true },
  { title: 'Updated', key: 'updatedAt', width: 120, sortable: true }
]

const sortedBeats = computed(() => {
  return [...props.beats].sort((a, b) => a.order - b.order)
})

function getBeatType(typeId: string): BeatType | undefined {
  return props.beatTypes.find(t => t.id === typeId)
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function handleRowClick(event: Event, row: { item: Beat }) {
  emit('beat-click', row.item)
}
</script>

<style scoped>
/* Make rows clickable with hover effect */
:deep(tbody tr) {
  cursor: pointer;
}

:deep(tbody tr:hover) {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>
