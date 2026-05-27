import { test, expect } from '@playwright/test';

test.describe('Studio Hub', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/studio');
  });

  test('should display site projects section', async ({ page }) => {
    // Check for the section header using role to avoid metric label ambiguity
    await expect(page.getByRole('heading', { name: /Site Projects/i })).toBeVisible();
    
    // Target the specific heading in the project grid
    await expect(page.getByRole('heading', { name: /Grade 12 Mathematics/i })).toBeVisible();
  });

  test('should display key metrics', async ({ page }) => {
    // Look for metric labels in the top section
    // Use first() to get the primary metrics at the top, or scope to the section
    const metricsSection = page.locator('section').first();
    await expect(metricsSection.getByText('Site projects', { exact: true })).toBeVisible();
    await expect(metricsSection.getByText('Pages', { exact: true })).toBeVisible();
    await expect(metricsSection.getByText('Live pages', { exact: true })).toBeVisible();
    await expect(metricsSection.getByText('Draft pages', { exact: true })).toBeVisible();
  });

  test('should navigate to project overview via card button', async ({ page }) => {
    // Find the project card for Grade 12 Mathematics
    const projectCard = page.locator('div').filter({ has: page.getByRole('heading', { name: /Grade 12 Mathematics/i }) }).first();
    
    // Click the arrow button (link) in that card which has the title "Open site project"
    await projectCard.getByTitle('Open site project').click();
    
    // In the new design, we land on the Site Project Overview (/sites/[id])
    await expect(page).toHaveURL(/\/admin\/studio\/sites\/.+/);
    // Overview has "Quick Actions" and "Recent Pages"
    await expect(page.getByText(/Quick Actions/i)).toBeVisible();
  });
});
