import { test, expect } from '@playwright/test';

test.describe('Curriculum Tree Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    // Curriculum tree is visible on most admin/studio pages
    await page.goto('/admin/studio');
  });

  test('should filter items via search', async ({ page }) => {
    // Search input is unique in the sidebar
    const searchInput = page.getByPlaceholder(/Search assets/i);
    await searchInput.fill('Calculus');
    
    // Verify matches in the sidebar
    await expect(page.getByText(/Grade 12 Mathematics/i).first()).toBeVisible();
    
    await searchInput.fill('NonExistentAsset');
    await expect(page.getByText(/No assets found/i)).toBeVisible();
  });

  test('should expand branches and show sub-items', async ({ page }) => {
    // Expand Course in sidebar
    // Redesigned tree uses a link for the course title
    const courseItem = page.getByRole('link', { name: /Grade 12 Mathematics/i });
    await courseItem.click(); 

    // After clicking, units should be visible (e.g., Unit 1)
    await expect(page.getByText(/Unit 1/i)).toBeVisible();

    // Expand Unit
    const unitItem = page.getByText(/Unit 1/i);
    await unitItem.click();

    // Concepts should be visible
    await expect(page.getByText(/Linear Functions/i).first()).toBeVisible();
  });

  test('should navigate to creation page when clicking Add Course Project', async ({ page }) => {
    // Target the specific CTA link in the sidebar
    await page.getByRole('link', { name: /Add Course Project/i }).click();
    await expect(page).toHaveURL(/\/admin\/studio\/editor\/course\/new/);
    await expect(page.getByText(/Create New Course/i)).toBeVisible();
  });
});
