<template>
  <div class="project-properties-form">
    <h3 class="form-title">{{ t('propertiesPanel.project') }}</h3>

    <v-text-field
      v-model="localProject.name"
      :label="t('projectProperties.name')"
      variant="outlined"
      density="comfortable"
      @input="handleUpdate"
      class="mb-4"
    />

    <v-textarea
      v-model="localProject.description"
      :label="t('projectProperties.description')"
      variant="outlined"
      density="comfortable"
      rows="3"
      @input="handleUpdate"
    />

    <div class="metadata mt-4">
      <div class="metadata-item">
        <span class="metadata-label">{{ t('projectProperties.createdAt') }}:</span>
        <span class="metadata-value">{{ formatDate(localProject.createdAt) }}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">{{ t('projectProperties.updatedAt') }}:</span>
        <span class="metadata-value">{{ formatDate(localProject.updatedAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Project } from '@/domain/entities'

const { t } = useI18n()

const props = defineProps<{
  project: Project
}>()

const emit = defineEmits<{
  update: [project: Project]
}>()

const localProject = ref<Project>({ ...props.project })

// Watch for external changes to project
watch(() => props.project, (newProject) => {
  localProject.value = { ...newProject }
}, { deep: true })

function handleUpdate() {
  // Update timestamp
  localProject.value.updatedAt = new Date().toISOString()
  // Emit updated project
  emit('update', { ...localProject.value })
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.project-properties-form {
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

.metadata {
  background-color: #1e1e1e;
  border-radius: 4px;
  padding: 12px;
  border: 1px solid #444;
}

.metadata-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
}

.metadata-label {
  color: #999;
  font-weight: 500;
}

.metadata-value {
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
</style>
