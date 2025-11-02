import { Page, expect } from '@playwright/test';

/**
 * Helper functions for Playwright tests
 */

/**
 * Clear localStorage to reset app state
 * Must be called after page navigation to ensure proper origin context
 */
export async function clearLocalStorage(page: Page) {
  // Ensure we're on a page with proper origin before accessing localStorage
  await page.evaluate(() => {
    localStorage.clear();
  });
}

/**
 * Wait for the app to be fully loaded
 */
export async function waitForAppLoad(page: Page) {
  // Wait for auth check to complete
  await page.waitForSelector('body', { state: 'visible' });
  // Wait a bit for React to hydrate
  await page.waitForTimeout(500);
}

/**
 * Wait for chat input to be visible and ready
 */
export async function waitForChatInput(page: Page) {
  await page.waitForSelector('[data-tutorial="chat-input"]', { 
    state: 'visible',
    timeout: 5000 
  });
}

/**
 * Type a message in the chat input
 */
export async function typeMessage(page: Page, message: string) {
  const chatInput = page.locator('[data-tutorial="chat-input"]');
  await chatInput.fill(message);
}

/**
 * Send a message
 */
export async function sendMessage(page: Page, message: string) {
  await typeMessage(page, message);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
}

/**
 * Wait for model selector to be visible
 */
export async function waitForModelSelector(page: Page) {
  await page.waitForSelector('[data-tutorial="model-selector"]', { 
    state: 'visible',
    timeout: 5000 
  });
}

/**
 * Open model selector
 */
export async function openModelSelector(page: Page) {
  const modelSelector = page.locator('[data-tutorial="model-selector"]');
  await modelSelector.click();
  await page.waitForTimeout(500);
}

/**
 * Check if sidebar is visible
 */
export async function isSidebarVisible(page: Page) {
  // Sidebar might have different selectors depending on state
  const sidebar = page.locator('[data-sidebar]').or(page.locator('aside'));
  return await sidebar.isVisible().catch(() => false);
}

/**
 * Wait for authentication to complete
 */
export async function waitForAuth(page: Page) {
  // Wait for auth check indicator to disappear
  await page.waitForFunction(() => {
    const loader = document.querySelector('svg[class*="animate-spin"]');
    return !loader || loader.closest('div')?.textContent !== '';
  }, { timeout: 10000 }).catch(() => {
    // Auth might already be complete
  });
}

/**
 * Wait for topup modal to appear
 */
export async function waitForTopupModal(page: Page, timeout = 5000) {
  await page.waitForSelector('text=Top Up with Lightning⚡', { 
    state: 'visible',
    timeout 
  }).catch(() => {
    // Modal might not appear if balance is not zero or user not authenticated
  });
}

/**
 * Check if topup modal is visible
 */
export async function isTopupModalVisible(page: Page): Promise<boolean> {
  const modalTitle = page.getByText('Top Up with Lightning⚡');
  return await modalTitle.isVisible().catch(() => false);
}

/**
 * Wait for mint to be initialized (sets default mint in localStorage)
 */
export async function ensureMintInitialized(page: Page) {
  await page.evaluate(() => {
    // Set default mint in localStorage (cashu store uses persist middleware)
    const cashuData = localStorage.getItem('cashu');
    const defaultMintUrl = 'https://mint.minibits.cash/Bitcoin';
    
    if (cashuData) {
      try {
        const parsed = JSON.parse(cashuData);
        parsed.state = parsed.state || {};
        
        // Set active mint URL if not already set
        if (!parsed.state.activeMintUrl) {
          parsed.state.activeMintUrl = defaultMintUrl;
        }
        
        // Ensure default mint is in mints array
        if (!parsed.state.mints || !Array.isArray(parsed.state.mints)) {
          parsed.state.mints = [];
        }
        
        const mintExists = parsed.state.mints.some((m: any) => 
          (typeof m === 'string' ? m : m.url) === defaultMintUrl
        );
        
        if (!mintExists) {
          parsed.state.mints.push({ url: defaultMintUrl });
        }
        
        localStorage.setItem('cashu', JSON.stringify(parsed));
      } catch (e) {
        // If parsing fails, create new store structure
        localStorage.setItem('cashu', JSON.stringify({
          state: {
            activeMintUrl: defaultMintUrl,
            mints: [{ url: defaultMintUrl }],
            proofs: [],
            usingNip60: true
          },
          version: 0
        }));
      }
    } else {
      // Create new store structure
      localStorage.setItem('cashu', JSON.stringify({
        state: {
          activeMintUrl: defaultMintUrl,
          mints: [{ url: defaultMintUrl }],
          proofs: [],
          usingNip60: true
        },
        version: 0
      }));
    }
  });
}

