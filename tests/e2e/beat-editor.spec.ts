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

    // Now click on the new beat to edit it
    await page.click('[data-testid="beat-card"]:has-text("New News")')

    // Wait for edit dialog
    await page.waitForSelector('text=Editar Beat', { state: 'visible' })
    
    // Fill in beat details
    await page.locator('input[type="text"]').first().click()
    await page.locator('input[type="text"]').first().press('Meta+a')
    await page.locator('input[type="text"]').first().fill('Breaking News')
    await page.locator('textarea').fill('Important breaking news story')
    
    // Save the beat
    await page.click('button:has-text("Guardar")')

    // Wait for dialog to close
    await page.waitForTimeout(500)

    // Verify the edited beat appears on canvas
    await expect(page.locator('[data-testid="beat-card"]:has-text("Breaking News")')).toBeVisible()
  })

  test('should edit an existing beat', async ({ page }) => {
    await page.goto('/')

    // Click on the first beat card
    const firstBeat = page.locator('[data-testid="beat-card"]').first()
    await firstBeat.click()

    // Edit dialog should appear
    await page.waitForSelector('text=Editar Beat', { state: 'visible' })

    // Modify the title - clear and type new value
    const titleInput = page.locator('input[type="text"]').first()
    await titleInput.click()
    await titleInput.press('Meta+a') // Select all
    await titleInput.fill('Updated Opening')

    // Save changes
    await page.click('button:has-text("Guardar")')

    // Wait for dialog to close
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

    // Find and edit the new beat
    await page.click('[data-testid="beat-card"]:has-text("New Sports")')
    await page.waitForSelector('text=Editar Beat', { state: 'visible' })
    
    const titleInput = page.locator('input[type="text"]').first()
    await titleInput.click()
    await titleInput.press('Meta+a')
    await titleInput.fill('Football Match')
    await page.click('button:has-text("Guardar")')

    // Wait for dialog to close
    await page.waitForTimeout(500)

    // Reload the page
    await page.reload()

    // The edited beat should still be there
    await expect(page.locator('[data-testid="beat-card"]:has-text("Football Match")')).toBeVisible()
  })

  test('should save project manually', async ({ page }) => {
    await page.goto('/')

    // Edit a beat
    const firstBeat = page.locator('[data-testid="beat-card"]').first()
    await firstBeat.click()
    
    await page.waitForSelector('text=Editar Beat', { state: 'visible' })
    const titleInput = page.locator('input[type="text"]').first()
    await titleInput.click()
    await titleInput.press('Meta+a')
    await titleInput.fill('Modified Opening')
    await page.click('button:has-text("Guardar")')

    await page.waitForTimeout(500)

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
    
    // Check that beat has absolute positioning
    const position = await firstBeat.evaluate((el) => 
      window.getComputedStyle(el).position
    )
    expect(position).toBe('absolute')

    // Check that it has left and top values
    const left = await firstBeat.evaluate((el) => 
      window.getComputedStyle(el).left
    )
    const top = await firstBeat.evaluate((el) => 
      window.getComputedStyle(el).top
    )
    
    expect(left).toBeTruthy()
    expect(top).toBeTruthy()
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
    
    // Edit dialog should appear
    await page.waitForSelector('text=Editar Beat', { state: 'visible' })
    
    // Modify the order field
    const orderInput = page.locator('input[type="number"]')
    await orderInput.click()
    await orderInput.fill('10')
    
    // Save changes
    await page.click('button:has-text("Guardar")')
    
    await page.waitForTimeout(500)
    
    // Verify order was updated (beat should now appear last in grid)
    const rows = page.locator('.v-data-table tbody tr')
    const lastRow = rows.last()
    await expect(lastRow).toContainText('Opening')
  })
})
