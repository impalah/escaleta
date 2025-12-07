<template>
  <div class="block-properties-form">
    <h3 class="form-title">BLOCK</h3>

    <v-text-field
      v-model="localBlock.name"
      :label="t('blockProperties.name')"
      variant="outlined"
      density="comfortable"
      @input="handleUpdate"
      class="mb-4"
    />

    <v-textarea
      v-model="localBlock.description"
      :label="t('blockProperties.description')"
      variant="outlined"
      density="comfortable"
      rows="3"
      @input="handleUpdate"
      class="mb-4"
    />

    <v-text-field
      v-model="localBlock.backgroundColor"
      :label="t('blockProperties.backgroundColor')"
      variant="outlined"
      density="comfortable"
      type="color"
      @input="handleUpdate"
      class="mb-4"
    />

    <v-text-field
      v-model.number="localBlock.order"
      :label="t('blockProperties.order')"
      type="number"
      variant="outlined"
      density="comfortable"
      @input="handleUpdate"
      class="mb-4"
    />

    <v-divider class="my-4" />

    <div class="info-section">
      <p class="info-item">
        <span class="info-label">{{ t('blockProperties.groups') }}:</span>
        <span class="info-value">{{ localBlock.groupIds.length }}</span>
      </p>
      <p class="info-item">
        <span class="info-label">{{ t('blockProperties.createdAt') }}:</span>
        <span class="info-value">{{ formatDate(localBlock.createdAt) }}</span>
      </p>
      <p class="info-item">
        <span class="info-label">{{ t('blockProperties.updatedAt') }}:</span>
        <span class="info-value">{{ formatDate(localBlock.updatedAt) }}</span>
      </p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Block } from '@/domain/entities'

const { t } = useI18n()

const props = defineProps<{
  block: Block
}>()

const emit = defineEmits<{
  update: [block: Block]
}>()

// Local copy for v-model bindings
const localBlock = ref<Block>({ ...props.block })

// Watch for external changes to the block
watch(() => props.block, (newBlock) => {
  localBlock.value = { ...newBlock }
}, { deep: true })

function handleUpdate() {
  // Emit updated block with new timestamp
  emit('update', {
    ...localBlock.value,
    updatedAt: new Date().toISOString()
  })
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString()
}
</script>

<style scoped>
.block-properties-form {
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

.info-section {
  padding: 8px;
  background-color: #1a1a1a;
  border-radius: 4px;
}

.info-item {
  margin-bottom: 8px;
  font-size: 14px;
}

.info-label {
  font-weight: 500;
  color: #999;
  margin-right: 8px;
}

.info-value {
  color: #e0e0e0;
}
</style>
