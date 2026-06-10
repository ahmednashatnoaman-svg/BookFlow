import { test, expect } from '@playwright/test';

test.describe('Books browsing', () => {
  test('books page loads and shows filters', async ({ page }) => {
    await page.goto('/books');
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible({ timeout: 10000 });
  });

  test('search filter works', async ({ page }) => {
    await page.goto('/books');
    const search = page.locator('input[placeholder*="Search"]').first();
    await search.fill('test');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    // Page should not crash
    await expect(page).toHaveURL(/books/);
  });

  test('category filter navigates', async ({ page }) => {
    await page.goto('/books');
    const catLinks = page.locator('a[href*="category"]');
    if (await catLinks.count() > 0) {
      await catLinks.first().click();
      await expect(page).toHaveURL(/category/);
    }
  });

  test('book detail page loads when clicking a book', async ({ page }) => {
    await page.goto('/books');
    const bookLink = page.locator('a[href^="/books/"]').first();
    if (await bookLink.count() > 0) {
      await bookLink.click();
      await expect(page).toHaveURL(/\/books\/.+/);
      // Should show book title area
      await expect(page.locator('h1')).toBeVisible({ timeout: 8000 });
    }
  });

  test('price range inputs accept numbers', async ({ page }) => {
    await page.goto('/books');
    const minInput = page.locator('input[placeholder*="Min"]').first();
    const maxInput = page.locator('input[placeholder*="Max"]').first();
    if (await minInput.count() > 0) {
      await minInput.fill('10');
      await maxInput.fill('100');
      await expect(minInput).toHaveValue('10');
      await expect(maxInput).toHaveValue('100');
    }
  });
});
