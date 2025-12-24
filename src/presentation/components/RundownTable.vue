<template>
  <div class="rundown-table-wrapper" @mouseleave="clearHoverState">
    <v-data-table
      :headers="headers"
      :items="hierarchicalBeats"
      :items-per-page="-1"
      class="excel-grid elevation-1"
      density="comfortable"
      fixed-header
      height="calc(100vh - 128px)"
      hide-default-footer
      :row-props="getRowProps"
    >
      <!-- Lane column -->
      <template #[`item.lane`]="{ item }">
        <div class="grid-cell" @mouseenter="setDropTarget('lane', item.lane)">
          <v-chip
            v-if="item.lane"
            :color="item.lane.color || '#9E9E9E'"
            :text-color="getContrastColor(item.lane.color || '#9E9E9E')"
            variant="flat"
            size="small"
            class="font-weight-medium clickable-chip"
            @click.stop="handleLaneClick(item.lane)"
          >
            {{ item.lane.name }}
          </v-chip>
          <span v-else>—</span>
        </div>
      </template>

      <!-- Block column -->
      <template #[`item.block`]="{ item }">
        <div class="grid-cell" @mouseenter="setDropTarget('block', item.block)">
          <v-chip
            v-if="item.block"
            :color="item.block.color || '#757575'"
            :text-color="getContrastColor(item.block.color || '#757575')"
            variant="flat"
            size="small"
            class="font-weight-medium clickable-chip"
            @click.stop="handleBlockClick(item.block)"
          >
            {{ item.block.name }}
          </v-chip>
          <span v-else>—</span>
        </div>
      </template>

      <!-- Group column -->
      <template #[`item.group`]="{ item }">
        <div class="grid-cell">
          <v-chip
            v-if="item.group"
            :color="item.group.color || '#BDBDBD'"
            :text-color="getContrastColor(item.group.color || '#BDBDBD')"
            variant="flat"
            size="small"
            :class="[
              'font-weight-medium',
              'clickable-chip',
              { 'chip-hovered': hoveredGroupId === item.group.id }
            ]"
            @click.stop="handleGroupClick(item.group)"
            @mouseenter="handleGroupMouseEnter(item.group)"
            @mouseleave="hoveredGroupId = null"
          >
            {{ item.group.name }}
          </v-chip>
          <span v-else @mouseenter="setDropTarget(null, null)">—</span>
        </div>
      </template>

      <!-- Drag handle column -->
      <template #[`item.drag`]="{ item }">
        <div
          class="drag-handle-cell"
          @mousedown="handleDragStart($event, item)"
          @touchstart="handleDragStart($event, item)"
          @mouseenter="handleBeatCellMouseEnter(item)"
        >
          <v-icon class="drag-handle-icon" size="small"> mdi-drag-vertical </v-icon>
        </div>
      </template>

      <!-- Beat type with icon and color -->
      <template #[`item.typeId`]="{ item }">
        <div
          class="grid-cell"
          @click.stop="handleCellClick(item, 'typeId')"
          @mouseenter="handleBeatCellMouseEnter(item)"
        >
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
          @mouseenter="handleBeatCellMouseEnter(item)"
        >
          {{ item.title }}
        </div>
      </template>

      <!-- Duration column -->
      <template #[`item.eventDuration`]="{ item }">
        <div
          class="grid-cell"
          @click.stop="handleCellClick(item, 'eventDuration')"
          @mouseenter="handleBeatCellMouseEnter(item)"
        >
          {{ item.eventDuration || '—' }}
        </div>
      </template>

      <!-- Start Time column -->
      <template #[`item.eventStartTime`]="{ item }">
        <div
          class="grid-cell"
          @click.stop="handleCellClick(item, 'eventStartTime')"
          @mouseenter="handleBeatCellMouseEnter(item)"
        >
          {{ item.eventStartTime || '—' }}
        </div>
      </template>

      <!-- Scene column -->
      <template #[`item.scene`]="{ item }">
        <div
          class="grid-cell"
          @click.stop="handleCellClick(item, 'scene')"
          @mouseenter="handleBeatCellMouseEnter(item)"
        >
          {{ item.scene || '—' }}
        </div>
      </template>

      <!-- Character column -->
      <template #[`item.character`]="{ item }">
        <div
          class="grid-cell"
          @click.stop="handleCellClick(item, 'character')"
          @mouseenter="handleBeatCellMouseEnter(item)"
        >
          {{ item.character || '—' }}
        </div>
      </template>

      <!-- Cue column -->
      <template #[`item.cue`]="{ item }">
        <div
          class="grid-cell"
          @click.stop="handleCellClick(item, 'cue')"
          @mouseenter="handleBeatCellMouseEnter(item)"
        >
          {{ Array.isArray(item.cue) ? item.cue.join(', ') : item.cue || '—' }}
        </div>
      </template>

      <!-- Script/Description column -->
      <template #[`item.description`]="{ item }">
        <div
          class="text-truncate grid-cell"
          style="max-width: 300px"
          @click.stop="handleCellClick(item, 'description')"
          @mouseenter="handleBeatCellMouseEnter(item)"
        >
          {{ item.description || '—' }}
        </div>
      </template>

      <!-- Assets column -->
      <template #[`item.assets`]="{ item }">
        <div
          class="grid-cell"
          @click.stop="handleCellClick(item, 'assets')"
          @mouseenter="handleBeatCellMouseEnter(item)"
        >
          {{ item.assets?.join(', ') || '—' }}
        </div>
      </template>
    </v-data-table>

    <!-- Drag ghost indicator -->
    <div
      v-if="isDragging && draggedBeat"
      class="drag-ghost"
      :style="{
        top: `${dragGhostY}px`,
        left: `${dragGhostX}px`
      }"
    >
      <div class="drag-ghost-content">
        <v-icon size="small" class="mr-2">mdi-drag-vertical</v-icon>
        <span class="font-weight-medium">{{ draggedBeat.title }}</span>
        <v-chip :color="getBeatType(draggedBeat.typeId)?.color" size="x-small" class="ml-2">
          {{ t(`beatTypes.${draggedBeat.typeId}`) }}
        </v-chip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
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
  'lane-click': [lane: Lane]
  'block-click': [block: Block]
  'group-click': [group: BeatGroup]
  'drag-start': [beat: BeatWithHierarchy]
  'drag-move': [beat: BeatWithHierarchy, deltaY: number]
  'drag-end': [
    beat: BeatWithHierarchy,
    dropTarget: { type: 'beat' | 'group' | 'lane' | 'block' | null; data: any }
  ]
}>()

interface BeatWithHierarchy extends Beat {
  lane?: Lane
  block?: Block
  group?: BeatGroup
}

// Hover state
const hoveredBeatId = ref<string | null>(null)
const hoveredGroupId = ref<string | null>(null)

// Drag state
const draggedBeat = ref<BeatWithHierarchy | null>(null)
const isDragging = ref(false)
const dragStartY = ref(0)
const dragGhostX = ref(0)
const dragGhostY = ref(0)
const dropTarget = ref<{ type: 'beat' | 'group' | 'lane' | 'block' | null; data: any }>({
  type: null,
  data: null
})

const headers = computed(() => [
  { title: t('beatRundown.lane'), key: 'lane', width: 140, sortable: false },
  { title: t('beatRundown.block'), key: 'block', width: 140, sortable: false },
  { title: t('beatRundown.group'), key: 'group', width: 140, sortable: false },
  { title: '', key: 'drag', width: 50, sortable: false }, // Drag handle column
  { title: t('beatRundown.type'), key: 'typeId', width: 150, sortable: true },
  { title: t('beatRundown.title'), key: 'title', width: 200, sortable: true },
  { title: t('beatRundown.script'), key: 'description', width: 300, sortable: false },
  { title: t('beatRundown.duration'), key: 'eventDuration', width: 120, sortable: false },
  { title: t('beatRundown.startTime'), key: 'eventStartTime', width: 120, sortable: false },
  { title: t('beatRundown.scene'), key: 'scene', width: 150, sortable: false },
  { title: t('beatRundown.character'), key: 'character', width: 120, sortable: false },
  { title: t('beatRundown.cue'), key: 'cue', width: 120, sortable: false },
  { title: t('beatRundown.assets'), key: 'assets', width: 200, sortable: false }
])

// Calculate contrasting text color (white or black) based on background color
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '')

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Calculate relative luminance using W3C formula
  // https://www.w3.org/TR/WCAG20/#relativeluminancedef
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

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

  // Helper to add beat with hierarchy info (now passing objects instead of names)
  function addBeat(beat: Beat, lane?: Lane, block?: Block, group?: BeatGroup) {
    if (!processedBeats.has(beat.id)) {
      result.push({ ...beat, lane, block, group })
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
                addBeat(beat, lane, block, group)
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
              addBeat(beat, undefined, block, group)
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
          addBeat(beat, undefined, undefined, group)
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

function handleLaneClick(lane: Lane) {
  emit('lane-click', lane)
}

function handleBlockClick(block: Block) {
  emit('block-click', block)
}

function handleGroupClick(group: BeatGroup) {
  emit('group-click', group)
}

// Helper function to get row props for highlighting hovered beats
function getRowProps({ item }: { item: BeatWithHierarchy }) {
  return {
    class: item.id === hoveredBeatId.value ? 'row-hovered' : ''
  }
}

// Hover state management
function handleBeatCellMouseEnter(item: BeatWithHierarchy) {
  hoveredBeatId.value = item.id
  if (isDragging.value) {
    setDropTarget('beat', item)
  }
}

function handleGroupMouseEnter(group: BeatGroup) {
  hoveredGroupId.value = group.id
  if (isDragging.value) {
    setDropTarget('group', group)
  }
}

function setDropTarget(type: 'beat' | 'group' | 'lane' | 'block' | null, data: any) {
  if (!isDragging.value) return
  dropTarget.value = { type, data }
}

function clearHoverState() {
  hoveredBeatId.value = null
}

// Drag and drop functionality
function handleDragStart(event: MouseEvent | TouchEvent, beat: BeatWithHierarchy) {
  event.preventDefault()
  event.stopPropagation()

  draggedBeat.value = beat
  isDragging.value = true

  // Get position from mouse or touch event
  if (event instanceof MouseEvent) {
    dragStartY.value = event.clientY
    dragGhostX.value = event.clientX + 10
    dragGhostY.value = event.clientY + 10
  } else if (event instanceof TouchEvent && event.touches.length > 0) {
    dragStartY.value = event.touches[0].clientY
    dragGhostX.value = event.touches[0].clientX + 10
    dragGhostY.value = event.touches[0].clientY + 10
  }

  emit('drag-start', beat)

  // Add global listeners
  if (event instanceof MouseEvent) {
    window.addEventListener('mousemove', handleDragMove)
    window.addEventListener('mouseup', handleDragEnd)
  } else {
    window.addEventListener('touchmove', handleDragMove)
    window.addEventListener('touchend', handleDragEnd)
  }
}

function handleDragMove(event: MouseEvent | TouchEvent) {
  if (!isDragging.value || !draggedBeat.value) return

  let currentY = 0
  let currentX = 0

  if (event instanceof MouseEvent) {
    currentY = event.clientY
    currentX = event.clientX
  } else if (event instanceof TouchEvent && event.touches.length > 0) {
    currentY = event.touches[0].clientY
    currentX = event.touches[0].clientX
  }

  // Update ghost position
  dragGhostX.value = currentX + 10
  dragGhostY.value = currentY + 10

  const deltaY = currentY - dragStartY.value
  emit('drag-move', draggedBeat.value, deltaY)
}

function handleDragEnd() {
  if (!draggedBeat.value) return

  emit('drag-end', draggedBeat.value, dropTarget.value)

  // Cleanup
  window.removeEventListener('mousemove', handleDragMove)
  window.removeEventListener('mouseup', handleDragEnd)
  window.removeEventListener('touchmove', handleDragMove)
  window.removeEventListener('touchend', handleDragEnd)

  draggedBeat.value = null
  isDragging.value = false
  dropTarget.value = { type: null, data: null }
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

/* Clickable chips cursor */
.clickable-chip {
  cursor: pointer;
  transition: all 0.2s;
}

.clickable-chip:hover {
  opacity: 0.85;
}

/* Group chip hover effect */
.chip-hovered {
  filter: brightness(1.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
}

/* Drag handle styling */
.drag-handle-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  cursor: grab;
  min-height: 40px;
  transition: background-color 0.15s;
}

.drag-handle-cell:active {
  cursor: grabbing;
}

.drag-handle-icon {
  opacity: 0.4;
  transition: opacity 0.2s;
}

.drag-handle-cell:hover .drag-handle-icon {
  opacity: 1;
}

/* Row hover highlighting */
.rundown-table-wrapper {
  position: relative;
}

:deep(
  tr.row-hovered td:not(:nth-child(1)):not(:nth-child(2)):not(:nth-child(3)):not(:nth-child(4))
) {
  background-color: rgba(var(--v-theme-primary), 0.12) !important;
}

/* Drag ghost indicator */
.drag-ghost {
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.85;
  transform: translate(-50%, -50%);
}

.drag-ghost-content {
  background: white;
  border: 2px solid rgb(var(--v-theme-primary));
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  white-space: nowrap;
  min-width: 250px;
}
</style>
