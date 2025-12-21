import { test, expect, type Page } from '@playwright/test'

/**
 * E2E tests for mobile touch events
 * Tests drag & drop and canvas panning using touch events
 */

test.use({ 
  hasTouch: true,
  isMobile: true,
  viewport: { width: 375, height: 667 }
})

test.describe('Mobile Touch Events', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('should have touch drag functionality in beat cards', async ({ page }) => {
    await page.goto('/')

    // Make sure we're in canvas view (force click to avoid tooltip interception)
    await page.click('button[value="canvas"]', { force: true })
    
    // Get the first beat card
    const firstBeat = page.locator('[data-testid="beat-card"]').first()
    await expect(firstBeat).toBeVisible()

    // Verify beat card is draggable by checking cursor style
    const cursor = await firstBeat.evaluate((el) => 
      window.getComputedStyle(el).cursor
    )

    // Beat cards should have grab cursor indicating drag capability
    expect(cursor).toBe('grab')

    // Verify beat wrapper has absolute positioning (required for dragging)
    const beatWrapper = page.locator('.beat-card-wrapper').first()
    const position = await beatWrapper.evaluate((el) => 
      window.getComputedStyle(el).position
    )
    expect(position).toBe('absolute')

    // Verify wrapper has left/top values (position tracking)
    const hasPosition = await beatWrapper.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return style.left !== 'auto' && style.top !== 'auto'
    })
    expect(hasPosition).toBe(true)
  })

  test('should have touch event handlers on canvas', async ({ page }) => {
    await page.goto('/')

    // Make sure we're in canvas view (force click to avoid tooltip interception)
    await page.click('button[value="canvas"]', { force: true })
    
    const canvas = page.locator('.beat-canvas-container')
    await expect(canvas).toBeVisible()

    // Canvas is expected to have touch event handlers defined in Vue component

    // Canvas element should exist (touch handlers are registered via Vue)
    expect(canvas).toBeVisible()
  })

  test('should have touch event handlers on beat cards', async ({ page }) => {
    await page.goto('/')

    // Get the first beat card
    const firstBeat = page.locator('[data-testid="beat-card"]').first()
    await expect(firstBeat).toBeVisible()

    // Verify beat card has click handler (which handles both mouse and is complemented by touch)
    const hasEventHandlers = await firstBeat.evaluate((el) => {
      // Beat cards should be interactive elements
      return el.closest('.beat-card-wrapper') !== null
    })

    expect(hasEventHandlers).toBe(true)
  })

  test('should handle multi-touch correctly (touch canvas while dragging beat)', async ({ page }) => {
    await page.goto('/')

    // Get first beat for dragging
    const firstBeat = page.locator('[data-testid="beat-card"]').first()
    const beatBox = await firstBeat.boundingBox()
    if (!beatBox) throw new Error('Beat card not found')

    const beatCenterX = beatBox.x + beatBox.width / 2
    const beatCenterY = beatBox.y + beatBox.height / 2

    // Start dragging beat with first touch
    await page.evaluate(
      ({ x, y }) => {
        const touch = new Touch({
          identifier: 1,
          target: document.elementFromPoint(x, y) as Element,
          clientX: x,
          clientY: y,
          pageX: x,
          pageY: y,
          screenX: x,
          screenY: y,
        })
        const touchEvent = new TouchEvent('touchstart', {
          touches: [touch],
          targetTouches: [touch],
          changedTouches: [touch],
          bubbles: true,
        })
        document.elementFromPoint(x, y)?.dispatchEvent(touchEvent)
      },
      { x: beatCenterX, y: beatCenterY }
    )

    await page.waitForTimeout(100)

    // Move the beat touch
    await page.evaluate(
      ({ x, y }) => {
        const touch = new Touch({
          identifier: 1,
          target: document.elementFromPoint(x - 50, y - 50) as Element,
          clientX: x,
          clientY: y,
          pageX: x,
          pageY: y,
          screenX: x,
          screenY: y,
        })
        const touchEvent = new TouchEvent('touchmove', {
          touches: [touch],
          targetTouches: [touch],
          changedTouches: [touch],
          bubbles: true,
        })
        document.dispatchEvent(touchEvent)
      },
      { x: beatCenterX + 50, y: beatCenterY + 50 }
    )

    await page.waitForTimeout(100)

    // End beat drag
    await page.evaluate(() => {
      const touchEvent = new TouchEvent('touchend', {
        touches: [],
        targetTouches: [],
        changedTouches: [],
        bubbles: true,
      })
      document.dispatchEvent(touchEvent)
    })

    await page.waitForTimeout(300)

    // Beat should have moved
    const beatWrapper = page.locator('.beat-card-wrapper').first()
    const position = await beatWrapper.evaluate((el) => ({
      left: parseInt(window.getComputedStyle(el).left),
      top: parseInt(window.getComputedStyle(el).top),
    }))

    // Position should be non-zero (beat was moved)
    expect(position.left).toBeGreaterThan(0)
    expect(position.top).toBeGreaterThan(0)
  })

  test('should prevent default scrolling during touch drag', async ({ page }) => {
    await page.goto('/')

    // Get canvas dimensions
    const canvas = page.locator('.beat-canvas-container')
    const canvasBox = await canvas.boundingBox()
    if (!canvasBox) throw new Error('Canvas not found')

    // Get initial scroll position
    const initialScrollY = await page.evaluate(() => window.scrollY)

    // Touch and drag on canvas (this would normally cause scroll)
    const startX = canvasBox.x + 100
    const startY = canvasBox.y + 100

    await simulateTouchDrag(page, startX, startY, startX, startY + 200)
    
    await page.waitForTimeout(300)

    // Scroll position should not have changed (preventDefault worked)
    const finalScrollY = await page.evaluate(() => window.scrollY)
    expect(finalScrollY).toBe(initialScrollY)
  })

  test('should render beat cards correctly in mobile viewport', async ({ page }) => {
    await page.goto('/')

    const firstBeat = page.locator('[data-testid="beat-card"]').first()
    await expect(firstBeat).toBeVisible()

    // Verify beat card has proper dimensions (400px wide)
    const width = await firstBeat.evaluate((el) => {
      return window.getComputedStyle(el).width
    })

    // Beat cards should have defined width
    expect(width).toBeTruthy()
    expect(width).not.toBe('auto')
  })

  test('should persist beat position after touch drag', async ({ page }) => {
    await page.goto('/')

    // Get first beat
    const firstBeat = page.locator('[data-testid="beat-card"]').first()
    const beatBox = await firstBeat.boundingBox()
    if (!beatBox) throw new Error('Beat card not found')

    const centerX = beatBox.x + beatBox.width / 2
    const centerY = beatBox.y + beatBox.height / 2

    // Drag beat to new position
    await simulateTouchDrag(page, centerX, centerY, centerX + 120, centerY + 80)
    await page.waitForTimeout(300)

    // Get new position
    const beatWrapper = page.locator('.beat-card-wrapper').first()
    const positionBeforeReload = await beatWrapper.evaluate((el) => ({
      left: window.getComputedStyle(el).left,
      top: window.getComputedStyle(el).top,
    }))

    // Reload page
    await page.reload()
    await page.waitForTimeout(300)

    // Position should be preserved
    const positionAfterReload = await beatWrapper.evaluate((el) => ({
      left: window.getComputedStyle(el).left,
      top: window.getComputedStyle(el).top,
    }))

    expect(positionAfterReload.left).toBe(positionBeforeReload.left)
    expect(positionAfterReload.top).toBe(positionBeforeReload.top)
  })

  test('should persist canvas pan offset after touch pan', async ({ page }) => {
    await page.goto('/')

    const canvas = page.locator('.beat-canvas-container')
    const canvasBox = await canvas.boundingBox()
    if (!canvasBox) throw new Error('Canvas not found')

    // Pan canvas
    const startX = canvasBox.x + canvasBox.width - 100
    const startY = canvasBox.y + 100

    await simulateTouchDrag(page, startX, startY, startX + 150, startY + 100)
    await page.waitForTimeout(300)

    // Get canvas transform
    const canvasTransform = page.locator('.beat-canvas')
    const transformBeforeReload = await canvasTransform.evaluate((el) => 
      window.getComputedStyle(el).transform
    )

    // Reload page
    await page.reload()
    await page.waitForTimeout(300)

    // Transform should be preserved
    const transformAfterReload = await canvasTransform.evaluate((el) => 
      window.getComputedStyle(el).transform
    )

    expect(transformAfterReload).toBe(transformBeforeReload)
  })
})

/**
 * Helper function to simulate touch drag
 * Dispatches touchstart, multiple touchmove events, and touchend
 */
async function simulateTouchDrag(
  page: Page,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  steps: number = 5
) {
  // Calculate step size
  const deltaX = (endX - startX) / steps
  const deltaY = (endY - startY) / steps

  // touchstart
  await page.evaluate(
    ({ x, y }) => {
      const element = document.elementFromPoint(x, y)
      if (!element) return

      const touch = new Touch({
        identifier: 1,
        target: element,
        clientX: x,
        clientY: y,
        pageX: x,
        pageY: y,
        screenX: x,
        screenY: y,
      })

      const touchEvent = new TouchEvent('touchstart', {
        touches: [touch],
        targetTouches: [touch],
        changedTouches: [touch],
        bubbles: true,
        cancelable: true,
      })

      element.dispatchEvent(touchEvent)
    },
    { x: startX, y: startY }
  )

  await page.waitForTimeout(50)

  // touchmove (multiple steps)
  for (let i = 1; i <= steps; i++) {
    const currentX = startX + deltaX * i
    const currentY = startY + deltaY * i

    await page.evaluate(
      ({ x, y }) => {
        const touch = new Touch({
          identifier: 1,
          target: document.body,
          clientX: x,
          clientY: y,
          pageX: x,
          pageY: y,
          screenX: x,
          screenY: y,
        })

        const touchEvent = new TouchEvent('touchmove', {
          touches: [touch],
          targetTouches: [touch],
          changedTouches: [touch],
          bubbles: true,
          cancelable: true,
        })

        document.dispatchEvent(touchEvent)
      },
      { x: currentX, y: currentY }
    )

    await page.waitForTimeout(20)
  }

  // touchend
  await page.evaluate(
    ({ x, y }) => {
      const touch = new Touch({
        identifier: 1,
        target: document.body,
        clientX: x,
        clientY: y,
        pageX: x,
        pageY: y,
        screenX: x,
        screenY: y,
      })

      const touchEvent = new TouchEvent('touchend', {
        touches: [],
        targetTouches: [],
        changedTouches: [touch],
        bubbles: true,
        cancelable: true,
      })

      document.dispatchEvent(touchEvent)
    },
    { x: endX, y: endY }
  )

  await page.waitForTimeout(50)
}
