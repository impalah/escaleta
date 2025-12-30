<template>
  <div class="beat-properties-form">
    <h3 class="form-title">
      {{ t('propertiesPanel.beat') }}
    </h3>

    <template v-for="field in beatFields" :key="field.key">
      <!-- Group divider and header -->
      <template v-if="field.group && isFirstInGroup(field)">
        <v-divider class="my-4" />
        <div class="text-caption text-medium-emphasis mb-2">
          {{ t(`beat.groups.${field.group}`) }}
        </div>
      </template>

      <!-- Render field using FieldRenderer -->
      <FieldRenderer
        :metadata="field"
        :model-value="getFieldValue(field.key)"
        :select-options="field.key === 'typeId' ? beatTypeOptions : undefined"
        @update:model-value="updateField(field.key, $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Beat, BeatType } from '@/domain/entities'
import { getEditableFields, isFirstInGroup as checkFirstInGroup } from '@/domain/fieldMetadata'
import FieldRenderer from './FieldRenderer.vue'

const { t } = useI18n()

const props = defineProps<{
  beat: Beat
  beatTypes: BeatType[]
}>()

const emit = defineEmits<{
  update: [beat: Beat]
}>()

// Get editable fields for beat (canvas context)
const beatFields = computed(() => getEditableFields('beat', 'canvas'))

// Convert beatTypes to select options
const beatTypeOptions = computed(() =>
  props.beatTypes.map(type => ({
    value: type.id,
    label: t(`beatTypes.${type.id}`)
  }))
)

function getFieldValue(key: string): unknown {
  return props.beat[key as keyof Beat]
}

function updateField(key: string, value: unknown) {
  const updatedBeat = {
    ...props.beat,
    [key]: value,
    updatedAt: new Date().toISOString()
  }
  emit('update', updatedBeat)
}

function isFirstInGroup(field: (typeof beatFields.value)[0]): boolean {
  return checkFirstInGroup(field, beatFields.value)
}
</script>

<style scoped>
.beat-properties-form {
  color: #e0e0e0;
}

.form-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
  color: #fff;
  border-bottom: 1px solid #444;
  padding-bottom: 8px;
}

/* Override Vuetify dark theme colors for better contrast */
:deep(.v-field) {
  background-color: #1e1e1e;
  color: #e0e0e0;
}

:deep(.v-field--focused) {
  background-color: #252525;
}

:deep(.v-label) {
  color: #999;
}

:deep(.v-field__input) {
  color: #e0e0e0;
}

:deep(.v-select__selection) {
  color: #e0e0e0;
}
</style>
