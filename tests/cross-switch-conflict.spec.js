// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Cross-device session conflict tests
 * 
 * Bug: When Device B (Kylee) tries to switch to Yasir who is active on Device A,
 * the conflict overlay was appearing on the WRONG device (Device A instead of B).
 * 
 * Fix: Session gate checks BEFORE switching and shows overlay on attempting device.
 */

test.describe('Cross-device session conflict', () => {
  
  test('Conflict overlay appears only on attempting device', async ({ browser }) => {
    // Create two isolated browser contexts (simulating two devices)
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    
    const deviceA = await contextA.newPage();
    const deviceB = await contextB.newPage();
    
    // Step 1: Device A logs in as Yasir
    await deviceA.goto('/');
    await deviceA.waitForSelector('[data-testid="who-modal"]', { state: 'visible' });
    await deviceA.click('[data-testid="login-yasir"]');
    
    // Wait for login to complete (modal closes)
    await deviceA.waitForSelector('[data-testid="who-modal"]', { state: 'hidden', timeout: 10000 });
    
    // Verify Device A shows Yasir as current user
    await expect(deviceA.locator('[data-testid="current-user"]')).toContainText('YASIR', { timeout: 5000 });
    
    // Step 2: Device B logs in as Kylee
    await deviceB.goto('/');
    await deviceB.waitForSelector('[data-testid="who-modal"]', { state: 'visible' });
    await deviceB.click('[data-testid="login-kylee"]');
    
    // Wait for login to complete
    await deviceB.waitForSelector('[data-testid="who-modal"]', { state: 'hidden', timeout: 10000 });
    
    // Verify Device B shows Kylee as current user
    await expect(deviceB.locator('[data-testid="current-user"]')).toContainText('KYLEE', { timeout: 5000 });
    
    // Wait for presence sync (WebSocket needs time to propagate)
    await deviceA.waitForTimeout(3000);
    await deviceB.waitForTimeout(3000);
    
    // Step 3: Device B tries to switch to Yasir
    await deviceB.click('[data-testid="user-pill"]');
    await deviceB.waitForSelector('[data-testid="who-modal"]', { state: 'visible' });
    await deviceB.click('[data-testid="login-yasir"]');
    
    // Wait for session gate check
    await deviceB.waitForTimeout(2000);
    
    // Step 4: EXPECTATIONS
    
    // Device B should show conflict overlay (it's the attempting device)
    const deviceBOverlay = deviceB.locator('[data-testid="device-conflict-overlay"]');
    await expect(deviceBOverlay).toBeVisible({ timeout: 5000 });
    
    // Device A should NOT show conflict overlay
    const deviceAOverlay = deviceA.locator('[data-testid="device-conflict-overlay"]');
    await expect(deviceAOverlay).not.toBeVisible();
    
    // Device B should still show Kylee as current user (switch was blocked)
    await expect(deviceB.locator('[data-testid="current-user"]')).toContainText('KYLEE');
    
    // Device A should still show Yasir
    await expect(deviceA.locator('[data-testid="current-user"]')).toContainText('YASIR');
    
    // Cleanup
    await contextA.close();
    await contextB.close();
  });

  test('Takeover button successfully switches user', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    
    const deviceA = await contextA.newPage();
    const deviceB = await contextB.newPage();
    
    // Device A logs in as Yasir
    await deviceA.goto('/');
    await deviceA.waitForSelector('[data-testid="who-modal"]', { state: 'visible' });
    await deviceA.click('[data-testid="login-yasir"]');
    await deviceA.waitForSelector('[data-testid="who-modal"]', { state: 'hidden', timeout: 10000 });
    
    // Device B logs in as Kylee
    await deviceB.goto('/');
    await deviceB.waitForSelector('[data-testid="who-modal"]', { state: 'visible' });
    await deviceB.click('[data-testid="login-kylee"]');
    await deviceB.waitForSelector('[data-testid="who-modal"]', { state: 'hidden', timeout: 10000 });
    
    // Wait for sync
    await deviceA.waitForTimeout(3000);
    await deviceB.waitForTimeout(3000);
    
    // Device B tries to switch to Yasir
    await deviceB.click('[data-testid="user-pill"]');
    await deviceB.waitForSelector('[data-testid="who-modal"]', { state: 'visible' });
    await deviceB.click('[data-testid="login-yasir"]');
    
    // Wait for conflict overlay
    await deviceB.waitForSelector('[data-testid="device-conflict-overlay"]', { state: 'visible', timeout: 5000 });
    
    // Click "Use Here Instead" to takeover
    await deviceB.click('[data-testid="takeover-device"]');
    
    // Wait for takeover to complete
    await deviceB.waitForTimeout(3000);
    
    // Device B should now show Yasir
    await expect(deviceB.locator('[data-testid="current-user"]')).toContainText('YASIR', { timeout: 5000 });
    
    // Conflict overlay should be hidden
    await expect(deviceB.locator('[data-testid="device-conflict-overlay"]')).not.toBeVisible();
    
    // Cleanup
    await contextA.close();
    await contextB.close();
  });

  test('Cancel button keeps original user', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    
    const deviceA = await contextA.newPage();
    const deviceB = await contextB.newPage();
    
    // Device A logs in as Yasir
    await deviceA.goto('/');
    await deviceA.waitForSelector('[data-testid="who-modal"]', { state: 'visible' });
    await deviceA.click('[data-testid="login-yasir"]');
    await deviceA.waitForSelector('[data-testid="who-modal"]', { state: 'hidden', timeout: 10000 });
    
    // Device B logs in as Kylee
    await deviceB.goto('/');
    await deviceB.waitForSelector('[data-testid="who-modal"]', { state: 'visible' });
    await deviceB.click('[data-testid="login-kylee"]');
    await deviceB.waitForSelector('[data-testid="who-modal"]', { state: 'hidden', timeout: 10000 });
    
    // Wait for sync
    await deviceA.waitForTimeout(3000);
    await deviceB.waitForTimeout(3000);
    
    // Device B tries to switch to Yasir
    await deviceB.click('[data-testid="user-pill"]');
    await deviceB.waitForSelector('[data-testid="who-modal"]', { state: 'visible' });
    await deviceB.click('[data-testid="login-yasir"]');
    
    // Wait for conflict overlay
    await deviceB.waitForSelector('[data-testid="device-conflict-overlay"]', { state: 'visible', timeout: 5000 });
    
    // Click "Stay as Current" to cancel
    await deviceB.click('[data-testid="switch-user"]');
    
    // Wait for overlay to close
    await deviceB.waitForTimeout(1000);
    
    // Device B should still show Kylee
    await expect(deviceB.locator('[data-testid="current-user"]')).toContainText('KYLEE');
    
    // Conflict overlay should be hidden
    await expect(deviceB.locator('[data-testid="device-conflict-overlay"]')).not.toBeVisible();
    
    // Who modal should also be hidden
    await expect(deviceB.locator('[data-testid="who-modal"]')).not.toBeVisible();
    
    // Cleanup
    await contextA.close();
    await contextB.close();
  });

});