<template>
  <v-card flat>
    <v-card-text>
      <!-- Beat Type selector -->
      <v-select
        v-if="cellData.field === 'typeId'"
        v-model="localValue"
        :items="beatTypes"
        item-title="name"
        item-value="id"
        :label="getFieldLabel(cellData.field)"
        density="comfortable"
        variant="outlined"
        @update:model-value="handleUpdate"
      >
        <template #selection="{ item }">
          <v-chip
            :color="item.raw.color"
            variant="flat"
            size="small"
          >
            <v-icon
              start
              :icon="item.raw.icon"
            />
            {{ item.title }}
          </v-chip>
        </template>
        <template #item="{ item, props: itemProps }">
          <v-list-item v-bind="itemProps">
            <template #prepend>
              <v-icon
                :icon="item.raw.icon"
                :color="item.raw.color"
              />
            </template>
          </v-list-item>
        </template>
      </v-select>

      <!-- Number input for order -->
      <v-text-field
        v-else-if="cellData.field === 'order'"
        v-model.number="localValue"
        :label="getFieldLabel(cellData.field)"
        type="number"
        density="comfortable"
        variant="outlined"
        @update:model-value="handleUpdate"
      />

      <!-- Text input for other fields -->
      <v-text-field
        v-else
        v-model="localValue"
        :label="getFieldLabel(cellData.field)"
        density="comfortable"
        variant="outlined"
        @update:model-value="handleUpdate"
      />

      <div class="text-caption text-medium-emphasis mt-2">
        Beat: {{ cellData.beat.title }}
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Beat, BeatType } from '@/domain/entities'

const { t } = useI18n()

interface CellData {
  beat: Beat
  field: string
}

const props = defineProps<{
  cellData: CellData
  beatTypes: BeatType[]
}>()

const emit = defineEmits<{
  'update-cell': [beat: Beat, field: string, value: string | number]
}>()

// Local value for editing
const localValue = ref<string | number | null>(null)

// Watch for cell data changes
watch(() => props.cellData, (newData) => {
  if (newData) {
    const beat = newData.beat as Record<string, string | number>
    localValue.value = beat[newData.field]
  }
}, { immediate: true })

function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    typeId: t('beatProperties.type'),
    order: t('beatProperties.order'),
    title: t('beatProperties.title'),
    eventDuration: t('beatProperties.eventDuration'),
    eventStartTime: t('beatProperties.eventStartTime'),
    scene: t('beatProperties.scene'),
  }
  return labels[field] || field
}

function handleUpdate() {
  emit('update-cell', props.cellData.beat, props.cellData.field, localValue.value)
}
</script>

<style scoped>
/* Minimal styles, inherits from panel */
</style>
