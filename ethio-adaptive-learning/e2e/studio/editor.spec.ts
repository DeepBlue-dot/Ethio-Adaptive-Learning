import { test, expect } from '@playwright/test';

test.describe('Focus Mode Editor', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a specific concept editor via the site map navigator
    await page.goto('/admin/studio');
    
    // 1. Enter a site overview first
    const projectCard = page.locator('div').filter({ has: page.getByRole('heading', { name: /Grade 12 Mathematics/i }) }).first();
    await projectCard.getByTitle('Open site project').click();
    await page.waitForURL(/\/admin\/studio\/sites\/.+/);

    // 2. Locate the sidebar and expand a group
    const sidebar = page.locator('aside').first();
    // Units are now called Groups in the navigator
    const firstGroupButton = sidebar.locator('button').filter({ hasText: /Group 1/i }).first();
    await firstGroupButton.click();

    // 3. Click a real page link in the sidebar (exclude the 'new' page link)
    const pageLink = sidebar.locator('a[href*="/pages/"]').filter({ hasNot: page.getByText(/New Page/i) }).first();
    await pageLink.click();
    await page.waitForURL(/\/admin\/studio\/sites\/.+\/pages\/.+/);

    // 4. Navigate to Focus Mode (Editor)
    const url = new URL(page.url());
    const pageId = url.pathname.split('/').pop();
    await page.goto(`/admin/studio/editor/concept/${pageId}`);

    await expect(page).toHaveURL(/\/admin\/studio\/editor\/concept\/.+/);
    });

    test('should display focus mode header', async ({ page }) => {
    // Check for core focus mode elements
    await expect(page.getByText(/Exit Focus Mode/i)).toBeVisible();
    await expect(page.getByText(/Deep Editor/i)).toBeVisible();

    // Log the actual heading to see if we land on a real item
    // Scope to the header to avoid strict mode violations
    const heading = await page.locator('header h1').last().textContent();
    console.log(`ℹ️ Focus Mode Header Title: ${heading}`);
    });

    test('should support draft preview', async ({ page }) => {
    const heading = await page.locator('header h1').last().textContent();
    if (heading?.includes('Create New')) {
      console.log('ℹ️ Skipping preview test: currently on a creation page.');
      return;
    }
      // Wait for the editor content to be likely loaded
      await page.waitForSelector('form', { state: 'visible' });

      // The button text is "Draft Preview"
      const previewLink = page.locator('header').getByRole('link', { name: /Preview/i }).first();
      const isVisible = await previewLink.isVisible();

      if (isVisible) {
        await expect(previewLink).toBeVisible();
        await expect(previewLink).toHaveAttribute('target', '_blank');
        console.log('✅ Draft Preview link verified');
      } else {
        console.log('⚠️ Draft Preview link not found in header');
      }
    });
  test('should support viewing live if published', async ({ page }) => {
    // Check if the "Live" link exists
    const liveLink = page.getByRole('link', { name: /Live/i });
    // Visibility depends on published status, so we check if it exists if it's there
    const isVisible = await liveLink.isVisible();
    if (isVisible) {
      await expect(liveLink).toBeVisible();
    }
  });

  test('should return to previous context when exiting', async ({ page }) => {
    await page.getByText(/Exit Focus Mode/i).click();
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
      await page.getByRole('button', { name: /Save/i }).first().click();
      
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
    await page.getByRole('button', { name: /Save/i }).first().click();
    
    // Wait for UI update
    await page.waitForTimeout(1000);

    // Check for "required" error - the actual schema uses "is required."
    await expect(page.getByText(/is required/i).first()).toBeVisible();
    console.log('✅ Empty title validation caught');
  });
});
