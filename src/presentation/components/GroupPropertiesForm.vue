<template>
  <div class="group-properties-form">
    <h3 class="form-title">{{ t('propertiesPanel.group') }}</h3>

    <v-text-field
      v-model="localGroup.name"
      :label="t('groupProperties.name')"
      variant="outlined"
      density="comfortable"
      @input="handleUpdate"
      class="mb-4"
    />

    <v-textarea
      v-model="localGroup.description"
      :label="t('groupProperties.description')"
      variant="outlined"
      density="comfortable"
      rows="3"
      @input="handleUpdate"
      class="mb-4"
    />

    <v-text-field
      v-model="localGroup.color"
      :label="t('groupProperties.color')"
      variant="outlined"
      density="comfortable"
      type="color"
      :hint="t('groupProperties.colorHint')"
      persistent-hint
      @input="handleUpdate"
      class="mb-4"
    />

    <v-checkbox
      v-model="localGroup.collapsed"
      :label="t('groupProperties.collapsed')"
      density="comfortable"
      @update:model-value="handleUpdate"
      class="mb-4"
    />

    <v-text-field
      v-model.number="localGroup.order"
      :label="t('groupProperties.order')"
      type="number"
      variant="outlined"
      density="comfortable"
      @input="handleUpdate"
      class="mb-4"
    />

    <v-divider class="my-4" />

    <div class="info-section">
      <p class="info-item">
        <span class="info-label">{{ t('groupProperties.beats') }}:</span>
        <span class="info-value">{{ localGroup.beatIds.length }}</span>
      </p>
      <p class="info-item">
        <span class="info-label">{{ t('groupProperties.createdAt') }}:</span>
        <span class="info-value">{{ formatDate(localGroup.createdAt) }}</span>
      </p>
      <p class="info-item">
        <span class="info-label">{{ t('groupProperties.updatedAt') }}:</span>
        <span class="info-value">{{ formatDate(localGroup.updatedAt) }}</span>
      </p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { BeatGroup } from '@/domain/entities'

const { t } = useI18n()

const props = defineProps<{
  group: BeatGroup
}>()

const emit = defineEmits<{
  update: [group: BeatGroup]
}>()

// Local copy for v-model bindings
const localGroup = ref<BeatGroup>({ ...props.group })

// Watch for external changes to the group
watch(() => props.group, (newGroup) => {
  localGroup.value = { ...newGroup }
}, { deep: true })

function handleUpdate() {
  // Emit updated group with new timestamp
  emit('update', {
    ...localGroup.value,
    updatedAt: new Date().toISOString()
  })
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString()
}
</script>

<style scoped>
.group-properties-form {
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

:deep(.v-checkbox .v-label) {
  color: #e0e0e0;
}

.info-section {
  padding: 12px;
  background-color: #2a2a2a;
  border-radius: 4px;
  border: 1px solid #444;
}

.info-item {
  margin-bottom: 8px;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #999;
  font-weight: 500;
}

.info-value {
  color: #e0e0e0;
}
</style>
