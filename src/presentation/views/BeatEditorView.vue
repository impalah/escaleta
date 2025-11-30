<template>
  <v-container fluid class="pa-0 fill-height">
    <!-- App Bar -->
    <v-app-bar color="primary" density="compact" elevation="2">
      <v-toolbar-title>{{ project.name }}</v-toolbar-title>

      <v-spacer />

      <!-- Toolbar buttons -->
      <v-btn icon @click="handleNewProject" aria-label="New project">
        <v-icon>mdi-file-plus</v-icon>
        <v-tooltip activator="parent" location="bottom">Nuevo Proyecto</v-tooltip>
      </v-btn>

      <v-btn icon @click="handleSave" aria-label="Save project">
        <v-icon>mdi-content-save</v-icon>
        <v-tooltip activator="parent" location="bottom">Guardar</v-tooltip>
      </v-btn>

      <v-menu>
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-export</v-icon>
            <v-tooltip activator="parent" location="bottom">Exportar</v-tooltip>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="handleExportJSON">
            <v-list-item-title>Exportar a JSON</v-list-item-title>
          </v-list-item>
          <v-list-item @click="handleExportScript">
            <v-list-item-title>Exportar a Guion</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-divider vertical class="mx-2" />

      <v-btn icon @click="handleZoomIn">
        <v-icon>mdi-magnify-plus</v-icon>
        <v-tooltip activator="parent" location="bottom">Zoom +</v-tooltip>
      </v-btn>

      <v-btn icon @click="handleZoomOut">
        <v-icon>mdi-magnify-minus</v-icon>
        <v-tooltip activator="parent" location="bottom">Zoom -</v-tooltip>
      </v-btn>

      <v-divider vertical class="mx-2" />

      <v-btn icon color="accent" @click="showNewBeatDialog = true" aria-label="Add beat">
        <v-icon>mdi-plus-circle</v-icon>
        <v-tooltip activator="parent" location="bottom">Añadir Beat</v-tooltip>
      </v-btn>
    </v-app-bar>

    <!-- Beat Canvas -->
    <v-sheet class="beat-canvas-container">
      <div
        ref="canvasRef"
        class="beat-canvas"
        :style="{ transform: `scale(${zoom})`, transformOrigin: 'top left' }"
      >
        <BeatCard
          v-for="beat in project.beats"
          :key="beat.id"
          :beat="beat"
          :beat-type="getBeatType(beat.typeId)"
          @click="openEditDialog(beat)"
        />
      </div>
    </v-sheet>

    <!-- Edit Beat Dialog -->
    <BeatEditDialog
      v-model="showEditDialog"
      :beat="selectedBeat"
      :beat-types="project.beatTypes"
      @save="handleSaveBeat"
    />

    <!-- New Beat Dialog -->
    <BeatTypeSelectDialog
      v-model="showNewBeatDialog"
      :beat-types="project.beatTypes"
      @select="handleCreateBeat"
    />
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Beat, BeatType, Project } from '@/domain/entities'
import { projectService } from '@/application/ProjectService'
import BeatCard from '@/presentation/components/BeatCard.vue'
import BeatEditDialog from '@/presentation/components/BeatEditDialog.vue'
import BeatTypeSelectDialog from '@/presentation/components/BeatTypeSelectDialog.vue'

const project = ref<Project>(projectService.loadCurrentProject())
const zoom = ref(1)
const showEditDialog = ref(false)
const showNewBeatDialog = ref(false)
const selectedBeat = ref<Beat | null>(null)
const canvasRef = ref<HTMLElement | null>(null)

onMounted(() => {
  // Project is already loaded in ref initialization
  console.log('Loaded project:', project.value.name)
})

function getBeatType(typeId: string): BeatType | undefined {
  return project.value.beatTypes.find(t => t.id === typeId)
}

function openEditDialog(beat: Beat) {
  selectedBeat.value = beat
  showEditDialog.value = true
}

function handleSaveBeat(updates: Partial<Beat>) {
  if (!selectedBeat.value) return

  project.value = projectService.updateBeat(project.value, selectedBeat.value.id, updates)
  projectService.saveCurrentProject(project.value)

  showEditDialog.value = false
  selectedBeat.value = null
}

function handleCreateBeat(typeId: string) {
  const newBeat = projectService.createBeat(typeId, project.value)
  project.value = {
    ...project.value,
    beats: [...project.value.beats, newBeat],
    updatedAt: new Date().toISOString()
  }
  projectService.saveCurrentProject(project.value)

  showNewBeatDialog.value = false
}

function handleSave() {
  projectService.saveCurrentProject(project.value)
  console.log('Project saved')
  // TODO: Show success notification
}

function handleNewProject() {
  // TODO: Implement new project dialog
  console.log('TODO: New project')
}

function handleExportJSON() {
  // TODO: Implement JSON export
  console.log('TODO: Export to JSON')
}

function handleExportScript() {
  // TODO: Implement script export
  console.log('TODO: Export to script format')
}

function handleZoomIn() {
  zoom.value = Math.min(zoom.value + 0.1, 2)
}

function handleZoomOut() {
  zoom.value = Math.max(zoom.value - 0.1, 0.5)
}
</script>

<style scoped>
.beat-canvas-container {
  flex: 1;
  overflow: auto;
  background: #f5f5f5;
  position: relative;
}

.beat-canvas {
  position: relative;
  min-width: 2000px;
  min-height: 1000px;
  /* TODO: Add grid background for visual reference */
}
</style>
