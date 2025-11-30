<template>
  <v-dialog :model-value="modelValue" max-width="500" @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="text-h5">Seleccionar Tipo de Beat</v-card-title>

      <v-card-text>
        <v-list>
          <v-list-item
            v-for="beatType in beatTypes"
            :key="beatType.id"
            :prepend-icon="beatType.icon"
            :title="beatType.name"
            @click="handleSelect(beatType.id)"
          >
            <template #prepend>
              <v-icon :color="beatType.color">{{ beatType.icon }}</v-icon>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="grey" variant="text" @click="handleCancel">Cancelar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { BeatType } from '@/domain/entities'

defineProps<{
  modelValue: boolean
  beatTypes: BeatType[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [typeId: string]
}>()

function handleSelect(typeId: string) {
  emit('select', typeId)
  emit('update:modelValue', false)
}

function handleCancel() {
  emit('update:modelValue', false)
}
</script>
