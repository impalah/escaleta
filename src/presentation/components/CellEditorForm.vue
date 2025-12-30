<template>
  <v-card flat>
    <v-card-text>
      <!-- Use FieldRenderer for consistent rendering -->
      <FieldRenderer
        v-if="fieldMetadata"
        :metadata="fieldMetadata"
        :model-value="localValue"
        :select-options="cellData.field === 'typeId' ? beatTypeOptions : undefined"
        @update:model-value="handleUpdate"
      />

      <!-- Fallback for unknown fields -->
      <v-text-field
        v-else
        v-model="localValue"
        :label="cellData.field"
        density="comfortable"
        variant="outlined"
        @update:model-value="handleUpdate"
      />

      <div class="text-caption text-medium-emphasis mt-2">Beat: {{ cellData.beat.title }}</div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Beat, BeatType } from '@/domain/entities'
import { getFieldMetadata } from '@/domain/fieldMetadata'
import FieldRenderer from './FieldRenderer.vue'

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
  'update-cell': [beat: Beat, field: string, value: string | number | string[]]
}>()

// Get field metadata
const fieldMetadata = computed(() => getFieldMetadata('beat', props.cellData.field))

// Convert beatTypes to select options
const beatTypeOptions = computed(() =>
  props.beatTypes.map(type => ({
    value: type.id,
    label: t(`beatTypes.${type.id}`)
  }))
)

// Local value for editing
const localValue = ref<string | number | string[] | undefined>(undefined)

// Watch for cell data changes
watch(
  () => props.cellData,
  newData => {
    if (newData) {
      const beat = newData.beat
      let value = beat[newData.field as keyof Beat]

      // Normalize old data: convert string to array for cue and assets
      if ((newData.field === 'cue' || newData.field === 'assets') && typeof value === 'string') {
        value = value ? [value] : []
      }

      localValue.value = value as string | number | string[] | undefined
    }
  },
  { immediate: true }
)

function handleUpdate(value: unknown) {
  localValue.value = value as string | number | string[]
  emit('update-cell', props.cellData.beat, props.cellData.field, localValue.value)
}
</script>

<style scoped>
/* Minimal styles, inherits from panel */
</style>
