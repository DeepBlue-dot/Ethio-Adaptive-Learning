import { test, expect } from '@playwright/test';

/**
 * These tests are designed to identify and eventually validate "Critical Fixes" 
 * related to curriculum integrity and adaptive logic.
 */
test.describe('Studio Integrity & Adaptive Logic', () => {
  
  test.beforeEach(async ({ page }) => {
    // Standard Studio login/entry
    await page.goto('/admin/studio');
    
    // Proactively remove dev overlay and keep it gone
    await page.evaluate(() => {
      const removeOverlay = () => {
        const overlay = document.querySelector('nextjs-portal, [data-nextjs-dev-overlay], #__next-build-watcher, #__next-prerender-indicator');
        if (overlay) overlay.remove();
      };
      removeOverlay();
      const observer = new MutationObserver(removeOverlay);
      observer.observe(document.body, { childList: true, subtree: true });
    });

    await expect(page).toHaveURL('/admin/studio');
  });

  test('Critical Fix 1: Circular Prerequisite Detection', async ({ page }) => {
    // 1. Navigate to Grade 12 Math
    await page.goto('/admin/studio');
    const projectCard = page.locator('div').filter({ has: page.getByRole('heading', { name: /Grade 12 Mathematics/i }) }).first();
    await projectCard.getByTitle('Open course project').click();
    await page.waitForURL(/\/admin\/studio\/sites\/.+/);

    // 2. Open 'Limits' in the editor
    const sidebar = page.locator('aside').first();
    const searchInput = sidebar.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('Limits');
    await page.waitForTimeout(1000); // Allow filter to apply
    const limitsLink = sidebar.locator('a').filter({ has: page.getByText('Limits', { exact: true }) }).first();
    await expect(limitsLink).toBeVisible();
    await limitsLink.click();
    
    // Navigate to editor
    const urlA = new URL(page.url());
    const idA = urlA.pathname.split('/').pop();
    await page.goto(`/admin/studio/editor/concept/${idA}`);
    await page.waitForSelector('form', { state: 'visible', timeout: 15000 });

    // 3. Add 'Introduction to Calculus' as a prerequisite to 'Limits'
    const prereqSelect = page.locator('select[name="prerequisiteConceptIds"]');
    await expect(prereqSelect).toBeVisible({ timeout: 10000 });
    await prereqSelect.selectOption({ label: /Introduction to Calculus/i });
    
    // Save draft
    await page.getByRole('button', { name: 'Save Draft' }).click();
    await expect(page.getByText(/Draft saved/i)).toBeVisible({ timeout: 10000 });

    // 4. Now go to 'Introduction to Calculus' and try to add 'Limits' as a prereq
    await page.goto('/admin/studio');
    const projectCard2 = page.locator('div').filter({ has: page.getByRole('heading', { name: /Grade 12 Mathematics/i }) }).first();
    await projectCard2.getByTitle('Open course project').click();
    
    await searchInput.fill('Introduction to Calculus');
    await page.waitForTimeout(1000);
    const calculusLink = sidebar.locator('a').filter({ has: page.getByText('Introduction to Calculus', { exact: true }) }).first();
    await expect(calculusLink).toBeVisible();
    await calculusLink.click();
    
    const urlB = new URL(page.url());
    const idB = urlB.pathname.split('/').pop();
    await page.goto(`/admin/studio/editor/concept/${idB}`);
    await page.waitForSelector('form', { state: 'visible', timeout: 15000 });

    // 5. Try to add 'Limits' as a prerequisite (THIS SHOULD FAIL OR WARN ONCE FIXED)
    await prereqSelect.selectOption({ label: /^Limits$/ });
    
    // Save draft
    await page.getByRole('button', { name: 'Save Draft' }).click();
    
    const errorMsg = page.getByText(/Circular dependency/i);
    const isErrorVisible = await errorMsg.isVisible().catch(() => false);
    
    if (!isErrorVisible) {
      console.log('❌ BUG FOUND: Circular dependency was allowed between "Limits" and "Introduction to Calculus"');
    } else {
      console.log('✅ Circular dependency caught successfully');
    }
    
    await expect(errorMsg).toBeVisible({ timeout: 2000 }).catch(() => {
       throw new Error("REPRODUCTION: Circular dependency was NOT caught by the system.");
    });
  });

  test('Critical Fix 2: Draft Leakage (Published depending on Draft)', async ({ page }) => {
    // 1. Navigate to Grade 12 Math overview
    await page.goto('/admin/studio');
    const projectCard = page.locator('div').filter({ has: page.getByRole('heading', { name: /Grade 12 Mathematics/i }) }).first();
    await projectCard.getByTitle('Open course project').click();
    await page.waitForURL(/\/admin\/studio\/sites\/.+/);

    // 2. Create 'Draft Prereq'
    await page.getByRole('main').getByRole('link', { name: /New Concept/i }).first().click();
    await page.waitForURL(/\/admin\/studio\/editor\/concept\/.+/, { timeout: 15000 });
    
    const titleField = page.locator('input[name="title"]');
    await expect(titleField).toBeVisible({ timeout: 10000 });
    await titleField.fill('Draft Prereq');
    await page.getByRole('button', { name: 'Save Draft' }).click();
    await expect(page.getByText(/Draft saved/i)).toBeVisible({ timeout: 10000 });

    // 3. Create 'Published Dependent'
    await page.goto('/admin/studio');
    const projectCard2 = page.locator('div').filter({ has: page.getByRole('heading', { name: /Grade 12 Mathematics/i }) }).first();
    await projectCard2.getByTitle('Open course project').click();
    await page.getByRole('main').getByRole('link', { name: /New Concept/i }).first().click();
    await page.waitForURL(/\/admin\/studio\/editor\/concept\/.+/, { timeout: 15000 });
    
    await expect(titleField).toBeVisible({ timeout: 10000 });
    await titleField.fill('Published Dependent');
    
    const prereqSelect = page.locator('select[name="prerequisiteConceptIds"]');
    await prereqSelect.selectOption({ label: /Draft Prereq/i });
    
    // 4. Try to PUBLISH
    await page.getByRole('button', { name: /Publish/i }).first().click();
    
    const errorMsg = page.getByText(/prerequisite.*is a draft/i);
    const isErrorVisible = await errorMsg.isVisible().catch(() => false);
    
    if (!isErrorVisible) {
      console.log('❌ BUG FOUND: "Published Dependent" was allowed to be published while depending on a draft concept.');
    } else {
      console.log('✅ Draft leakage prevented successfully');
    }
    
    await expect(errorMsg).toBeVisible({ timeout: 2000 }).catch(() => {
       throw new Error("REPRODUCTION: Draft leakage was NOT prevented by the system.");
    });
  });

  test('Critical Fix 3: Stale Closure Table on Publish', async ({ page }) => {
    // 1. Note the number of "Live concepts" on the dashboard
    await page.goto('/admin/studio');
    const liveMetric = page.locator('div[role="listitem"]').filter({ hasText: /Live concepts/i });
    await expect(liveMetric).toBeVisible({ timeout: 10000 });
    const initialCountText = await liveMetric.locator('p').nth(1).textContent();
    const initialCount = parseInt(initialCountText || "0");
    console.log(`ℹ️ Initial live concepts: ${initialCount}`);

    // 2. Publish a draft concept
    const projectCard = page.locator('div').filter({ has: page.getByRole('heading', { name: /Grade 12 Mathematics/i }) }).first();
    await projectCard.getByTitle('Open course project').click();
    await page.waitForURL(/\/admin\/studio\/sites\/.+/, { timeout: 10000 });

    await page.getByRole('main').getByRole('link', { name: /New Concept/i }).first().click();
    await page.waitForURL(/\/admin\/studio\/editor\/concept\/.+/, { timeout: 15000 });
    
    await page.locator('input[name="title"]').fill('Closure Test Concept');
    await page.getByRole('button', { name: 'Save Draft' }).click();
    await expect(page.getByText(/Draft saved/i)).toBeVisible({ timeout: 10000 });

    // Now publish it
    await page.getByRole('button', { name: /Publish/i }).first().click();
    await expect(page.getByText(/Published successfully/i)).toBeVisible({ timeout: 10000 });

    // 3. Return to dashboard and check if the count incremented
    await page.goto('/admin/studio');
    const newCountText = await liveMetric.locator('p').nth(1).textContent();
    const newCount = parseInt(newCountText || "0");
    console.log(`ℹ️ New live concepts: ${newCount}`);

    if (newCount !== initialCount + 1) {
      console.log('❌ BUG FOUND: Dashboard "Live concepts" metric did not update after publish.');
    }
    
    expect(newCount).toBe(initialCount + 1);
  });

  test('Critical Fix 4: Atomic Reordering', async ({ page }) => {
    console.log('ℹ️ Testing Atomic Reordering persistence...');
  });
});
