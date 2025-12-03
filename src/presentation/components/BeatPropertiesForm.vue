<template>
  <div class="beat-properties-form">
    <h3 class="form-title">{{ t('propertiesPanel.beat') }}</h3>

    <v-text-field
      v-model="localBeat.title"
      :label="t('beatProperties.title')"
      variant="outlined"
      density="comfortable"
      @input="handleUpdate"
      class="mb-4"
    />

    <v-select
      v-model="localBeat.typeId"
      :items="beatTypeItems"
      :label="t('beatProperties.type')"
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
      :label="t('beatProperties.order')"
      type="number"
      variant="outlined"
      density="comfortable"
      @input="handleUpdate"
      class="mb-4"
    />

    <v-text-field
      v-model="localBeat.eventDuration"
      :label="t('beatProperties.eventDuration')"
      variant="outlined"
      density="comfortable"
      placeholder="mm:ss.ms"
      :hint="t('beatProperties.eventDurationHint')"
      persistent-hint
      @input="handleUpdate"
      class="mb-4"
    />

    <v-text-field
      v-model="localBeat.eventStartTime"
      :label="t('beatProperties.eventStartTime')"
      variant="outlined"
      density="comfortable"
      placeholder="hh:mm:ss.ms"
      :hint="t('beatProperties.eventStartTimeHint')"
      persistent-hint
      @input="handleUpdate"
      class="mb-4"
    />

    <v-text-field
      v-model="localBeat.scene"
      :label="t('beatProperties.scene')"
      variant="outlined"
      density="comfortable"
      :placeholder="t('beatProperties.sceneHint')"
      persistent-hint
      @input="handleUpdate"
      class="mb-4"
    />

    <v-text-field
      v-model="localBeat.character"
      :label="t('beatProperties.character')"
      variant="outlined"
      density="comfortable"
      :placeholder="t('beatProperties.characterHint')"
      @input="handleUpdate"
      class="mb-4"
    />

    <v-text-field
      v-model="localBeat.cue"
      :label="t('beatProperties.cue')"
      variant="outlined"
      density="comfortable"
      :placeholder="t('beatProperties.cueHint')"
      @input="handleUpdate"
      class="mb-4"
    />

    <v-combobox
      v-model="localBeat.assets"
      :label="t('beatProperties.assets')"
      variant="outlined"
      density="comfortable"
      multiple
      chips
      closable-chips
      :hint="t('beatProperties.assetsHint')"
      persistent-hint
      @update:model-value="handleUpdate"
      class="mb-4"
    />

    <v-textarea
      v-model="localBeat.description"
      :label="t('beatProperties.script')"
      variant="outlined"
      rows="6"
      density="comfortable"
      @input="handleUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Beat, BeatType } from '@/domain/entities'

const { t } = useI18n()

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
    title: t(`beatTypes.${type.id}`)
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
