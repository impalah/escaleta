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

    <v-text-field
      v-model.number="localBeat.order"
      label="Orden"
      type="number"
      variant="outlined"
      density="comfortable"
      hint="Número de orden para la secuencia (menor = primero)"
      persistent-hint
      @input="handleUpdate"
      class="mb-4"
    />

    <v-text-field
      v-model="localBeat.eventDuration"
      label="Duración estimada"
      variant="outlined"
      density="comfortable"
      placeholder="mm:ss.ms"
      hint="Formato: mm:ss.ms (ej: 02:30.500)"
      persistent-hint
      @input="handleUpdate"
      class="mb-4"
    />

    <v-text-field
      v-model="localBeat.eventStartTime"
      label="Hora inicio estimada"
      variant="outlined"
      density="comfortable"
      placeholder="hh:mm:ss.ms"
      hint="Formato: hh:mm:ss.ms (ej: 14:30:00.000)"
      persistent-hint
      @input="handleUpdate"
      class="mb-4"
    />

    <v-text-field
      v-model="localBeat.scene"
      label="Escena"
      variant="outlined"
      density="comfortable"
      placeholder="INT/EXT, ubicación, día/noche"
      hint="Ej: INT. OFICINA - DÍA"
      persistent-hint
      @input="handleUpdate"
      class="mb-4"
    />

    <v-text-field
      v-model="localBeat.character"
      label="Personaje"
      variant="outlined"
      density="comfortable"
      placeholder="Nombre del personaje"
      @input="handleUpdate"
      class="mb-4"
    />

    <v-text-field
      v-model="localBeat.cue"
      label="Cue (Evento técnico)"
      variant="outlined"
      density="comfortable"
      placeholder="Indicación técnica"
      @input="handleUpdate"
      class="mb-4"
    />

    <v-combobox
      v-model="localBeat.assets"
      label="Assets"
      variant="outlined"
      density="comfortable"
      multiple
      chips
      closable-chips
      placeholder="Añadir asset"
      hint="Presiona Enter para añadir un nuevo asset"
      persistent-hint
      @update:model-value="handleUpdate"
      class="mb-4"
    />

    <v-textarea
      v-model="localBeat.description"
      label="Script"
      variant="outlined"
      rows="6"
      density="comfortable"
      placeholder="Texto del guion para este beat"
      @input="handleUpdate"
    />
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

const localBeat = ref<Beat>({ 
  ...props.beat,
  assets: props.beat.assets || [] // Ensure assets is always an array
})

// Watch for external changes to beat
watch(() => props.beat, (newBeat) => {
  localBeat.value = { 
    ...newBeat,
    assets: newBeat.assets || [] // Ensure assets is always an array
  }
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
