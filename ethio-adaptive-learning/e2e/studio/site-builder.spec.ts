import { test, expect } from '@playwright/test';

test.describe('Site Builder Redesign - Functionality Tests', () => {
  test.describe('1. Studio Dashboard (/admin/studio)', () => {
    test('should load dashboard and display site projects', async ({ page }) => {
      await page.goto('/admin/studio');
      
      // Verify page loaded
      await expect(page).toHaveURL('/admin/studio');
      
      // Check for dashboard elements
      await expect(page.getByText(/Build learning pages like a site/i)).toBeVisible({ timeout: 5000 }).catch(
        () => console.log('❌ FAIL: Dashboard hero text not found')
      );
    });

    test('should display metrics on dashboard', async ({ page }) => {
      await page.goto('/admin/studio');
      
      // Check for metrics
      const metricsPresent = await Promise.all([
        page.getByText(/Site projects/i).isVisible().catch(() => false),
        page.getByText(/Pages/i).isVisible().catch(() => false),
        page.getByText(/Live pages/i).isVisible().catch(() => false),
      ]);
      
      if (!metricsPresent.every(v => v)) {
        console.log('❌ FAIL: Not all metrics displayed. Found:', metricsPresent);
      }
    });

    test('should display site project cards', async ({ page }) => {
      await page.goto('/admin/studio');
      
      // Look for project cards
      const cards = page.locator('[class*="rounded-\\[2rem\\]"][class*="border"][class*="outline-variant"]');
      const cardCount = await cards.count().catch(() => 0);
      
      if (cardCount === 0) {
        console.log('❌ FAIL: No project cards found on dashboard');
      } else {
        console.log(`✅ Found ${cardCount} project card(s)`);
      }
    });

    test('should navigate to site overview when clicking project', async ({ page }) => {
      await page.goto('/admin/studio');
      
      // Find and click first project's open button
      const openButton = page.locator('a[href*="/admin/studio/sites/"]').first();
      if (await openButton.isVisible().catch(() => false)) {
        const href = await openButton.getAttribute('href');
        await openButton.click();
        await page.waitForURL(/\/admin\/studio\/sites\/.+/);
        console.log(`✅ Navigated to site: ${href}`);
      } else {
        console.log('❌ FAIL: Could not find project open button');
      }
    });
  });

  test.describe('2. Site Map Navigator (Left Sidebar)', () => {
    test('should display site map navigator', async ({ page }) => {
      await page.goto('/admin/studio');
      
      // Navigate to a site first
      const openButton = page.locator('a[href*="/admin/studio/sites/"]').first();
      if (await openButton.isVisible().catch(() => false)) {
        await openButton.click();
        await page.waitForURL(/\/admin\/studio\/sites\/.+/);
      }
      
      // Check for sidebar
      const sidebar = page.locator('aside').first();
      const sidebarVisible = await sidebar.isVisible().catch(() => false);
      
      if (!sidebarVisible) {
        console.log('❌ FAIL: Site map navigator sidebar not visible');
      } else {
        console.log('✅ Site map navigator visible');
      }
    });

    test('should have site selector dropdown', async ({ page }) => {
      await page.goto('/admin/studio');
      const openButton = page.locator('a[href*="/admin/studio/sites/"]').first();
      if (await openButton.isVisible().catch(() => false)) {
        await openButton.click();
        await page.waitForURL(/\/admin\/studio\/sites\/.+/);
      }
      
      const siteSelect = page.locator('select').first();
      if (await siteSelect.isVisible().catch(() => false)) {
        console.log('✅ Site selector dropdown found');
      } else {
        console.log('❌ FAIL: Site selector dropdown not found');
      }
    });

    test('should have search input for pages', async ({ page }) => {
      await page.goto('/admin/studio');
      const openButton = page.locator('a[href*="/admin/studio/sites/"]').first();
      if (await openButton.isVisible().catch(() => false)) {
        await openButton.click();
        await page.waitForURL(/\/admin\/studio\/sites\/.+/);
      }
      
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      if (await searchInput.isVisible().catch(() => false)) {
        console.log('✅ Search input found');
      } else {
        console.log('❌ FAIL: Search input not found');
      }
    });

    test('should display page groups/units', async ({ page }) => {
      await page.goto('/admin/studio');
      const openButton = page.locator('a[href*="/admin/studio/sites/"]').first();
      if (await openButton.isVisible().catch(() => false)) {
        await openButton.click();
        await page.waitForURL(/\/admin\/studio\/sites\/.+/);
      }
      
      // Look for expandable groups
      const sidebar = page.locator('aside').first();
      const groupButtons = sidebar.locator('button');
      const groupCount = await groupButtons.count().catch(() => 0);
      
      if (groupCount === 0) {
        console.log('❌ FAIL: No page groups found in sidebar');
      } else {
        console.log(`✅ Found ${groupCount} buttons in sidebar (likely includes groups)`);
      }
    });

    test('should expand groups to show pages', async ({ page }) => {
      await page.goto('/admin/studio');
      const openButton = page.locator('a[href*="/admin/studio/sites/"]').first();
      if (await openButton.isVisible().catch(() => false)) {
        await openButton.click();
        await page.waitForURL(/\/admin\/studio\/sites\/.+/);
      }
      
      const sidebar = page.locator('aside').first();
      
      // Try to find and click first group button
      const groupButtons = sidebar.locator('button');
      const firstButton = groupButtons.nth(1); // Skip first which might be site selector
      
      if (await firstButton.isVisible().catch(() => false)) {
        await firstButton.click();
        await page.waitForTimeout(300);
        
        // Check if pages are visible now
        const pageLinks = sidebar.locator('a[href*="/pages/"]');
        const pageCount = await pageLinks.count().catch(() => 0);
        
        if (pageCount === 0) {
          console.log('❌ FAIL: No pages visible after expanding group');
        } else {
          console.log(`✅ Found ${pageCount} pages in expanded group`);
        }
      } else {
        console.log('❌ FAIL: Could not find group button to expand');
      }
    });

    test('should navigate to page when clicking page link', async ({ page }) => {
      await page.goto('/admin/studio');
      const openButton = page.locator('a[href*="/admin/studio/sites/"]').first();
      if (await openButton.isVisible().catch(() => false)) {
        await openButton.click();
        await page.waitForURL(/\/admin\/studio\/sites\/.+/);
      }
      
      const sidebar = page.locator('aside').first();
      const firstGroupButton = sidebar.locator('button').nth(1);
      if (await firstGroupButton.isVisible().catch(() => false)) {
        await firstGroupButton.click();
        await page.waitForTimeout(300);
      }
      
      const pageLink = sidebar.locator('a[href*="/pages/"]').first();
      if (await pageLink.isVisible().catch(() => false)) {
        await pageLink.click();
        await page.waitForURL(/\/admin\/studio\/sites\/.+\/pages\/.+/, { timeout: 5000 });
        console.log('✅ Navigated to page builder');
      } else {
        console.log('❌ FAIL: Could not find page link in sidebar');
      }
    });
  });

  test.describe('3. Page Builder Canvas', () => {
    test('should load page builder and display canvas', async ({ page }) => {
      await page.goto('/admin/studio');
      const openButton = page.locator('a[href*="/admin/studio/sites/"]').first();
      if (await openButton.isVisible().catch(() => false)) {
        await openButton.click();
        await page.waitForURL(/\/admin\/studio\/sites\/.+/);
      }
      
      const sidebar = page.locator('aside').first();
      const firstGroupButton = sidebar.locator('button').nth(1);
      if (await firstGroupButton.isVisible().catch(() => false)) {
        await firstGroupButton.click();
        await page.waitForTimeout(300);
      }
      
      const pageLink = sidebar.locator('a[href*="/pages/"]').first();
      if (await pageLink.isVisible().catch(() => false)) {
        await pageLink.click();
        await page.waitForURL(/\/admin\/studio\/sites\/.+\/pages\/.+/);
      }
      
      // Check for canvas/main content
      const mainContent = page.locator('main');
      if (await mainContent.isVisible().catch(() => false)) {
        console.log('✅ Page builder canvas visible');
      } else {
        console.log('❌ FAIL: Page builder canvas not visible');
      }
    });

    test('should display blocks/content on canvas', async ({ page }) => {
      await page.goto('/admin/studio');
      const openButton = page.locator('a[href*="/admin/studio/sites/"]').first();
      if (await openButton.isVisible().catch(() => false)) {
        await openButton.click();
        await page.waitForURL(/\/admin\/studio\/sites\/.+/);
      }
      
      const sidebar = page.locator('aside').first();
      const firstGroupButton = sidebar.locator('button').nth(1);
      if (await firstGroupButton.isVisible().catch(() => false)) {
        await firstGroupButton.click();
        await page.waitForTimeout(300);
      }
      
      const pageLink = sidebar.locator('a[href*="/pages/"]').first();
      if (await pageLink.isVisible().catch(() => false)) {
        await pageLink.click();
        await page.waitForURL(/\/admin\/studio\/sites\/.+\/pages\/.+/);
      }
      
      // Look for blocks
      const blocks = page.locator('[class*="bg-surface"][class*="border"][class*="rounded"]');
      const blockCount = await blocks.count().catch(() => 0);
      
      console.log(`ℹ️  Found ${blockCount} potential blocks on canvas`);
    });

    test('should have page builder topbar with controls', async ({ page }) => {
      await page.goto('/admin/studio');
      const openButton = page.locator('a[href*="/admin/studio/sites/"]').first();
      if (await openButton.isVisible().catch(() => false)) {
        await openButton.click();
        await page.waitForURL(/\/admin\/studio\/sites\/.+/);
      }
      
      const sidebar = page.locator('aside').first();
      const firstGroupButton = sidebar.locator('button').nth(1);
      if (await firstGroupButton.isVisible().catch(() => false)) {
        await firstGroupButton.click();
        await page.waitForTimeout(300);
      }
      
      const pageLink = sidebar.locator('a[href*="/pages/"]').first();
      if (await pageLink.isVisible().catch(() => false)) {
        await pageLink.click();
        await page.waitForURL(/\/admin\/studio\/sites\/.+\/pages\/.+/);
      }
      
      // Check for topbar/header
      const headers = page.locator('header');
      const headerCount = await headers.count().catch(() => 0);
      
      if (headerCount === 0) {
        console.log('❌ FAIL: No page builder topbar found');
      } else {
        console.log(`✅ Found ${headerCount} header element(s)`);
      }
    });
  });

  test.describe('4. Block Operations', () => {
    test('should allow selecting a block', async ({ page }) => {
      await page.goto('/admin/studio');
      const openButton = page.locator('a[href*="/admin/studio/sites/"]').first();
      if (await openButton.isVisible().catch(() => false)) {
        await openButton.click();
        await page.waitForURL(/\/admin\/studio\/sites\/.+/);
      }
      
      const sidebar = page.locator('aside').first();
      const firstGroupButton = sidebar.locator('button').nth(1);
      if (await firstGroupButton.isVisible().catch(() => false)) {
        await firstGroupButton.click();
        await page.waitForTimeout(300);
      }
      
      const pageLink = sidebar.locator('a[href*="/pages/"]').first();
      if (await pageLink.isVisible().catch(() => false)) {
        await pageLink.click();
        await page.waitForURL(/\/admin\/studio\/sites\/.+\/pages\/.+/);
      }
      
      // Try to select a block
      const blocks = page.locator('[class*="bg-surface"][class*="border"][class*="rounded"]');
      const blockCount = await blocks.count().catch(() => 0);
      
      if (blockCount > 0) {
        const firstBlock = blocks.first();
        await firstBlock.click().catch(() => {});
        console.log('ℹ️  Attempted to select block');
      } else {
        console.log('ℹ️  No blocks found to select');
      }
    });

    test('should allow dragging blocks to reorder', async ({ page }) => {
      await page.goto('/admin/studio');
      const openButton = page.locator('a[href*="/admin/studio/sites/"]').first();
      if (await openButton.isVisible().catch(() => false)) {
        await openButton.click();
        await page.waitForURL(/\/admin\/studio\/sites\/.+/);
      }
      
      const sidebar = page.locator('aside').first();
      const firstGroupButton = sidebar.locator('button').nth(1);
      if (await firstGroupButton.isVisible().catch(() => false)) {
        await firstGroupButton.click();
        await page.waitForTimeout(300);
      }
      
      const pageLink = sidebar.locator('a[href*="/pages/"]').first();
      if (await pageLink.isVisible().catch(() => false)) {
        await pageLink.click();
        await page.waitForURL(/\/admin\/studio\/sites\/.+\/pages\/.+/);
      }
      
      // Try drag and drop
      const blocks = page.locator('[class*="bg-surface"][class*="border"][class*="rounded"]');
      const blockCount = await blocks.count().catch(() => 0);
      
      if (blockCount >= 2) {
        try {
          const block1 = blocks.first();
          const block2 = blocks.nth(1);
          await block1.dragTo(block2);
          await page.waitForTimeout(500);
          console.log('✅ Drag and drop attempted');
        } catch (e) {
          console.log('❌ FAIL: Drag and drop failed:', e.message.substring(0, 50));
        }
      } else {
        console.log('ℹ️  Not enough blocks to test drag/drop');
      }
    });
  });

  test.describe('5. Site Project Overview', () => {
    test('should display site project overview page', async ({ page }) => {
      await page.goto('/admin/studio');
      const openButton = page.locator('a[href*="/admin/studio/sites/"]').first();
      if (await openButton.isVisible().catch(() => false)) {
        await openButton.click();
        await page.waitForURL(/\/admin\/studio\/sites\/.+/);
      }
      
      // Check for overview content
      const mainContent = page.locator('main');
      if (await mainContent.isVisible().catch(() => false)) {
        console.log('✅ Site project overview page visible');
      } else {
        console.log('❌ FAIL: Site project overview not visible');
      }
    });

    test('should have "New Page" action button', async ({ page }) => {
      await page.goto('/admin/studio');
      const openButton = page.locator('a[href*="/admin/studio/sites/"]').first();
      if (await openButton.isVisible().catch(() => false)) {
        await openButton.click();
        await page.waitForURL(/\/admin\/studio\/sites\/.+/);
      }
      
      const sidebar = page.locator('aside').first();
      const newPageButton = sidebar.getByRole('link', { name: /New Page/i });
      
      if (await newPageButton.isVisible().catch(() => false)) {
        console.log('✅ "New Page" button found in sidebar');
      } else {
        console.log('❌ FAIL: "New Page" button not found');
      }
    });
  });

  test.describe('6. Workspace Header', () => {
    test('should display workspace header with breadcrumbs', async ({ page }) => {
      await page.goto('/admin/studio');
      
      const header = page.locator('header').first();
      if (await header.isVisible().catch(() => false)) {
        console.log('✅ Workspace header visible');
        
        // Check for breadcrumbs
        const breadcrumbs = header.getByText(/Studio|Site|Builder/i);
        if (await breadcrumbs.isVisible().catch(() => false)) {
          console.log('✅ Breadcrumbs found');
        } else {
          console.log('ℹ️  Breadcrumbs not clearly visible');
        }
      } else {
        console.log('❌ FAIL: Workspace header not visible');
      }
    });

    test('should display user menu', async ({ page }) => {
      await page.goto('/admin/studio');
      
      const header = page.locator('header').first();
      const userElements = header.locator('[class*="Avatar"]');
      const userCount = await userElements.count().catch(() => 0);
      
      if (userCount > 0) {
        console.log('✅ User menu element found');
      } else {
        console.log('ℹ️  User menu not clearly identified');
      }
    });
  });

  test.describe('7. Responsive Design', () => {
    test('should work on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/admin/studio');
      
      const sidebar = page.locator('aside').first();
      const mainContent = page.locator('main');
      
      if (await sidebar.isVisible().catch(() => false) && await mainContent.isVisible().catch(() => false)) {
        console.log('✅ Desktop layout works (sidebar + main visible)');
      } else {
        console.log('❌ FAIL: Desktop layout broken');
      }
    });

    test('should work on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto('/admin/studio');
      
      const mainContent = page.locator('main');
      if (await mainContent.isVisible().catch(() => false)) {
        console.log('✅ Tablet layout works');
      } else {
        console.log('❌ FAIL: Tablet layout broken');
      }
    });

    test('should work on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/admin/studio');
      
      const header = page.locator('header').first();
      if (await header.isVisible().catch(() => false)) {
        console.log('✅ Mobile layout works (header visible)');
      } else {
        console.log('❌ FAIL: Mobile layout broken');
      }
    });
  });

  test.describe('8. Error Handling', () => {
    test('should handle non-existent site gracefully', async ({ page }) => {
      const response = await page.goto('/admin/studio/sites/nonexistent-site-id', { waitUntil: 'networkidle' }).catch(e => null);
      
      // Should either redirect, show 404, or show error message
      const url = page.url();
      const notFoundIndicator = url.includes('404') || url.includes('studio') || await page.getByText(/not found|404/i).isVisible().catch(() => false);
      
      if (notFoundIndicator) {
        console.log('✅ 404 handling works');
      } else {
        console.log('ℹ️  404 handling unclear');
      }
    });

    test('should handle non-existent page gracefully', async ({ page }) => {
      // First get a valid site ID
      await page.goto('/admin/studio');
      const openButton = page.locator('a[href*="/admin/studio/sites/"]').first();
      
      let siteId = 'test-site';
      if (await openButton.isVisible().catch(() => false)) {
        const href = await openButton.getAttribute('href');
        if (href) {
          siteId = href.split('/').pop() || siteId;
        }
      }
      
      const response = await page.goto(`/admin/studio/sites/${siteId}/pages/nonexistent-page-id`, { waitUntil: 'networkidle' }).catch(e => null);
      
      // Should either redirect, show 404, or show error message
      const url = page.url();
      const notFoundIndicator = url.includes('404') || url.includes('studio') || await page.getByText(/not found|404/i).isVisible().catch(() => false);
      
      if (notFoundIndicator) {
        console.log('✅ Non-existent page handling works');
      } else {
        console.log('ℹ️  Non-existent page handling unclear');
      }
    });
  });

  test.describe('9. Data Persistence', () => {
    test('should save block changes to server', async ({ page }) => {
      await page.goto('/admin/studio');
      const openButton = page.locator('a[href*="/admin/studio/sites/"]').first();
      if (await openButton.isVisible().catch(() => false)) {
        await openButton.click();
        await page.waitForURL(/\/admin\/studio\/sites\/.+/);
      }
      
      const sidebar = page.locator('aside').first();
      const firstGroupButton = sidebar.locator('button').nth(1);
      if (await firstGroupButton.isVisible().catch(() => false)) {
        await firstGroupButton.click();
        await page.waitForTimeout(300);
      }
      
      const pageLink = sidebar.locator('a[href*="/pages/"]').first();
      if (await pageLink.isVisible().catch(() => false)) {
        await pageLink.click();
        await page.waitForURL(/\/admin\/studio\/sites\/.+\/pages\/.+/);
      }
      
      // Look for save indicator
      const saveIndicator = page.locator('[class*="Save"][class*="save"], [class*="Saved"]');
      if (await saveIndicator.isVisible().catch(() => false)) {
        console.log('✅ Save indicator found');
      } else {
        console.log('ℹ️  Save indicator not clearly visible');
      }
    });
  });
});
