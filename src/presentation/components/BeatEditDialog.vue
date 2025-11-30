<template>
  <v-dialog :model-value="modelValue" max-width="600" @update:model-value="$emit('update:modelValue', $event)">
    <v-card v-if="beat">
      <v-card-title class="text-h5">Editar Beat</v-card-title>

      <v-card-text>
        <v-text-field
          v-model="localBeat.title"
          label="Título"
          variant="outlined"
          density="comfortable"
          class="mb-4"
        />

        <v-select
          v-model="localBeat.typeId"
          :items="beatTypeItems"
          label="Tipo de Beat"
          variant="outlined"
          density="comfortable"
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
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="grey" variant="text" @click="handleCancel">Cancelar</v-btn>
        <v-btn color="primary" variant="elevated" @click="handleSave">Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Beat, BeatType } from '@/domain/entities'

const props = defineProps<{
  modelValue: boolean
  beat: Beat | null
  beatTypes: BeatType[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [updates: Partial<Beat>]
}>()

const localBeat = ref<Partial<Beat>>({
  title: '',
  typeId: '',
  description: ''
})

// Watch for beat changes to update local copy
watch(
  () => props.beat,
  newBeat => {
    if (newBeat) {
      localBeat.value = {
        title: newBeat.title,
        typeId: newBeat.typeId,
        description: newBeat.description
      }
    }
  },
  { immediate: true }
)

const beatTypeItems = computed(() =>
  props.beatTypes.map(type => ({
    value: type.id,
    title: type.name
  }))
)

function getSelectedBeatType(): BeatType | undefined {
  return props.beatTypes.find(t => t.id === localBeat.value.typeId)
}

function handleSave() {
  emit('save', localBeat.value)
}

function handleCancel() {
  emit('update:modelValue', false)
}
</script>
