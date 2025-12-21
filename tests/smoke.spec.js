const { test, expect } = require("@playwright/test");

test("site loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/.+/);
});
