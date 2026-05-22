import { test, expect } from '@playwright/test';

test.describe('Studio Hub', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/studio');
  });

  test('should display active course projects', async ({ page }) => {
    // Check for the section header
    await expect(page.getByText(/Active Course Projects/i)).toBeVisible();
    
    // Target the specific heading in the project grid
    await expect(page.getByRole('heading', { name: /Grade 12 Mathematics/i })).toBeVisible();
  });

  test('should display intelligence snapshot metrics', async ({ page }) => {
    // Look for metric labels in the intelligence section
    await expect(page.getByText(/Total Interactions/i)).toBeVisible();
    await expect(page.getByText(/Active Students/i)).toBeVisible();
    await expect(page.getByText(/Draft Content/i)).toBeVisible();
    await expect(page.getByText(/System Health/i)).toBeVisible();
  });

  test('should navigate to builder when clicking a project card', async ({ page }) => {
    // Click the specific project card heading
    await page.getByRole('heading', { name: /Grade 12 Mathematics/i }).click();
    await expect(page).toHaveURL(/\/admin\/studio\/builder\/.+/);
    await expect(page.getByText(/Curriculum Origin/i)).toBeVisible();
  });
});
