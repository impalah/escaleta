import { ref, type Ref } from 'vue'

/**
 * Composable for handling drag operations on elements
 * Provides unified drag behavior for Beat, BeatGroup, and Block components
 */
export interface DragOptions {
  elementId: string
  zoom?: Ref<number> | number
  onClick?: (elementId: string) => void // Called on click without drag
  onDragStart?: (elementId: string) => void
  onDragMove?: (elementId: string, deltaX: number, deltaY: number) => void
  onDragEnd?: (elementId: string) => void
  dragThreshold?: number // Pixels to move before considering it a drag
}

export function useDraggable(options: DragOptions) {
  const isDragging = ref(false)
  const hasMoved = ref(false)
  const dragStartPos = ref({ x: 0, y: 0 })
  const touchIdentifier = ref<number | null>(null)
  const dragStartCalled = ref(false) // Track if onDragStart has been called
  
  const DRAG_THRESHOLD = options.dragThreshold ?? 3

  // Mouse handlers
  function handleMouseDown(event: MouseEvent) {
    // Only handle left mouse button
    if (event.button !== 0) return
    
    // Don't handle if clicking on delete button
    if ((event.target as HTMLElement).closest('.delete-btn')) {
      return
    }
    
    event.stopPropagation()
    event.preventDefault()
    
    isDragging.value = true
    hasMoved.value = false
    dragStartCalled.value = false // Reset flag
    dragStartPos.value = { x: event.clientX, y: event.clientY }
    
    // DON'T call onDragStart here - wait for movement
    
    // Add global mouse listeners
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isDragging.value) return
    
    const deltaX = event.clientX - dragStartPos.value.x
    const deltaY = event.clientY - dragStartPos.value.y
    
    // Check if moved beyond threshold
    if (!hasMoved.value && (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD)) {
      hasMoved.value = true
      dragStartCalled.value = true
      // Now we call onDragStart for the first time
      options.onDragStart?.(options.elementId)
    }
    
    if (hasMoved.value) {
      options.onDragMove?.(options.elementId, deltaX, deltaY)
    }
    
    // Update drag start position for next delta calculation
    dragStartPos.value = { x: event.clientX, y: event.clientY }
  }

  function handleMouseUp() {
    if (!isDragging.value) return
    
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
    
    const wasDragging = hasMoved.value
    
    isDragging.value = false
    hasMoved.value = false
    dragStartCalled.value = false
    
    if (wasDragging) {
      options.onDragEnd?.(options.elementId)
    } else {
      // Was a click, not a drag
      options.onClick?.(options.elementId)
    }
    
    return wasDragging
  }

  // Touch handlers
  function handleTouchStart(event: TouchEvent) {
    if (event.touches.length !== 1) return
    
    // Don't handle if touching delete button
    if ((event.target as HTMLElement).closest('.delete-btn')) {
      return
    }
    
    event.stopPropagation()
    
    const touch = event.touches[0]
    touchIdentifier.value = touch.identifier
    
    isDragging.value = true
    hasMoved.value = false
    dragStartCalled.value = false // Reset flag
    dragStartPos.value = { x: touch.clientX, y: touch.clientY }
    
    // DON'T call onDragStart here - wait for movement
    
    // Add global touch listeners
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('touchcancel', handleTouchEnd)
  }

  function handleTouchMove(event: TouchEvent) {
    if (!isDragging.value || touchIdentifier.value === null) return
    
    const touch = Array.from(event.touches).find(t => t.identifier === touchIdentifier.value)
    if (!touch) return
    
    event.preventDefault()
    
    const deltaX = touch.clientX - dragStartPos.value.x
    const deltaY = touch.clientY - dragStartPos.value.y
    
    // Check if moved beyond threshold
    if (!hasMoved.value && (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD)) {
      hasMoved.value = true
      dragStartCalled.value = true
      // Now we call onDragStart for the first time
      options.onDragStart?.(options.elementId)
    }
    
    if (hasMoved.value) {
      options.onDragMove?.(options.elementId, deltaX, deltaY)
    }
    
    // Update drag start position for next delta calculation
    dragStartPos.value = { x: touch.clientX, y: touch.clientY }
  }

  function handleTouchEnd() {
    if (!isDragging.value) return
    
    window.removeEventListener('touchmove', handleTouchMove)
    window.removeEventListener('touchend', handleTouchEnd)
    window.removeEventListener('touchcancel', handleTouchEnd)
    
    const wasDragging = hasMoved.value
    
    isDragging.value = false
    touchIdentifier.value = null
    hasMoved.value = false
    dragStartCalled.value = false
    
    if (wasDragging) {
      options.onDragEnd?.(options.elementId)
    } else {
      // Was a tap, not a drag
      options.onClick?.(options.elementId)
    }
    
    return wasDragging
  }

  // Cleanup function
  function cleanup() {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
    window.removeEventListener('touchmove', handleTouchMove)
    window.removeEventListener('touchend', handleTouchEnd)
    window.removeEventListener('touchcancel', handleTouchEnd)
  }

  return {
    isDragging,
    hasMoved,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    cleanup
  }
}
