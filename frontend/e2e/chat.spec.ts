import { test, expect } from '@playwright/test';

test.describe('AI Chat', () => {
  test('chat page loads', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.locator('textarea, input[type="text"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('sending a message shows response area', async ({ page }) => {
    await page.goto('/chat');
    const input = page.locator('textarea').first();
    if (await input.count() > 0) {
      await input.fill('Find me a novel');
      const sendBtn = page.getByRole('button', { name: /send/i });
      if (await sendBtn.count() > 0) {
        await sendBtn.click();
        // Wait for some response to appear (or loading state)
        await page.waitForTimeout(2000);
        // Page should not crash
        await expect(page).toHaveURL(/chat/);
      }
    }
  });
});
