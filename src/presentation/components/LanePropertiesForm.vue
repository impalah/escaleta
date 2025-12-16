<template>
  <div class="lane-properties-form">
    <h3 class="form-title">
      LANE
    </h3>

    <v-text-field
      v-model="localLane.name"
      :label="t('laneProperties.name')"
      variant="outlined"
      density="comfortable"
      class="mb-4"
      @input="handleUpdate"
    />

    <v-divider class="my-4" />

    <div class="info-section">
      <p class="info-item">
        <span class="info-label">{{ t('laneProperties.blocks') }}:</span>
        <span class="info-value">{{ localLane.blockIds.length }}</span>
      </p>
      <p class="info-item">
        <span class="info-label">{{ t('laneProperties.createdAt') }}:</span>
        <span class="info-value">{{ formatDate(localLane.createdAt) }}</span>
      </p>
      <p class="info-item">
        <span class="info-label">{{ t('laneProperties.updatedAt') }}:</span>
        <span class="info-value">{{ formatDate(localLane.updatedAt) }}</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Lane } from '@/domain/entities'

const { t } = useI18n()

const props = defineProps<{
  lane: Lane
}>()

const emit = defineEmits<{
  update: [lane: Lane]
}>()

const localLane = ref<Lane>({ ...props.lane })

// Watch for external updates
watch(
  () => props.lane,
  (newLane) => {
    localLane.value = { ...newLane }
  },
  { deep: true }
)

const handleUpdate = () => {
  emit('update', { ...localLane.value })
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString()
}
</script>

<style scoped>
.lane-properties-form {
  padding: 16px;
}

.form-title {
  font-size: 1.25rem;
  font-weight: 500;
  margin-bottom: 24px;
  color: #64b5f6;
  border-bottom: 1px solid #444;
  padding-bottom: 8px;
}

.info-section {
  padding: 8px 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 0.875rem;
}

.info-label {
  font-weight: 500;
  color: #999;
}

.info-value {
  color: #e0e0e0;
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
