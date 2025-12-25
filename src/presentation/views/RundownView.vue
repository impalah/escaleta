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
        <RundownTable
          :beats="project.beats"
          :beat-types="project.beatTypes"
          :beat-groups="project.beatGroups"
          :blocks="project.blocks"
          :lanes="project.lanes"
          @cell-click="handleCellClick"
          @lane-click="handleLaneClick"
          @block-click="handleBlockClick"
          @group-click="handleGroupClick"
          @drag-start="handleDragStart"
          @drag-move="handleDragMove"
          @drag-end="handleDragEnd"
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
import RundownTable from '@/presentation/components/RundownTable.vue'
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

function handleUpdateCell(beat: Beat, field: string, value: string | number | string[]) {
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

// Drag and drop handlers
interface BeatWithHierarchy extends Beat {
  lane?: Lane
  block?: Block
  group?: BeatGroup
}

function handleDragStart(beat: BeatWithHierarchy) {
  console.log('Drag started:', beat.title)
}

function handleDragMove(beat: BeatWithHierarchy, deltaY: number) {
  console.log('Drag moving:', beat.title, 'deltaY:', deltaY)
}

function handleDragEnd(
  beat: BeatWithHierarchy,
  dropTarget: {
    type: 'beat' | 'group' | 'lane' | 'block' | null
    data: Beat | BeatGroup | Lane | Block | null
  }
) {
  console.log('Drag ended:', beat.title, 'Drop target:', dropTarget)

  // Ignora el drop si el beat se suelta sobre sí mismo
  if (dropTarget.type === 'beat' && dropTarget.data?.id === beat.id) {
    return
  }

  // Encuentra el group actual del beat origin
  const sourceGroup = project.value.beatGroups.find(g => g.beatIds.includes(beat.id))

  if (dropTarget.type === 'beat') {
    // Drop sobre un Beat
    const targetBeat = dropTarget.data as Beat
    const targetGroup = project.value.beatGroups.find(g => g.beatIds.includes(targetBeat.id))

    if (!targetGroup) {
      // El Beat destino NO forma parte de ningún Group
      // → Eliminar el Beat origen de su Group (si tiene)
      if (sourceGroup) {
        const updatedGroup = {
          ...sourceGroup,
          beatIds: sourceGroup.beatIds.filter(id => id !== beat.id)
        }
        project.value = projectService.updateBeatGroup(project.value, sourceGroup.id, updatedGroup)
        projectService.saveCurrentProject(project.value)
      }
    } else {
      // El Beat destino SÍ forma parte de un Group
      // → Aplicar regla Timeline: beat origen ocupa lugar de beat destino

      // Primero remover beat origen de su group actual (si tiene y es diferente al destino)
      if (sourceGroup && sourceGroup.id !== targetGroup.id) {
        const updatedSourceGroup = {
          ...sourceGroup,
          beatIds: sourceGroup.beatIds.filter(id => id !== beat.id)
        }
        project.value = projectService.updateBeatGroup(
          project.value,
          sourceGroup.id,
          updatedSourceGroup
        )
      }

      // Luego insertar beat origen en la posición del beat destino
      const targetIndex = targetGroup.beatIds.indexOf(targetBeat.id)
      let newBeatIds: string[]

      if (sourceGroup?.id === targetGroup.id) {
        // Mismo group: reordenar
        newBeatIds = targetGroup.beatIds.filter(id => id !== beat.id)
        newBeatIds.splice(targetIndex, 0, beat.id)
      } else {
        // Diferente group: insertar
        newBeatIds = [...targetGroup.beatIds]
        newBeatIds.splice(targetIndex, 0, beat.id)
      }

      const updatedTargetGroup = {
        ...targetGroup,
        beatIds: newBeatIds
      }
      project.value = projectService.updateBeatGroup(
        project.value,
        targetGroup.id,
        updatedTargetGroup
      )
      projectService.saveCurrentProject(project.value)
    }
  } else if (dropTarget.type === 'group') {
    // Drop sobre un Group
    // → Beat pasa a ocupar el último lugar en ese Group
    const targetGroup = dropTarget.data as BeatGroup

    // Remover beat de su group actual (si tiene y es diferente)
    if (sourceGroup && sourceGroup.id !== targetGroup.id) {
      const updatedSourceGroup = {
        ...sourceGroup,
        beatIds: sourceGroup.beatIds.filter(id => id !== beat.id)
      }
      project.value = projectService.updateBeatGroup(
        project.value,
        sourceGroup.id,
        updatedSourceGroup
      )
    }

    // Añadir beat al final del target group (si no está ya)
    if (!targetGroup.beatIds.includes(beat.id)) {
      const updatedTargetGroup = {
        ...targetGroup,
        beatIds: [...targetGroup.beatIds, beat.id]
      }
      project.value = projectService.updateBeatGroup(
        project.value,
        targetGroup.id,
        updatedTargetGroup
      )
    }

    projectService.saveCurrentProject(project.value)
  } else if (
    dropTarget.type === 'lane' ||
    dropTarget.type === 'block' ||
    dropTarget.type === null
  ) {
    // Drop sobre Lane, Block, o fuera del grid
    // → Eliminar el Beat de su Group (si tiene)
    if (sourceGroup) {
      const updatedGroup = {
        ...sourceGroup,
        beatIds: sourceGroup.beatIds.filter(id => id !== beat.id)
      }
      project.value = projectService.updateBeatGroup(project.value, sourceGroup.id, updatedGroup)
      projectService.saveCurrentProject(project.value)
    }
  }
}
</script>

<style scoped>
.v-main {
  background-color: #f5f5f5;
}
</style>
