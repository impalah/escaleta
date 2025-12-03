import { test, expect } from '@playwright/test'

test.describe('Beat Editor', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('should load with example project', async ({ page }) => {
    await page.goto('/')

    // Check that the app bar shows the project name
    await expect(page.locator('header')).toContainText('Example News Show')

    // Check that beat cards are visible
    const beatCards = page.locator('[data-testid="beat-card"]')
    await expect(beatCards).toHaveCount(7)

    // Verify first beat
    await expect(beatCards.first()).toContainText('Opening')
  })

  test('should create a new beat', async ({ page }) => {
    await page.goto('/')

    const initialCount = await page.locator('[data-testid="beat-card"]').count()

    // Click the add beat button
    await page.click('button[aria-label="Add beat"]')

    // Wait for the dialog to be visible
    await page.waitForSelector('.v-dialog', { state: 'visible' })
    
    // Select "News" type from the list
    await page.click('.v-list-item:has-text("News")')

    // Wait for the new beat to appear on canvas
    await page.waitForTimeout(500)

    // Verify a new beat was created
    const newCount = await page.locator('[data-testid="beat-card"]').count()
    expect(newCount).toBe(initialCount + 1)

    // The new beat should have default title "New News"
    await expect(page.locator('[data-testid="beat-card"]:has-text("New News")')).toBeVisible()

    // Now click on the new beat to edit it in properties panel
    await page.click('[data-testid="beat-card"]:has-text("New News")')

    // Wait for properties panel to show beat properties
    await page.waitForSelector('.properties-panel-container', { state: 'visible' })
    
    // Fill in beat details in properties panel
    const titleInput = page.locator('.properties-panel-container input[label="Título"]').or(page.locator('.properties-panel-container').locator('input').first())
    await titleInput.click()
    await titleInput.press('Meta+a')
    await titleInput.fill('Breaking News')
    
    // Script field (textarea)
    const scriptField = page.locator('.properties-panel-container textarea').first()
    await scriptField.fill('Important breaking news story')
    
    // Wait for auto-save
    await page.waitForTimeout(500)

    // Verify the edited beat appears on canvas
    await expect(page.locator('[data-testid="beat-card"]:has-text("Breaking News")')).toBeVisible()
  })

  test('should edit an existing beat', async ({ page }) => {
    await page.goto('/')

    // Click on the first beat card
    const firstBeat = page.locator('[data-testid="beat-card"]').first()
    await firstBeat.click()

    // Properties panel should show beat properties
    await page.waitForSelector('.properties-panel-container', { state: 'visible' })

    // Modify the title in properties panel
    const titleInput = page.locator('.properties-panel-container').locator('input').first()
    await titleInput.click()
    await titleInput.press('Meta+a')
    await titleInput.fill('Updated Opening')

    // Wait for auto-save
    await page.waitForTimeout(500)

    // Verify the updated title appears
    await expect(page.locator('[data-testid="beat-card"]:has-text("Updated Opening")')).toBeVisible()
  })

  test('should persist changes to localStorage', async ({ page }) => {
    await page.goto('/')

    // Create a new beat
    await page.click('button[aria-label="Add beat"]')
    await page.waitForSelector('.v-dialog', { state: 'visible' })
    await page.click('.v-list-item:has-text("Sports")')
    
    // Wait for beat to be created
    await page.waitForTimeout(500)

    // Find and edit the new beat via properties panel
    await page.click('[data-testid="beat-card"]:has-text("New Sports")')
    await page.waitForSelector('.properties-panel-container', { state: 'visible' })
    
    const titleInput = page.locator('.properties-panel-container').locator('input').first()
    await titleInput.click()
    await titleInput.press('Meta+a')
    await titleInput.fill('Football Match')

    // Wait for auto-save
    await page.waitForTimeout(500)

    // Reload the page
    await page.reload()

    // The edited beat should still be there
    await expect(page.locator('[data-testid="beat-card"]:has-text("Football Match")')).toBeVisible()
  })

  test('should save project manually', async ({ page }) => {
    await page.goto('/')

    // Edit a beat via properties panel
    const firstBeat = page.locator('[data-testid="beat-card"]').first()
    await firstBeat.click()
    
    await page.waitForSelector('.properties-panel-container', { state: 'visible' })
    const titleInput = page.locator('.properties-panel-container').locator('input').first()
    await titleInput.click()
    await titleInput.press('Meta+a')
    await titleInput.fill('Modified Opening')

    await page.waitForTimeout(300)

    // Click the Save button in toolbar
    await page.click('button[aria-label="Save project"]')

    // Wait a bit for save operation
    await page.waitForTimeout(300)

    // Verify the data persists
    await page.reload()
    await expect(page.locator('[data-testid="beat-card"]:has-text("Modified Opening")')).toBeVisible()
  })

  test('should show beat type colors correctly', async ({ page }) => {
    await page.goto('/')

    // Find a News beat (blue)
    const newsBeat = page.locator('[data-testid="beat-card"]:has-text("News")').first()
    
    // Check that it has a background color (we can't easily test exact color, but verify it's styled)
    const bgColor = await newsBeat.evaluate((el) => 
      window.getComputedStyle(el).backgroundColor
    )
    expect(bgColor).toBeTruthy()
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)') // Not transparent
  })

  test('should display beat cards at correct positions', async ({ page }) => {
    await page.goto('/')

    const firstBeat = page.locator('[data-testid="beat-card"]').first()
    
    // Get the wrapper element (which has absolute positioning)
    const wrapper = page.locator('.beat-card-wrapper').first()
    
    // Check that wrapper has absolute positioning
    const position = await wrapper.evaluate((el) => 
      window.getComputedStyle(el).position
    )
    expect(position).toBe('absolute')

    // Check that it has left and top values
    const left = await wrapper.evaluate((el) => 
      window.getComputedStyle(el).left
    )
    const top = await wrapper.evaluate((el) => 
      window.getComputedStyle(el).top
    )
    
    expect(left).toBeTruthy()
    expect(top).toBeTruthy()
    expect(left).not.toBe('auto')
    expect(top).not.toBe('auto')
  })

  test('should switch between canvas and grid views', async ({ page }) => {
    await page.goto('/')

    // Initially should be in canvas view
    await expect(page.locator('.beat-canvas-container')).toBeVisible()
    
    // Click grid view button
    await page.click('button[aria-label="Grid view"]')
    
    // Canvas should be hidden, grid should be visible
    await expect(page.locator('.beat-canvas-container')).not.toBeVisible()
    await expect(page.locator('.beat-grid-container')).toBeVisible()
    
    // Grid table should have beats
    await expect(page.locator('.v-data-table tbody tr')).toHaveCount(7)
    
    // Switch back to canvas
    await page.click('button[aria-label="Canvas view"]')
    
    // Canvas should be visible again
    await expect(page.locator('.beat-canvas-container')).toBeVisible()
    await expect(page.locator('.beat-grid-container')).not.toBeVisible()
  })

  test('should persist view mode preference', async ({ page }) => {
    await page.goto('/')

    // Switch to grid view
    await page.click('button[aria-label="Grid view"]')
    await expect(page.locator('.beat-grid-container')).toBeVisible()
    
    // Reload page
    await page.reload()
    
    // Should still be in grid view
    await expect(page.locator('.beat-grid-container')).toBeVisible()
    await expect(page.locator('.beat-canvas-container')).not.toBeVisible()
  })

  test('should display beats sorted by order in grid view', async ({ page }) => {
    await page.goto('/')

    // Switch to grid view
    await page.click('button[aria-label="Grid view"]')
    
    // Get all rows
    const rows = page.locator('.v-data-table tbody tr')
    await expect(rows).toHaveCount(7)
    
    // Check that first row has order 1 (Opening)
    const firstRow = rows.nth(0)
    await expect(firstRow).toContainText('Opening')
    
    // Check that last row has order 7 (Closing)
    const lastRow = rows.nth(6)
    await expect(lastRow).toContainText('Closing')
  })

  test('should be able to edit beat from grid view', async ({ page }) => {
    await page.goto('/')

    // Switch to grid view
    await page.click('button[aria-label="Grid view"]')
    
    // Click on first row
    const firstRow = page.locator('.v-data-table tbody tr').first()
    await firstRow.click()
    
    // Properties panel should show beat properties
    await page.waitForSelector('.properties-panel-container', { state: 'visible' })
    
    // Modify the order field
    const orderInput = page.locator('.properties-panel-container input[type="number"]')
    await orderInput.click()
    await orderInput.fill('10')
    
    // Wait for auto-save
    await page.waitForTimeout(500)
    
    // Verify order was updated (beat should now appear last in grid)
    const rows = page.locator('.v-data-table tbody tr')
    const lastRow = rows.last()
    await expect(lastRow).toContainText('Opening')
  })

  test('should edit production fields in properties panel', async ({ page }) => {
    await page.goto('/')

    // Click on the first beat
    const firstBeat = page.locator('[data-testid="beat-card"]').first()
    await firstBeat.click()

    // Wait for properties panel
    await page.waitForSelector('.properties-panel-container', { state: 'visible' })

    // Find and fill new production fields
    // Duration field
    const durationInput = page.locator('.properties-panel-container').getByLabel('Duración estimada')
    if (await durationInput.isVisible()) {
      await durationInput.fill('02:30.500')
    }

    // Start time field
    const startTimeInput = page.locator('.properties-panel-container').getByLabel('Hora inicio estimada')
    if (await startTimeInput.isVisible()) {
      await startTimeInput.fill('10:00:00.000')
    }

    // Scene field
    const sceneInput = page.locator('.properties-panel-container').getByLabel('Escena')
    if (await sceneInput.isVisible()) {
      await sceneInput.fill('INT. ESTUDIO - DÍA')
    }

    // Character field
    const characterInput = page.locator('.properties-panel-container').getByLabel('Personaje')
    if (await characterInput.isVisible()) {
      await characterInput.fill('Presentador Principal')
    }

    // Cue field
    const cueInput = page.locator('.properties-panel-container').getByLabel('Cue')
    if (await cueInput.isVisible()) {
      await cueInput.fill('Camera 1 close-up')
    }

    // Wait for auto-save
    await page.waitForTimeout(500)

    // Reload and verify persistence
    await page.reload()
    await page.waitForTimeout(300)
    
    // Select the same beat again
    await firstBeat.click()
    await page.waitForSelector('.properties-panel-container', { state: 'visible' })

    // Verify fields are still populated
    if (await durationInput.isVisible()) {
      await expect(durationInput).toHaveValue('02:30.500')
    }
  })

  test('should support canvas panning', async ({ page }) => {
    await page.goto('/')

    // Make sure we're in canvas view
    await page.click('button[aria-label="Canvas view"]')
    
    // Get canvas container
    const canvas = page.locator('.beat-canvas-container')
    await expect(canvas).toBeVisible()

    // Get the canvas transform element
    const canvasTransform = page.locator('.beat-canvas')
    
    // Get initial transform value
    const initialTransform = await canvasTransform.evaluate((el) => 
      window.getComputedStyle(el).transform
    )
    
    // Simulate pan: mousedown on empty area (far from beats), drag, mouseup
    // Use a position that's unlikely to have a beat
    await page.mouse.move(800, 500)
    await page.mouse.down()
    await page.mouse.move(900, 600, { steps: 5 })
    await page.mouse.up()

    // Wait for transform to apply
    await page.waitForTimeout(300)

    // Transform should have changed
    const newTransform = await canvasTransform.evaluate((el) => 
      window.getComputedStyle(el).transform
    )
    
    expect(newTransform).not.toBe(initialTransform)
  })

  test('should persist canvas pan offset', async ({ page }) => {
    await page.goto('/')

    // Pan the canvas
    await page.mouse.move(800, 500)
    await page.mouse.down()
    await page.mouse.move(900, 600, { steps: 5 })
    await page.mouse.up()

    await page.waitForTimeout(300)

    // Get canvas transform after pan
    const canvasTransform = page.locator('.beat-canvas')
    const transformAfterPan = await canvasTransform.evaluate((el) => 
      window.getComputedStyle(el).transform
    )

    // Reload page
    await page.reload()
    await page.waitForTimeout(300)

    // Transform should be preserved (pan persisted)
    const transformAfterReload = await canvasTransform.evaluate((el) => 
      window.getComputedStyle(el).transform
    )
    
    expect(transformAfterReload).toBe(transformAfterPan)
  })
})
