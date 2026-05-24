import { test, expect } from '@playwright/test';

test.describe('Curriculum Tree Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    // Curriculum tree is visible on most admin/studio pages
    await page.goto('/admin/studio');
  });

  test('should filter items via search', async ({ page }) => {
    // Use the textbox role which is more robust than placeholder-only
    const searchInput = page.getByRole('textbox', { name: /Search assets/i });
    await searchInput.fill('Calculus');
    
    // Verify matches in the sidebar. Use .first() if needed but link role is better
    await expect(page.getByRole('link', { name: /Grade 12 Mathematics/i }).first()).toBeVisible();
    
    await searchInput.fill('NonExistentAsset');
    await expect(page.getByText(/No assets found/i)).toBeVisible();
  });

  test('should expand branches and show sub-items', async ({ page }) => {
    // Redesigned tree uses a link for the course title, but the DIV container toggles expansion.
    // We find the link and click its container (the list item).
    const courseItem = page.getByRole('link', { name: /Grade 12 Mathematics/i }).first();
    // We click near the link to trigger the parent's onClick without navigating.
    await courseItem.click({ position: { x: -10, y: 0 } }); 

    // After clicking, units should be visible (e.g., Unit 1)
    const unitText = page.getByText(/Unit 1/i).first();
    await expect(unitText).toBeVisible();

    // Expand Unit
    await unitText.click();

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
