<template>
  <div class="field-renderer">
    <!-- Text input -->
    <v-text-field
      v-if="metadata.type === 'text'"
      :model-value="modelValue"
      :label="$t(metadata.label)"
      :placeholder="metadata.format?.placeholder ? $t(metadata.format.placeholder) : undefined"
      :required="metadata.required"
      :readonly="metadata.readonly"
      :hint="metadata.description ? $t(metadata.description) : undefined"
      :persistent-hint="!!metadata.description"
      density="compact"
      variant="outlined"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Textarea -->
    <v-textarea
      v-else-if="metadata.type === 'textarea'"
      :model-value="modelValue"
      :label="$t(metadata.label)"
      :placeholder="metadata.format?.placeholder ? $t(metadata.format.placeholder) : undefined"
      :required="metadata.required"
      :readonly="metadata.readonly"
      :hint="metadata.description ? $t(metadata.description) : undefined"
      :persistent-hint="!!metadata.description"
      rows="3"
      auto-grow
      no-resize
      density="compact"
      variant="outlined"
      class="resizable-textarea"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Time input -->
    <v-text-field
      v-else-if="metadata.type === 'time'"
      :model-value="modelValue"
      :label="$t(metadata.label)"
      :placeholder="metadata.format?.placeholder"
      :required="metadata.required"
      :readonly="metadata.readonly"
      :hint="getTimeFormatHint()"
      persistent-hint
      density="compact"
      variant="outlined"
      @update:model-value="handleTimeUpdate"
    />

    <!-- Tags/Array input -->
    <v-combobox
      v-else-if="metadata.type === 'tags'"
      :model-value="modelValue || []"
      :label="$t(metadata.label)"
      :placeholder="metadata.format?.placeholder ? $t(metadata.format.placeholder) : undefined"
      :required="metadata.required"
      :readonly="metadata.readonly"
      :hint="metadata.description ? $t(metadata.description) : undefined"
      :persistent-hint="!!metadata.description"
      chips
      multiple
      density="compact"
      variant="outlined"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Select -->
    <v-select
      v-else-if="metadata.type === 'select'"
      :model-value="modelValue"
      :label="$t(metadata.label)"
      :items="selectOptions"
      item-title="label"
      item-value="value"
      :required="metadata.required"
      :readonly="metadata.readonly"
      :hint="metadata.description ? $t(metadata.description) : undefined"
      :persistent-hint="!!metadata.description"
      density="compact"
      variant="outlined"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Color picker -->
    <div v-else-if="metadata.type === 'color'" class="color-field">
      <v-label class="mb-2">
        {{ $t(metadata.label) }}
      </v-label>
      <v-menu :close-on-content-click="false">
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            :color="(modelValue as string) || '#6200EA'"
            variant="outlined"
            block
            class="mt-1"
          >
            <v-icon start> mdi-palette </v-icon>
            {{ (modelValue as string) || $t('common.selectColor') }}
          </v-btn>
        </template>
        <v-color-picker
          :model-value="modelValue as string"
          mode="hex"
          show-swatches
          @update:model-value="$emit('update:modelValue', $event)"
        />
      </v-menu>
    </div>

    <!-- Boolean/Switch -->
    <v-switch
      v-else-if="metadata.type === 'boolean'"
      :model-value="modelValue"
      :label="$t(metadata.label)"
      :readonly="metadata.readonly"
      :hint="metadata.description ? $t(metadata.description) : undefined"
      :persistent-hint="!!metadata.description"
      density="compact"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Number input -->
    <v-text-field
      v-else-if="metadata.type === 'number'"
      :model-value="modelValue"
      :label="$t(metadata.label)"
      :required="metadata.required"
      :readonly="metadata.readonly"
      :hint="metadata.description ? $t(metadata.description) : undefined"
      :persistent-hint="!!metadata.description"
      type="number"
      :min="metadata.format?.min"
      :max="metadata.format?.max"
      :step="metadata.format?.step || 1"
      density="compact"
      variant="outlined"
      @update:model-value="handleNumberUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FieldMetadata } from '@/domain/fieldMetadata'

const props = defineProps<{
  metadata: FieldMetadata
  modelValue: unknown
  // Optional: dynamic select options (e.g., for typeId from beatTypes)
  selectOptions?: Array<{ value: string; label: string }>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
}>()

const { t } = useI18n()

// Get select options from props or metadata
const selectOptions = computed(() => {
  if (props.selectOptions) {
    return props.selectOptions
  }
  if (props.metadata.format?.options) {
    return props.metadata.format.options.map(opt => ({
      value: opt.value,
      label: t(opt.label)
    }))
  }
  return []
})

function handleTimeUpdate(value: string) {
  // Basic validation for time format
  emit('update:modelValue', value)
}

function handleNumberUpdate(value: string) {
  const numValue = parseFloat(value)
  if (!isNaN(numValue)) {
    emit('update:modelValue', numValue)
  } else if (value === '') {
    emit('update:modelValue', undefined)
  }
}

function getTimeFormatHint(): string {
  if (props.metadata.format?.timeFormat) {
    return t('common.format') + ': ' + props.metadata.format.timeFormat
  }
  return ''
}
</script>

<style scoped>
.field-renderer {
  margin-bottom: 8px;
}

.color-field {
  margin-bottom: 8px;
}

/* Enable manual resize for textarea with visible grip handle */
.resizable-textarea :deep(textarea) {
  resize: vertical !important;
  min-height: 60px;
}

/* Ensure the resize grip is visible */
.resizable-textarea :deep(.v-field__field) {
  position: relative;
}

.resizable-textarea :deep(textarea)::-webkit-resizer {
  background-image:
    linear-gradient(135deg, transparent 50%, #666 50%),
    linear-gradient(45deg, transparent 50%, #666 50%);
  background-size: 8px 8px;
  background-position: bottom right;
  background-repeat: no-repeat;
}
</style>
