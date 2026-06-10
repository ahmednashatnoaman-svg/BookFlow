import { test, expect } from '@playwright/test';

test.describe('Dashboard (requires auth)', () => {
  test('dashboard redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/auth\/login/, { timeout: 8000 });
  });

  test('list-book redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/list-book');
    await expect(page).toHaveURL(/auth\/login/, { timeout: 8000 });
  });

  test('admin redirects unauthenticated user to admin login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/admin\/login/, { timeout: 8000 });
  });

  test('admin login page renders', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.getByText('Admin Portal')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('admin login rejects non-admin credentials', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', 'notadmin@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid credentials|access denied/i)).toBeVisible({ timeout: 8000 });
  });
});
