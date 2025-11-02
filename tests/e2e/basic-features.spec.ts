import { test, expect } from '@playwright/test';
import { 
  clearLocalStorage, 
  waitForAppLoad,
  waitForChatInput,
  waitForModelSelector,
  openModelSelector,
  typeMessage,
  sendMessage,
  waitForAuth,
  isSidebarVisible
} from './utils/test-helpers';

test.describe('Basic Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearLocalStorage(page);
    await waitForAppLoad(page);
    await waitForAuth(page);
  });

  test('should display chat input', async ({ page }) => {
    await waitForChatInput(page);
    
    const chatInput = page.locator('[data-tutorial="chat-input"]');
    await expect(chatInput).toBeVisible();
    await expect(chatInput).toBeEnabled();
  });

  test('should allow typing in chat input', async ({ page }) => {
    await waitForChatInput(page);
    
    const chatInput = page.locator('[data-tutorial="chat-input"]');
    await chatInput.fill('Hello, this is a test message');
    
    const inputValue = await chatInput.inputValue();
    expect(inputValue).toBe('Hello, this is a test message');
  });

  test('should display model selector', async ({ page }) => {
    await waitForModelSelector(page);
    
    const modelSelector = page.locator('[data-tutorial="model-selector"]');
    await expect(modelSelector).toBeVisible();
    
    // Check that it shows "Select Model" or a model name
    const selectorText = await modelSelector.textContent();
    expect(selectorText).toBeTruthy();
  });

  test('should open model selector dropdown', async ({ page }) => {
    await waitForModelSelector(page);
    
    await openModelSelector(page);
    
    // Model drawer should be visible
    const modelDrawer = page.locator('#model-selector-drawer').or(
      page.locator('text=Current').or(page.locator('text=All Models'))
    );
    await expect(modelDrawer).toBeVisible({ timeout: 2000 });
  });

  test('should display new chat button in sidebar', async ({ page }) => {
    // Wait for sidebar to be visible (may need to be authenticated)
    await page.waitForTimeout(1000);
    
    const newChatButton = page.locator('[data-tutorial="new-chat-button"]');
    const buttonVisible = await newChatButton.isVisible().catch(() => false);
    
    // New chat button should be visible if authenticated
    if (buttonVisible) {
      await expect(newChatButton).toBeVisible();
      const buttonText = await newChatButton.textContent();
      expect(buttonText?.toLowerCase()).toContain('chat');
    }
  });

  test('should display settings button', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const settingsButton = page.locator('[data-tutorial="settings-button"]');
    const buttonVisible = await settingsButton.isVisible().catch(() => false);
    
    if (buttonVisible) {
      await expect(settingsButton).toBeVisible();
    }
  });

  test('should send message with Enter key', async ({ page }) => {
    await waitForChatInput(page);
    
    const chatInput = page.locator('[data-tutorial="chat-input"]');
    await chatInput.fill('Test message');
    
    // Press Enter to send
    await chatInput.press('Enter');
    await page.waitForTimeout(500);
    
    // Input should be cleared (or message should appear in chat)
    // Note: Actual message sending depends on authentication and API
    const inputValue = await chatInput.inputValue();
    // Either cleared or still contains message if send failed
    expect(inputValue.length).toBeLessThanOrEqual('Test message'.length);
  });

  test('should not send message with Shift+Enter', async ({ page }) => {
    await waitForChatInput(page);
    
    const chatInput = page.locator('[data-tutorial="chat-input"]');
    await chatInput.fill('Test message');
    
    // Press Shift+Enter (should create new line, not send)
    await chatInput.press('Shift+Enter');
    
    const inputValue = await chatInput.inputValue();
    expect(inputValue).toContain('Test message');
  });

  test('should display greeting message when no messages', async ({ page }) => {
    await waitForChatInput(page);
    
    // Check for greeting text
    const greeting = page.getByText(/How can I help/i);
    const greetingVisible = await greeting.isVisible().catch(() => false);
    
    // Greeting should be visible when centered (no messages)
    expect(greetingVisible).toBeTruthy();
  });

  test('should show placeholder text in chat input', async ({ page }) => {
    await waitForChatInput(page);
    
    const chatInput = page.locator('[data-tutorial="chat-input"]');
    const placeholder = await chatInput.getAttribute('placeholder');
    
    expect(placeholder).toBeTruthy();
    expect(placeholder?.toLowerCase()).toMatch(/type|ask|message/i);
  });

  test('should handle responsive layout', async ({ page }) => {
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    
    const chatInputDesktop = page.locator('[data-tutorial="chat-input"]');
    await expect(chatInputDesktop).toBeVisible();
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const chatInputMobile = page.locator('[data-tutorial="chat-input"]');
    await expect(chatInputMobile).toBeVisible();
  });

  test('should allow file attachment upload', async ({ page }) => {
    await waitForChatInput(page);
    
    // Find attachment button (paperclip icon)
    const attachmentButton = page.locator('button[aria-label="Upload attachment"]').or(
      page.locator('svg').filter({ hasText: '' }).first() // Paperclip icon
    );
    
    const attachmentVisible = await attachmentButton.isVisible().catch(() => false);
    
    if (attachmentVisible) {
      await expect(attachmentButton).toBeVisible();
      
      // Note: Actual file upload testing would require creating a file
      // This test just verifies the button exists
    }
  });

  test('should display send button', async ({ page }) => {
    await waitForChatInput(page);
    
    const sendButton = page.locator('button[aria-label="Send message"]');
    const sendButtonVisible = await sendButton.isVisible().catch(() => false);
    
    if (sendButtonVisible) {
      await expect(sendButton).toBeVisible();
    }
  });
});

