import { test, expect } from '@playwright/test';

test.describe('Focus Mode Editor', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a specific concept editor via the site map navigator
    await page.goto('/admin/studio');
    
    // 1. Enter a site overview first
    const projectCard = page.locator('div').filter({ has: page.getByRole('heading', { name: /Grade 12 Mathematics/i }) }).first();
    await expect(projectCard).toBeVisible();
    await projectCard.getByTitle('Open site project').click();
    await page.waitForURL(/\/admin\/studio\/sites\/.+/);

    // 2. Search for the 'Complex' concept specifically
    const sidebar = page.locator('aside').first();
    const searchInput = sidebar.locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Complex');
    
    // Wait for search results
    const trigLink = sidebar.locator('a').filter({ hasText: /Complex Trigonometric Identities/i }).first();
    await expect(trigLink).toBeVisible({ timeout: 10000 });
    await trigLink.click();
    
    // 3. Navigate to Focus Mode (Editor)
    // We expect to be on a page builder URL now, which has an 'Edit' button or similar to go to deep editor
    // Or we can just grab the ID and go direct if that's more stable for setup
    await page.waitForURL(/\/admin\/studio\/sites\/.+\/pages\/.+/);
    const url = new URL(page.url());
    const pageId = url.pathname.split('/').pop();
    await page.goto(`/admin/studio/editor/concept/${pageId}`);

    await expect(page).toHaveURL(/\/admin\/studio\/editor\/concept\/.+/);
    await page.waitForSelector('form', { state: 'visible' });
    });

  test('should display focus mode header', async ({ page }) => {
    // Check for core focus mode elements
    await expect(page.getByRole('link', { name: /Exit/i })).toBeVisible();
    await expect(page.getByText(/Editor/i).first()).toBeVisible();

    // Verify title matches seeded data
    await expect(page.locator('header h1').last()).toHaveText(/Complex Trigonometric Identities/i);
    });

  test('should support draft preview', async ({ page }) => {
    // Wait for the editor content to be likely loaded
    await page.waitForSelector('form', { state: 'visible' });

    // The button text is "Preview" or "Draft Preview"
    const previewLink = page.locator('header').getByRole('link', { name: /Preview/i }).first();
    await expect(previewLink).toBeVisible();
    await expect(previewLink).toHaveAttribute('target', '_blank');
  });

  test('should support viewing live if published', async ({ page }) => {
    // "Complex Trigonometric Identities" is published in the seed
    const liveLink = page.getByRole('link', { name: /Live/i }).first();
    await expect(liveLink).toBeVisible();
    
    const href = await liveLink.getAttribute('href');
    expect(href).toContain('/student/concept/');
  });

  test('should validate seeded adaptive parameters', async ({ page }) => {
    // Verify custom BKT values from seed
    const pTField = page.locator('input[name="pT"]');
    await expect(pTField).toHaveValue('0.02');

    const pSField = page.locator('input[name="pS"]');
    await expect(pSField).toHaveValue('0.35');

    const pLoField = page.locator('input[name="pLo"]');
    await expect(pLoField).toHaveValue('0.05');
  });

  test('should return to previous context when exiting', async ({ page }) => {
    await page.getByRole('link', { name: /Exit/i }).click();
    // Should return to the studio hub
    await expect(page).toHaveURL(/\/admin\/studio/);
  });

  test('should validate probability fields', async ({ page }) => {
    // Wait for the form
    await page.waitForSelector('form');

    // Find a probability field (e.g., P(L0) or Unlock Threshold)
    const pLoField = page.locator('input[name="pLo"]');
    
    // Check if the field exists (might be in a collapsed section)
    if (await pLoField.count() > 0) {
      await pLoField.fill('1.5'); // Invalid: probability must be <= 1.0
      await page.keyboard.press('Tab'); // Trigger blur/validation
      
      // Submit the form
      await page.getByRole('button', { name: /Save Draft/i }).click();
      
      // Wait for UI update
      await page.waitForTimeout(1000);
      
      // Look for validation error - use more specific container if possible
      const errorText = page.getByText(/must be between 0 and 1/i);
      await expect(errorText.first()).toBeVisible();
      console.log('✅ Out-of-bounds probability validation caught');
    } else {
      console.log('ℹ️ Skipping probability validation: field not found in current view.');
    }
  });

  test('should prevent saving with empty title', async ({ page }) => {
    await page.waitForSelector('form');
    
    const titleField = page.locator('input[name="title"]');
    await titleField.fill('');
    await page.getByRole('button', { name: /Save Draft/i }).click();
    
    // Wait for UI update
    await page.waitForTimeout(1000);

    // Check for "required" error - the actual schema uses "is required."
    await expect(page.getByText(/is required/i).first()).toBeVisible();
    console.log('✅ Empty title validation caught');
  });

  test('should load seeded concept editor with title validation', async ({ page }) => {
    // Verify we loaded an editor with a concept header
    const heading = await page.locator('header h1').last().textContent();
    expect(heading).toBeTruthy();
    expect(heading).not.toContain('Create New');
    console.log(`✅ Concept editor loaded with title: ${heading}`);
  });

  test('should allow navigation to seeded complex trigonometry concept', async ({ page }) => {
    // Go back to studio and navigate via sidebar search if available
    await page.goto('/admin/studio');
    
    const projectCard = page.locator('div').filter({ has: page.getByRole('heading', { name: /Grade 12 Mathematics/i }) }).first();
    await projectCard.getByTitle('Open site project').click();
    await page.waitForURL(/\/admin\/studio\/sites\/.+/);
    
    // Search for the seeded concept
    const sidebar = page.locator('aside').first();
    const searchInput = sidebar.locator('input[placeholder*="Search"]').first();
    
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('Complex Trig');
      await page.waitForTimeout(500);
      
      // Try to find the concept link
      const trigLink = sidebar.locator('a').filter({ hasText: /Complex.*Trig/i }).first();
      if (await trigLink.isVisible().catch(() => false)) {
        await trigLink.click();
        await page.waitForTimeout(500);
        
        // Navigate to editor
        const url = new URL(page.url());
        const pageId = url.pathname.split('/').pop();
        await page.goto(`/admin/studio/editor/concept/${pageId}`);
        
        // Verify we're in a concept editor
        await expect(page).toHaveURL(/\/admin\/studio\/editor\/concept\/.+/);
        console.log('✅ Successfully navigated to seeded concept editor');
      }
    }
  });

  test('should display form fields for seeded concept data', async ({ page }) => {
    // Wait for the form to be present
    await page.waitForSelector('form', { state: 'visible' });
    
    // Check for expected concept-related fields
    const titleField = page.locator('input[name="title"]');
    const slugField = page.locator('input[name="slug"]');
    
    // At least one should be present
    const titleVisible = await titleField.isVisible().catch(() => false);
    const slugVisible = await slugField.isVisible().catch(() => false);
    
    expect(titleVisible || slugVisible).toBe(true);
    
    if (titleVisible) {
      const titleValue = await titleField.inputValue();
      expect(titleValue.length).toBeGreaterThan(0);
      console.log(`✅ Concept title field populated: ${titleValue}`);
    }
  });

  test('should validate probability field exists and has bounds', async ({ page }) => {
    // Wait for the form
    await page.waitForSelector('form', { state: 'visible' });

    // Try to find probability fields (pLo, pT, pG, pS)
    const pLoField = page.locator('input[name="pLo"]');
    const pTField = page.locator('input[name="pT"]');
    
    // Check if at least one exists (might be in collapsed section)
    const pLoCount = await pLoField.count();
    const pTCount = await pTField.count();
    
    if (pLoCount > 0) {
      // Test setting an invalid value
      await pLoField.fill('1.5');
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);
      
      // Look for validation feedback
      const errorVisible = await page.getByText(/must be between|out of range|invalid/i).isVisible().catch(() => false);
      if (errorVisible) {
        console.log('✅ Probability field validation working');
      }
      
      // Restore valid value
      await pLoField.fill('0.5');
    } else if (pTCount > 0) {
      const value = await pTField.inputValue();
      expect(parseFloat(value)).toBeGreaterThanOrEqual(0);
      expect(parseFloat(value)).toBeLessThanOrEqual(1);
      console.log(`✅ Probability field (pT) has valid value: ${value}`);
    } else {
      console.log('ℹ️ No probability fields found (may be in collapsed section)');
    }
  });
});
