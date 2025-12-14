<template>
  <div class="block-properties-form">
    <h3 class="form-title">
      BLOCK
    </h3>

    <v-text-field
      v-model="localBlock.name"
      :label="t('blockProperties.name')"
      variant="outlined"
      density="comfortable"
      class="mb-4"
      @input="handleUpdate"
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

const localBlock = ref<Block>({ ...props.block })

// Watch for external updates
watch(
  () => props.block,
  (newBlock) => {
    localBlock.value = { ...newBlock }
  },
  { deep: true }
)

const handleUpdate = () => {
  emit('update', { ...localBlock.value })
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString()
}
</script>

<style scoped>
.block-properties-form {
  padding: 16px;
}

.form-title {
  font-size: 1.25rem;
  font-weight: 500;
  margin-bottom: 24px;
  color: rgba(103, 58, 183, 1);
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
  color: rgba(0, 0, 0, 0.6);
}

.info-value {
  color: rgba(0, 0, 0, 0.87);
}
</style>
