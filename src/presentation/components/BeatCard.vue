<template>
  <div class="beat-card-wrapper" 
    :data-beat-id="beat.id"
    :style="{
    left: `${beat.position.x}px`,
    top: `${beat.position.y}px`
  }">
    <!-- Conexión visual superior (si hay prevBeat) -->
    <div v-if="beat.prevBeatId" class="connection-gap connection-top"></div>
    
    <!-- Beat Card -->
    <v-card
      data-testid="beat-card"
      class="beat-card"
      :class="{ 
        'is-dragging': isDragging,
        'magnet-top-active': magnetZone === 'top',
        'magnet-bottom-active': magnetZone === 'bottom'
      }"
      :style="{
        backgroundColor: beatType?.color || '#9E9E9E'
      }"
      elevation="4"
      @click="handleClick"
      @mousedown="handleMouseDown"
      @touchstart="handleTouchStart"
    >
      <!-- Zona de imán superior -->
      <div class="magnet-zone magnet-zone-top"></div>
      
      <v-card-text class="pa-3">
        <div class="d-flex align-center mb-2">
          <v-icon :color="getContrastColor(beatType?.color)" size="small" class="mr-2">
            {{ beatType?.icon || 'mdi-file' }}
          </v-icon>
          <span class="text-caption" :style="{ color: getContrastColor(beatType?.color) }">
            {{ beatType?.name || 'Unknown' }}
          </span>
          
          <!-- Disconnect button (only for connected beats) -->
          <v-btn
            v-if="beat.prevBeatId || beat.nextBeatId"
            icon
            size="x-small"
            class="ml-auto disconnect-btn"
            :color="getContrastColor(beatType?.color)"
            @click.stop="handleDisconnect"
            aria-label="Disconnect beat"
          >
            <v-icon size="small">mdi-link-variant-off</v-icon>
            <v-tooltip activator="parent" location="top">Desconectar</v-tooltip>
          </v-btn>
        </div>
        <div class="beat-title" :style="{ color: getContrastColor(beatType?.color) }">
          {{ beat.title }}
        </div>
      </v-card-text>
      
      <!-- Zona de imán inferior -->
      <div class="magnet-zone magnet-zone-bottom"></div>
    </v-card>
    
    <!-- Conexión visual inferior (si hay nextBeat) -->
    <div v-if="beat.nextBeatId" class="connection-gap connection-bottom"></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Beat, BeatType } from '@/domain/entities'

const props = defineProps<{
  beat: Beat
  beatType: BeatType | undefined
  magnetZone?: 'top' | 'bottom' | null // Zona de imán activa
}>()

const emit = defineEmits<{
  click: []
  dragstart: [beatId: string, isShiftKey: boolean]
  dragmove: [beatId: string, deltaX: number, deltaY: number]
  dragend: [beatId: string]
  disconnect: [beatId: string]
}>()

const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const hasMoved = ref(false)
const touchIdentifier = ref<number | null>(null)

function handleMouseDown(event: MouseEvent) {
  // Prevent triggering click on canvas pan
  event.stopPropagation()
  
  // Prevent drag if clicking on disconnect button
  if ((event.target as HTMLElement).closest('.disconnect-btn')) {
    return
  }
  
  isDragging.value = true
  hasMoved.value = false
  dragStart.value = { x: event.clientX, y: event.clientY }
  
  emit('dragstart', props.beat.id, event.shiftKey)
  
  // Add global listeners for drag
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function handleDisconnect() {
  emit('disconnect', props.beat.id)
}

function handleMouseMove(event: MouseEvent) {
  if (!isDragging.value) return
  
  const deltaX = event.clientX - dragStart.value.x
  const deltaY = event.clientY - dragStart.value.y
  
  // Mark as moved if dragged more than 5px (to distinguish from click)
  if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
    hasMoved.value = true
  }
  
  emit('dragmove', props.beat.id, deltaX, deltaY)
}

function handleMouseUp() {
  if (isDragging.value) {
    isDragging.value = false
    emit('dragend', props.beat.id)
    
    // Remove global listeners
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
}

// Touch event handlers for mobile support
function handleTouchStart(event: TouchEvent) {
  // Prevent triggering click on canvas pan
  event.stopPropagation()
  
  // Prevent drag if touching disconnect button
  if ((event.target as HTMLElement).closest('.disconnect-btn')) {
    return
  }
  
  const touch = event.touches[0]
  if (!touch) return
  
  touchIdentifier.value = touch.identifier
  isDragging.value = true
  hasMoved.value = false
  dragStart.value = { x: touch.clientX, y: touch.clientY }
  
  // Check if shift key equivalent (could use long press in future)
  emit('dragstart', props.beat.id, false)
  
  // Add global listeners for touch drag
  document.addEventListener('touchmove', handleTouchMove, { passive: false })
  document.addEventListener('touchend', handleTouchEnd)
  document.addEventListener('touchcancel', handleTouchEnd)
}

function handleTouchMove(event: TouchEvent) {
  if (!isDragging.value || touchIdentifier.value === null) return
  
  // Prevent default to avoid scrolling
  event.preventDefault()
  
  // Find the touch that matches our identifier
  const touch = Array.from(event.touches).find(t => t.identifier === touchIdentifier.value)
  if (!touch) return
  
  const deltaX = touch.clientX - dragStart.value.x
  const deltaY = touch.clientY - dragStart.value.y
  
  // Mark as moved if dragged more than 5px (to distinguish from tap)
  if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
    hasMoved.value = true
  }
  
  emit('dragmove', props.beat.id, deltaX, deltaY)
}

function handleTouchEnd(event: TouchEvent) {
  if (!isDragging.value || touchIdentifier.value === null) return
  
  // Check if our touch ended
  const touchEnded = !Array.from(event.touches).some(t => t.identifier === touchIdentifier.value)
  
  if (touchEnded) {
    isDragging.value = false
    touchIdentifier.value = null
    emit('dragend', props.beat.id)
    
    // Remove global listeners
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
    document.removeEventListener('touchcancel', handleTouchEnd)
  }
}

function handleClick() {
  // Only emit click if we didn't drag
  if (!hasMoved.value) {
    emit('click')
  }
  hasMoved.value = false
}

/**
 * Calculate contrast color (white or black) based on background color
 */
function getContrastColor(hexColor: string | undefined): string {
  if (!hexColor) return '#000000'

  const color = hexColor.replace('#', '')
  const r = parseInt(color.substr(0, 2), 16)
  const g = parseInt(color.substr(2, 2), 16)
  const b = parseInt(color.substr(4, 2), 16)

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}
</script>

<style scoped>
.beat-card-wrapper {
  position: absolute;
  width: 400px;
}

.beat-card {
  position: relative;
  width: 400px;
  cursor: grab;
  transition: transform 0.2s, box-shadow 0.2s;
  user-select: none;
}

.beat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2) !important;
}

.beat-card.is-dragging {
  cursor: grabbing;
  transform: scale(1.05);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3) !important;
  transition: none;
  z-index: 1000;
}

/* Zonas de imán */
.magnet-zone {
  position: absolute;
  left: 0;
  right: 0;
  height: 40px; /* Mitad de la altura del beat (80px / 2) */
  pointer-events: none;
  transition: background-color 0.2s, border 0.2s;
}

.magnet-zone-top {
  top: 0;
  border-top: 2px solid transparent;
}

.magnet-zone-bottom {
  bottom: 0;
  border-bottom: 2px solid transparent;
}

/* Zona de imán activa (cuando otro beat pasa por encima) */
.beat-card.magnet-top-active .magnet-zone-top {
  background-color: rgba(76, 175, 80, 0.15);
}

.beat-card.magnet-bottom-active .magnet-zone-bottom {
  background-color: rgba(33, 150, 243, 0.15);
}

/* Sombra degradada bajo el beat cuando zona de imán activa */
.beat-card.magnet-top-active {
  box-shadow: 
    0 -30px 40px -10px rgba(76, 175, 80, 0.6),
    0 -20px 30px -8px rgba(76, 175, 80, 0.4),
    0 -10px 20px -5px rgba(76, 175, 80, 0.2),
    0 8px 16px rgba(0, 0, 0, 0.2) !important;
}

.beat-card.magnet-bottom-active {
  box-shadow: 
    0 30px 40px -10px rgba(33, 150, 243, 0.6),
    0 20px 30px -8px rgba(33, 150, 243, 0.4),
    0 10px 20px -5px rgba(33, 150, 243, 0.2),
    0 -8px 16px rgba(0, 0, 0, 0.2) !important;
}

/* Conexión visual (espacio sombreado entre beats conectados) */
.connection-gap {
  width: 100%;
  height: 10px;
  background: repeating-linear-gradient(
    45deg,
    rgba(0, 0, 0, 0.1),
    rgba(0, 0, 0, 0.1) 5px,
    rgba(0, 0, 0, 0.05) 5px,
    rgba(0, 0, 0, 0.05) 10px
  );
  border-left: 2px dashed rgba(0, 0, 0, 0.2);
  border-right: 2px dashed rgba(0, 0, 0, 0.2);
}

.connection-top {
  position: absolute;
  top: -10px;
  left: 0;
}

.connection-bottom {
  position: absolute;
  bottom: -10px;
  left: 0;
}

.beat-title {
  font-weight: 500;
  font-size: 0.9rem;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* Disconnect button */
.disconnect-btn {
  opacity: 0.7;
  transition: opacity 0.2s, transform 0.2s;
}

.disconnect-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

/* On mobile/tablet, always show disconnect button */
@media (hover: none) {
  .disconnect-btn {
    opacity: 0.9;
  }
}
</style>
