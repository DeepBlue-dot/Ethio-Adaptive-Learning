import { test, expect } from '@playwright/test';

test.describe('Course Builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/studio');
    // Click the specific project card heading to enter builder
    await page.getByRole('heading', { name: /Grade 12 Mathematics/i }).click();
    await expect(page).toHaveURL(/\/admin\/studio\/builder\/.+/);
  });

  test('should display builder layout', async ({ page }) => {
    // Canvas should show units. Redesigned nodes use U{order}:
    const canvas = page.locator('main');
    await expect(canvas.getByText(/U1:/i).first()).toBeVisible();
    await expect(canvas.getByText(/U2:/i).first()).toBeVisible();
  });

  test('should open inspector when selecting a node', async ({ page }) => {
    // Click on a unit in the canvas
    const canvas = page.locator('main');
    await canvas.getByText(/U1:/i).first().click();
    
    // Inspector should open with details (complementary role usually maps to <aside>)
    const inspector = page.getByRole('complementary');
    await expect(inspector).toBeVisible();
    await expect(inspector.getByText(/Inspector/i)).toBeVisible();
  });

  test('should allow navigating to deep editor from inspector', async ({ page }) => {
    const canvas = page.locator('main');
    await canvas.getByText(/U1:/i).first().click();
    
    const inspector = page.getByRole('complementary');
    await inspector.getByRole('link', { name: /Deep Editor/i }).click();
    
    await expect(page).toHaveURL(/\/admin\/studio\/editor\/unit\/.+/);
    await expect(page.getByText(/Deep Editor/i)).toBeVisible();
  });
});
