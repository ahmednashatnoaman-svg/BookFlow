import { test, expect } from '@playwright/test';

// Use unique email per test run to avoid conflicts
const testEmail = `e2e+${Date.now()}@bookflow-test.local`;
const testPassword = 'TestPass123!';

test.describe('Authentication flow', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('BookFlow')).toBeVisible();
    await expect(page.getByText('Browse Books')).toBeVisible();
  });

  test('register page renders', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.getByText('Create your account')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('login page renders', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('guest redirected to register from book contact', async ({ page }) => {
    await page.goto('/books');
    // If there are books, try to click the first contact button
    const firstBook = page.locator('a[href^="/books/"]').first();
    if (await firstBook.count() > 0) {
      await firstBook.click();
      // Try to click the contact/request button
      const contactBtn = page.getByRole('button', { name: /contact seller|propose exchange/i });
      if (await contactBtn.count() > 0) {
        await contactBtn.click();
        // Should show login prompt (not redirect, since it's a modal)
        await expect(page.getByText(/sign in|create.*account/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('password mismatch shows error on register', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('input[autocomplete="name"]', 'Test User');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[autocomplete="new-password"]', 'password123');
    await page.locator('input[autocomplete="new-password"]').last().fill('differentpass');
    await page.getByRole('button', { name: /create account/i }).click();
    // Should show error toast
    await expect(page.getByText(/passwords do not match/i)).toBeVisible({ timeout: 5000 });
  });
});
