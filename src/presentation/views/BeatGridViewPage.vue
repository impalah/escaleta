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
          :beat-groups="project.beatGroups"
          :blocks="project.blocks"
          :lanes="project.lanes"
          @cell-click="handleCellClick"
          @lane-click="handleLaneClick"
          @block-click="handleBlockClick"
          @group-click="handleGroupClick"
        />
      </v-container>
    </v-main>

    <!-- Properties Panel (horizontal mode) for cell/entity editing -->
    <PropertiesPanel
      v-if="selectedCell || selectedLane || selectedBlock || selectedGroup"
      :title="getPanelTitle()"
      orientation="horizontal"
    >
      <template #content>
        <!-- Beat cell editor -->
        <CellEditorForm
          v-if="selectedCell"
          :cell-data="selectedCell"
          :beat-types="project.beatTypes"
          @update-cell="handleUpdateCell"
        />

        <!-- Lane properties -->
        <LanePropertiesForm
          v-else-if="selectedLane"
          :lane="selectedLane"
          :project="project"
          @update="handleUpdateLane"
          @delete="handleDeleteLane"
        />

        <!-- Block properties -->
        <BlockPropertiesForm
          v-else-if="selectedBlock"
          :block="selectedBlock"
          :project="project"
          @update="handleUpdateBlock"
          @delete="handleDeleteBlock"
        />

        <!-- Group properties -->
        <GroupPropertiesForm
          v-else-if="selectedGroup"
          :group="selectedGroup"
          :project="project"
          @update="handleUpdateGroup"
          @delete="handleDeleteGroup"
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
import LanePropertiesForm from '@/presentation/components/LanePropertiesForm.vue'
import BlockPropertiesForm from '@/presentation/components/BlockPropertiesForm.vue'
import GroupPropertiesForm from '@/presentation/components/GroupPropertiesForm.vue'
import { projectService } from '@/application/ProjectService'
import type { Project, Beat, Lane, Block, BeatGroup } from '@/domain/entities'

const { t, locale } = useI18n()

const project = ref<Project>(projectService.createExampleProject())

// Selected cell for cell editor panel
interface SelectedCell {
  beat: Beat
  field: string
}
const selectedCell = ref<SelectedCell | null>(null)
const selectedLane = ref<Lane | null>(null)
const selectedBlock = ref<Block | null>(null)
const selectedGroup = ref<BeatGroup | null>(null)
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
    beats: [...project.value.beats, newBeat]
  }
  projectService.saveCurrentProject(project.value)
  showNewBeatDialog.value = false
}

function handleCreateGroup() {
  const newGroup = projectService.createBeatGroup(
    project.value,
    t('examples.newBeat', { type: 'Group' })
  )
  project.value = {
    ...project.value,
    beatGroups: [...project.value.beatGroups, newGroup]
  }
  projectService.saveCurrentProject(project.value)
}

function getPanelTitle(): string {
  if (selectedCell.value) {
    const labels: Record<string, string> = {
      typeId: t('beatProperties.type'),
      order: t('beatProperties.order'),
      title: t('beatProperties.title'),
      eventDuration: t('beatProperties.eventDuration'),
      eventStartTime: t('beatProperties.eventStartTime'),
      scene: t('beatProperties.scene')
    }
    const fieldLabel = labels[selectedCell.value.field] || selectedCell.value.field
    return fieldLabel.toUpperCase()
  }
  if (selectedLane.value) {
    return t('propertiesPanel.lane')
  }
  if (selectedBlock.value) {
    return t('propertiesPanel.block')
  }
  if (selectedGroup.value) {
    return t('propertiesPanel.group')
  }
  return 'PROPERTIES'
}

function clearSelection() {
  selectedCell.value = null
  selectedLane.value = null
  selectedBlock.value = null
  selectedGroup.value = null
}

function handleCellClick(beat: Beat, field: string) {
  clearSelection()
  selectedCell.value = {
    beat,
    field
  }
}

function handleLaneClick(lane: Lane) {
  clearSelection()
  selectedLane.value = lane
}

function handleBlockClick(block: Block) {
  clearSelection()
  selectedBlock.value = block
}

function handleGroupClick(group: BeatGroup) {
  clearSelection()
  selectedGroup.value = group
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

function handleUpdateLane(updatedLane: Lane) {
  project.value = projectService.updateLane(project.value, updatedLane.id, updatedLane)
  selectedLane.value = project.value.lanes.find(l => l.id === updatedLane.id) || null
  projectService.saveCurrentProject(project.value)
}

function handleDeleteLane(laneId: string) {
  if (confirm(t('messages.confirmDeleteLane'))) {
    project.value = projectService.deleteLane(project.value, laneId)
    clearSelection()
    projectService.saveCurrentProject(project.value)
  }
}

function handleUpdateBlock(updatedBlock: Block) {
  project.value = projectService.updateBlock(project.value, updatedBlock.id, updatedBlock)
  selectedBlock.value = project.value.blocks.find(b => b.id === updatedBlock.id) || null
  projectService.saveCurrentProject(project.value)
}

function handleDeleteBlock(blockId: string) {
  if (confirm(t('messages.confirmDeleteBlock'))) {
    project.value = projectService.deleteBlock(project.value, blockId)
    clearSelection()
    projectService.saveCurrentProject(project.value)
  }
}

function handleUpdateGroup(updatedGroup: BeatGroup) {
  project.value = projectService.updateBeatGroup(project.value, updatedGroup.id, updatedGroup)
  selectedGroup.value = project.value.beatGroups.find(g => g.id === updatedGroup.id) || null
  projectService.saveCurrentProject(project.value)
}

function handleDeleteGroup(groupId: string) {
  if (confirm(t('groupProperties.deleteConfirm', { name: selectedGroup.value?.name || '' }))) {
    project.value = projectService.deleteBeatGroup(project.value, groupId)
    clearSelection()
    projectService.saveCurrentProject(project.value)
  }
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
