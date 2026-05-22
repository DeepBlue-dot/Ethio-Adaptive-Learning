import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate as admin', async ({ page }) => {
  // Use the admin credentials from the seed file
  const identifier = 'admin';
  const password = 'Admin12345!';

  await page.goto('/login');
  await page.getByLabel(/Email or Username/i).fill(identifier);
  await page.getByLabel(/Password/i).fill(password);
  await page.getByRole('button', { name: /Sign In/i }).click();

  // Wait for the final redirect. Adms usually land on /admin/dashboard
  // We increase the timeout because intermediate redirects (like /app) can take time in dev mode.
  await expect(page).toHaveURL(/.*\/admin\/.*/, { timeout: 15000 });
  
  // Verify we reached a dashboard or portal
  await expect(page.getByText(/Intelligence|Portal|Dashboard/i).first()).toBeVisible();

  await page.context().storageState({ path: authFile });
});
