<template>
  <v-app>
    <AppToolbar
      :project-name="project.name"
      :show-zoom-controls="false"
      :hide-beat-controls="true"
      @new-project="handleNewProject"
      @save="handleSave"
      @export-json="handleExportJSON"
      @export-script="handleExportScript"
      @change-language="changeLanguage"
    />

    <v-main>
      <v-container fluid class="fountain-container pa-0">
        <v-textarea
          v-model="fountainText"
          class="fountain-editor"
          variant="solo"
          flat
          hide-details
          no-resize
          :placeholder="t('fountainView.placeholder')"
          @update:model-value="handleTextChange"
        />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLanguage } from '@/i18n'
import AppToolbar from '@/presentation/components/AppToolbar.vue'
import { projectService } from '@/application/ProjectService'
import type { Project } from '@/domain/entities'

const { t, locale } = useI18n()

const project = ref<Project>(projectService.createExampleProject())
const fountainText = ref('')

onMounted(() => {
  const loaded = projectService.loadCurrentProject()
  if (loaded) {
    project.value = loaded
    console.log('Loaded project:', project.value.name)
    // TODO: Convert project data to Fountain format
    fountainText.value = t('fountainView.emptyPlaceholder')
  } else {
    // Create and save example project
    project.value = projectService.createExampleProject()
    projectService.saveCurrentProject(project.value)
    fountainText.value = t('fountainView.emptyPlaceholder')
  }
})

function handleNewProject() {
  if (confirm(t('toolbar.newProjectConfirm'))) {
    project.value = projectService.createExampleProject()
    projectService.saveCurrentProject(project.value)
    fountainText.value = t('fountainView.emptyPlaceholder')
  }
}

function handleSave() {
  // TODO: Convert Fountain text back to project structure
  projectService.saveCurrentProject(project.value)
}

function handleExportJSON() {
  alert(t('toolbar.exportToJSON') + ' - Not implemented yet')
}

function handleExportScript() {
  alert(t('toolbar.exportToScript') + ' - Not implemented yet')
}

function handleTextChange() {
  // TODO: Debounce and auto-save
  console.log('Fountain text changed')
}

function changeLanguage(langCode: string) {
  locale.value = langCode
  setLanguage(langCode)
}
</script>

<style scoped>
.fountain-container {
  height: calc(100vh - 48px);
  overflow: hidden;
}

.fountain-editor {
  height: 100%;
  font-family: 'Courier New', 'Courier', monospace;
  font-size: 12pt;
  line-height: 1.5;
}

.fountain-editor :deep(textarea) {
  height: 100% !important;
  padding: 40px 20% !important;
  line-height: 1.5 !important;
}

.fountain-editor :deep(.v-field__field) {
  height: 100% !important;
}

.fountain-editor :deep(.v-field) {
  height: 100% !important;
  border-radius: 0 !important;
}
</style>
