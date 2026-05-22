import { test, expect } from '@playwright/test';

test.describe('Focus Mode Editor', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a specific concept editor via the tree
    await page.goto('/admin/studio');
    
    await page.getByRole('link', { name: /Grade 12 Mathematics/i }).click();
    await page.getByText(/Unit 1/i).click();
    await page.getByText(/Linear Functions/i).first().click();
    
    await expect(page).toHaveURL(/\/admin\/studio\/editor\/concept\/.+/);
  });

  test('should display focus mode header', async ({ page }) => {
    await expect(page.getByText(/Exit Focus Mode/i)).toBeVisible();
    await expect(page.getByText(/Deep Editor/i)).toBeVisible();
    await expect(page.getByText(/Linear Functions/i)).toBeVisible();
  });

  test('should support draft preview', async ({ page }) => {
    const previewLink = page.getByRole('link', { name: /Draft Preview/i });
    await expect(previewLink).toBeVisible();
    
    // Check if it opens in a new tab (target="_blank")
    await expect(previewLink).toHaveAttribute('target', '_blank');
  });

  test('should support viewing live if published', async ({ page }) => {
    // Note: Depends on if the concept is published in seed. 
    // Seed might not publish by default, but we can check if the button exists if status is published.
    const statusBadge = page.locator('div').filter({ hasText: /^PUBLISHED$|^DRAFT$/ }).last();
    const statusText = await statusBadge.textContent();
    
    if (statusText?.includes('PUBLISHED')) {
      await expect(page.getByRole('link', { name: /View Live/i })).toBeVisible();
    }
  });

  test('should return to previous context when exiting', async ({ page }) => {
    await page.getByText(/Exit Focus Mode/i).click();
    // Should return to the studio hub or builder
    await expect(page).toHaveURL(/\/admin\/studio/);
  });
});
