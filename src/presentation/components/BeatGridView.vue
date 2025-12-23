<template>
  <v-data-table
    :headers="headers"
    :items="hierarchicalBeats"
    :items-per-page="-1"
    class="excel-grid elevation-1"
    density="comfortable"
    fixed-header
    height="calc(100vh - 128px)"
    hide-default-footer
  >
    <!-- Lane column -->
    <template #[`item.laneName`]="{ item }">
      <div class="grid-cell">
        {{ item.laneName || '—' }}
      </div>
    </template>

    <!-- Block column -->
    <template #[`item.blockName`]="{ item }">
      <div class="grid-cell">
        {{ item.blockName || '—' }}
      </div>
    </template>

    <!-- Group column -->
    <template #[`item.groupName`]="{ item }">
      <div class="grid-cell">
        {{ item.groupName || '—' }}
      </div>
    </template>

    <!-- Beat type with icon and color -->
    <template #[`item.typeId`]="{ item }">
      <div class="grid-cell" @click.stop="handleCellClick(item, 'typeId')">
        <v-chip
          :color="getBeatType(item.typeId)?.color"
          variant="flat"
          size="small"
          class="font-weight-medium"
        >
          <v-icon start :icon="getBeatType(item.typeId)?.icon" />
          {{ t(`beatTypes.${item.typeId}`) }}
        </v-chip>
      </div>
    </template>

    <!-- Title column (truncate long titles) -->
    <template #[`item.title`]="{ item }">
      <div
        class="text-truncate grid-cell"
        style="max-width: 250px"
        @click.stop="handleCellClick(item, 'title')"
      >
        {{ item.title }}
      </div>
    </template>

    <!-- Duration column -->
    <template #[`item.eventDuration`]="{ item }">
      <div class="grid-cell" @click.stop="handleCellClick(item, 'eventDuration')">
        {{ item.eventDuration || '—' }}
      </div>
    </template>

    <!-- Start Time column -->
    <template #[`item.eventStartTime`]="{ item }">
      <div class="grid-cell" @click.stop="handleCellClick(item, 'eventStartTime')">
        {{ item.eventStartTime || '—' }}
      </div>
    </template>

    <!-- Scene column -->
    <template #[`item.scene`]="{ item }">
      <div class="grid-cell" @click.stop="handleCellClick(item, 'scene')">
        {{ item.scene || '—' }}
      </div>
    </template>

    <!-- Character column -->
    <template #[`item.character`]="{ item }">
      <div class="grid-cell" @click.stop="handleCellClick(item, 'character')">
        {{ item.character || '—' }}
      </div>
    </template>

    <!-- Cue column -->
    <template #[`item.cue`]="{ item }">
      <div class="grid-cell" @click.stop="handleCellClick(item, 'cue')">
        {{ item.cue || '—' }}
      </div>
    </template>

    <!-- Script/Description column -->
    <template #[`item.description`]="{ item }">
      <div
        class="text-truncate grid-cell"
        style="max-width: 300px"
        @click.stop="handleCellClick(item, 'description')"
      >
        {{ item.description || '—' }}
      </div>
    </template>

    <!-- Assets column -->
    <template #[`item.assets`]="{ item }">
      <div class="grid-cell" @click.stop="handleCellClick(item, 'assets')">
        {{ item.assets?.join(', ') || '—' }}
      </div>
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Beat, BeatType, BeatGroup, Block, Lane } from '@/domain/entities'

const { t } = useI18n()

const props = defineProps<{
  beats: Beat[]
  beatTypes: BeatType[]
  beatGroups: BeatGroup[]
  blocks: Block[]
  lanes: Lane[]
}>()

const emit = defineEmits<{
  'cell-click': [beat: Beat, field: string]
}>()

interface BeatWithHierarchy extends Beat {
  laneName?: string
  blockName?: string
  groupName?: string
}

const headers = computed(() => [
  { title: t('beatGrid.lane'), key: 'laneName', width: 120, sortable: false },
  { title: t('beatGrid.block'), key: 'blockName', width: 120, sortable: false },
  { title: t('beatGrid.group'), key: 'groupName', width: 120, sortable: false },
  { title: t('beatGrid.type'), key: 'typeId', width: 150, sortable: true },
  { title: t('beatGrid.title'), key: 'title', width: 200, sortable: true },
  { title: t('beatGrid.script'), key: 'description', width: 300, sortable: false },
  { title: t('beatGrid.duration'), key: 'eventDuration', width: 120, sortable: false },
  { title: t('beatGrid.startTime'), key: 'eventStartTime', width: 120, sortable: false },
  { title: t('beatGrid.scene'), key: 'scene', width: 150, sortable: false },
  { title: t('beatGrid.character'), key: 'character', width: 120, sortable: false },
  { title: t('beatGrid.cue'), key: 'cue', width: 120, sortable: false },
  { title: t('beatGrid.assets'), key: 'assets', width: 200, sortable: false }
])

// Hierarchical ordering: Lane → Block → Group → Beat
const hierarchicalBeats = computed(() => {
  const result: BeatWithHierarchy[] = []
  const processedBeats = new Set<string>()

  // Helper to find group containing a beat
  function findGroupForBeat(beatId: string): BeatGroup | undefined {
    return props.beatGroups.find(g => g.beatIds.includes(beatId))
  }

  // Helper to find block containing a group
  function findBlockForGroup(groupId: string): Block | undefined {
    return props.blocks.find(b => b.groupIds.includes(groupId))
  }

  // Helper to find lane containing a block
  function findLaneForBlock(blockId: string): Lane | undefined {
    return props.lanes.find(l => l.blockIds.includes(blockId))
  }

  // Helper to add beat with hierarchy info
  function addBeat(beat: Beat, laneName?: string, blockName?: string, groupName?: string) {
    if (!processedBeats.has(beat.id)) {
      result.push({ ...beat, laneName, blockName, groupName })
      processedBeats.add(beat.id)
    }
  }

  // 1. Process all lanes and their descendants
  props.lanes.forEach(lane => {
    lane.blockIds.forEach(blockId => {
      const block = props.blocks.find(b => b.id === blockId)
      if (block) {
        block.groupIds.forEach(groupId => {
          const group = props.beatGroups.find(g => g.id === groupId)
          if (group) {
            group.beatIds.forEach(beatId => {
              const beat = props.beats.find(b => b.id === beatId)
              if (beat) {
                addBeat(beat, lane.name, block.name, group.name)
              }
            })
          }
        })
      }
    })
  })

  // 2. Process blocks without lanes
  props.blocks.forEach(block => {
    const lane = findLaneForBlock(block.id)
    if (!lane) {
      block.groupIds.forEach(groupId => {
        const group = props.beatGroups.find(g => g.id === groupId)
        if (group) {
          group.beatIds.forEach(beatId => {
            const beat = props.beats.find(b => b.id === beatId)
            if (beat) {
              addBeat(beat, undefined, block.name, group.name)
            }
          })
        }
      })
    }
  })

  // 3. Process groups without blocks
  props.beatGroups.forEach(group => {
    const block = findBlockForGroup(group.id)
    if (!block) {
      group.beatIds.forEach(beatId => {
        const beat = props.beats.find(b => b.id === beatId)
        if (beat) {
          addBeat(beat, undefined, undefined, group.name)
        }
      })
    }
  })

  // 4. Process orphan beats (not in any group)
  props.beats.forEach(beat => {
    const group = findGroupForBeat(beat.id)
    if (!group) {
      addBeat(beat)
    }
  })

  return result
})

function getBeatType(typeId: string): BeatType | undefined {
  return props.beatTypes.find(t => t.id === typeId)
}

function handleCellClick(beat: Beat, field: string) {
  emit('cell-click', beat, field)
}
</script>

<style scoped>
/* Excel-like grid styling */
.excel-grid {
  border: 1px solid #ddd;
  background-color: #fff;
}

/* Cell styling with borders on all sides */
.grid-cell {
  cursor: pointer;
  padding: 8px 12px;
  transition: background-color 0.15s;
  min-height: 40px;
  display: flex;
  align-items: center;
}

.grid-cell:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

/* Add borders to all cells */
:deep(.v-data-table) {
  border-collapse: separate;
  border-spacing: 0;
}

:deep(.v-data-table th) {
  border: 1px solid #ddd !important;
  border-top: none !important;
  background-color: #f5f5f5 !important;
  font-weight: 600 !important;
  padding: 12px !important;
}

:deep(.v-data-table td) {
  border: 1px solid #ddd !important;
  padding: 0 !important;
  vertical-align: middle;
}

/* Remove double borders */
:deep(.v-data-table th:not(:first-child)) {
  border-left: none !important;
}

:deep(.v-data-table td:not(:first-child)) {
  border-left: none !important;
}

:deep(.v-data-table tr:not(:last-child) td) {
  border-bottom: none !important;
}

/* Header row styling */
:deep(.v-data-table thead tr) {
  background-color: #f5f5f5;
}

/* Body row styling - zebra striping like Excel */
:deep(.v-data-table tbody tr:nth-child(even)) {
  background-color: #fafafa;
}

:deep(.v-data-table tbody tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.04) !important;
}

/* Remove default Vuetify row cursor */
:deep(tbody tr) {
  cursor: default;
}

/* Scrollbar styling for fixed header */
:deep(.v-table__wrapper) {
  overflow-y: auto;
}

:deep(.v-table__wrapper::-webkit-scrollbar) {
  width: 12px;
}

:deep(.v-table__wrapper::-webkit-scrollbar-track) {
  background: #f1f1f1;
}

:deep(.v-table__wrapper::-webkit-scrollbar-thumb) {
  background: #888;
  border-radius: 6px;
}

:deep(.v-table__wrapper::-webkit-scrollbar-thumb:hover) {
  background: #555;
}
</style>
