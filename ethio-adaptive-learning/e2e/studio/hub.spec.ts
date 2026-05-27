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
    
    // Verify the author is seeded writer (curriculum_lead)
    const projectCard = page.locator('div').filter({ has: page.getByRole('heading', { name: /Grade 12 Mathematics/i }) }).first();
    await expect(projectCard.getByText(/curriculum_lead/i)).toBeVisible();
  });

  test('should display key metrics', async ({ page }) => {
    // Look for metric labels in the top section
    const metricsSection = page.locator('section').first();
    await expect(metricsSection.getByText('Site projects', { exact: true })).toBeVisible();
    
    // Pages metric should be visible and non-zero
    const pagesMetric = metricsSection.locator('div').filter({ has: metricsSection.getByText('Pages', { exact: true }) });
    const pageCount = await pagesMetric.locator('p').last().textContent();
    expect(parseInt(pageCount || '0')).toBeGreaterThan(0);

    // Live pages should also be non-zero in a seeded environment
    const liveMetric = metricsSection.locator('div').filter({ has: metricsSection.getByText('Live pages', { exact: true }) });
    const liveCount = await liveMetric.locator('p').last().textContent();
    expect(parseInt(liveCount || '0')).toBeGreaterThan(0);
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

  test('should validate seeded site project card contains Mathematics content', async ({ page }) => {
    // Verify the seeded Grade 12 Mathematics project is rendered
    const projectCard = page.locator('div').filter({ has: page.getByRole('heading', { name: /Grade 12 Mathematics/i }) }).first();
    await expect(projectCard).toBeVisible();
    
    // Verify the card has an open button
    const openButton = projectCard.getByTitle('Open site project');
    await expect(openButton).toBeVisible();
    console.log('✅ Seeded Grade 12 Mathematics project card verified');
  });

  test('should verify metrics reflect seeded content', async ({ page }) => {
    // Verify metrics show non-zero values (seeded data exists)
    const metricsSection = page.locator('section').first();
    
    // Get the "Pages" metric value
    const pagesMetric = metricsSection.locator('div').filter({ has: metricsSection.getByText('Pages', { exact: true }) });
    const pageCount = await pagesMetric.locator('div').first().textContent();
    
    // Should have pages from seeded import
    expect(pageCount).not.toBe('0');
    console.log(`✅ Seeded pages count verified: ${pageCount}`);
  });

  test('should allow navigation from hub to seeded site overview', async ({ page }) => {
    // Navigate to the seeded project
    const projectCard = page.locator('div').filter({ has: page.getByRole('heading', { name: /Grade 12 Mathematics/i }) }).first();
    await projectCard.getByTitle('Open site project').click();
    
    // Confirm we're in the site overview
    const siteUrl = page.url();
    expect(siteUrl).toMatch(/\/admin\/studio\/sites\/.+/);
    
    // Quick Actions should be visible
    await expect(page.getByText(/Quick Actions/i)).toBeVisible();
    console.log('✅ Navigation to seeded site overview successful');
  });
});
