<template>
  <div class="beat-properties-form">
    <h3 class="form-title">Propiedades del Beat</h3>

    <v-text-field
      v-model="localBeat.title"
      label="Título"
      variant="outlined"
      density="comfortable"
      @input="handleUpdate"
      class="mb-4"
    />

    <v-select
      v-model="localBeat.typeId"
      :items="beatTypeItems"
      label="Tipo de Beat"
      variant="outlined"
      density="comfortable"
      @update:model-value="handleUpdate"
      class="mb-4"
    >
      <template #prepend-inner>
        <v-icon :color="getSelectedBeatType()?.color">
          {{ getSelectedBeatType()?.icon }}
        </v-icon>
      </template>
    </v-select>

    <v-textarea
      v-model="localBeat.description"
      label="Descripción"
      variant="outlined"
      rows="4"
      density="comfortable"
      @input="handleUpdate"
      class="mb-4"
    />

    <v-text-field
      v-model.number="localBeat.order"
      label="Orden"
      type="number"
      variant="outlined"
      density="comfortable"
      hint="Número de orden para la secuencia (menor = primero)"
      persistent-hint
      @input="handleUpdate"
    />

    <div class="metadata mt-4">
      <div class="metadata-item">
        <span class="metadata-label">ID:</span>
        <span class="metadata-value">{{ localBeat.id.substring(0, 8) }}...</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Posición X:</span>
        <span class="metadata-value">{{ Math.round(localBeat.position.x) }}px</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Posición Y:</span>
        <span class="metadata-value">{{ Math.round(localBeat.position.y) }}px</span>
      </div>
      <div class="metadata-item" v-if="localBeat.prevBeatId">
        <span class="metadata-label">Beat anterior:</span>
        <span class="metadata-value">Conectado</span>
      </div>
      <div class="metadata-item" v-if="localBeat.nextBeatId">
        <span class="metadata-label">Beat siguiente:</span>
        <span class="metadata-value">Conectado</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Creado:</span>
        <span class="metadata-value">{{ formatDate(localBeat.createdAt) }}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Modificado:</span>
        <span class="metadata-value">{{ formatDate(localBeat.updatedAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Beat, BeatType } from '@/domain/entities'

const props = defineProps<{
  beat: Beat
  beatTypes: BeatType[]
}>()

const emit = defineEmits<{
  update: [beat: Beat]
}>()

const localBeat = ref<Beat>({ ...props.beat })

// Watch for external changes to beat
watch(() => props.beat, (newBeat) => {
  localBeat.value = { ...newBeat }
}, { deep: true })

const beatTypeItems = computed(() =>
  props.beatTypes.map(type => ({
    value: type.id,
    title: type.name
  }))
)

function getSelectedBeatType(): BeatType | undefined {
  return props.beatTypes.find(t => t.id === localBeat.value.typeId)
}

function handleUpdate() {
  // Update timestamp
  localBeat.value.updatedAt = new Date().toISOString()
  // Emit updated beat
  emit('update', { ...localBeat.value })
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

:deep(.v-select__selection) {
  color: #e0e0e0;
}
</style>
