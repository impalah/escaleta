<template>
  <v-app>
    <AppToolbar
      :project-name="project.name"
      :show-zoom-controls="false"
      @new-project="handleNewProject"
      @save="handleSave"
      @export-json="handleExportJSON"
      @export-script="handleExportScript"
      @change-language="changeLanguage"
      @add-beat="showNewBeatDialog = true"
      @create-group="handleCreateGroup"
    />

    <v-main>
      <v-container fluid>
        <BeatGridView
          :beats="project.beats"
          :beat-types="project.beatTypes"
          @cell-click="handleCellClick"
        />
      </v-container>
    </v-main>

    <!-- Properties Panel (horizontal mode) for cell editing -->
    <PropertiesPanel
      v-if="selectedCell"
      :title="getCellPanelTitle()"
      orientation="horizontal"
    >
      <template #content>
        <CellEditorForm
          :cell-data="selectedCell"
          :beat-types="project.beatTypes"
          @update-cell="handleUpdateCell"
        />
      </template>
    </PropertiesPanel>

    <!-- New Beat Dialog -->
    <BeatTypeSelectDialog
      v-model="showNewBeatDialog"
      :beat-types="project.beatTypes"
      @select="handleCreateBeat"
    />
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLanguage } from '@/i18n'
import AppToolbar from '@/presentation/components/AppToolbar.vue'
import BeatGridView from '@/presentation/components/BeatGridView.vue'
import PropertiesPanel from '@/presentation/components/PropertiesPanel.vue'
import CellEditorForm from '@/presentation/components/CellEditorForm.vue'
import BeatTypeSelectDialog from '@/presentation/components/BeatTypeSelectDialog.vue'
import { projectService } from '@/application/ProjectService'
import type { Project, Beat } from '@/domain/entities'

const { t, locale } = useI18n()

const project = ref<Project>(projectService.createExampleProject())

// Selected cell for cell editor panel
interface SelectedCell {
  beat: Beat
  field: string
}
const selectedCell = ref<SelectedCell | null>(null)
const showNewBeatDialog = ref(false)

onMounted(() => {
  const loaded = projectService.loadCurrentProject()
  if (loaded) {
    project.value = loaded
    console.log('Loaded project:', project.value.name)
  } else {
    // Create and save example project
    project.value = projectService.createExampleProject()
    projectService.saveCurrentProject(project.value)
  }
})

function handleNewProject() {
  if (confirm(t('toolbar.newProjectConfirm'))) {
    project.value = projectService.createExampleProject()
    projectService.saveCurrentProject(project.value)
    selectedCell.value = null
  }
}

function handleSave() {
  projectService.saveCurrentProject(project.value)
}

function handleExportJSON() {
  alert(t('toolbar.exportToJSON') + ' - Not implemented yet')
}

function handleExportScript() {
  alert(t('toolbar.exportToScript') + ' - Not implemented yet')
}

function handleCreateBeat(typeId: string) {
  const newBeat = projectService.createBeat(typeId, project.value)
  project.value = {
    ...project.value,
    beats: [...project.value.beats, newBeat],
  }
  projectService.saveCurrentProject(project.value)
  showNewBeatDialog.value = false
}

function handleCreateGroup() {
  const newGroup = projectService.createBeatGroup(project.value, t('examples.newBeat', { type: 'Group' }))
  project.value = {
    ...project.value,
    beatGroups: [...project.value.beatGroups, newGroup],
  }
  projectService.saveCurrentProject(project.value)
}

function getCellPanelTitle(): string {
  if (!selectedCell.value) return 'CELL EDITOR'
  const labels: Record<string, string> = {
    typeId: t('beatProperties.type'),
    order: t('beatProperties.order'),
    title: t('beatProperties.title'),
    eventDuration: t('beatProperties.eventDuration'),
    eventStartTime: t('beatProperties.eventStartTime'),
    scene: t('beatProperties.scene'),
  }
  const fieldLabel = labels[selectedCell.value.field] || selectedCell.value.field
  return fieldLabel.toUpperCase()
}

function handleCellClick(beat: Beat, field: string) {
  selectedCell.value = {
    beat,
    field
  }
}

function handleUpdateCell(beat: Beat, field: string, value: string | number) {
  // Create updated beat with new field value
  const updatedBeat = {
    ...beat,
    [field]: value
  }
  
  // Update in project
  project.value = projectService.updateBeat(project.value, beat.id, updatedBeat)
  
  // Update selected cell reference with updated beat
  const newBeat = project.value.beats.find(b => b.id === beat.id)
  if (newBeat && selectedCell.value) {
    selectedCell.value = {
      beat: newBeat,
      field: selectedCell.value.field
    }
  }
  
  projectService.saveCurrentProject(project.value)
}

function changeLanguage(langCode: string) {
  locale.value = langCode
  setLanguage(langCode)
}
</script>

<style scoped>
.v-main {
  background-color: #f5f5f5;
}
</style>
