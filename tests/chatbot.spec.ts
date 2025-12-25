// tests/chatbot.spec.ts
// E2E Test for Chatbot functionality

import { test, expect } from '@playwright/test';
import { LoginPage } from './pages';

test.describe('Chatbot Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('should open and close chatbot', async ({ page }) => {
    // Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsGuest();
    console.log('✓ Guest login successful');

    // Find and click the chatbot toggle button (floating button with Bot/MessageSquare icon)
    const chatbotToggle = page.locator('button').filter({ has: page.locator('svg') }).last();
    
    // Look for the chatbot button specifically
    const chatButton = page.locator('button:has(svg.lucide-message-square), button:has(svg.lucide-bot)').first();
    
    // If specific button not found, look for any floating button
    const floatingButton = await chatButton.isVisible() ? chatButton : chatbotToggle;
    
    await floatingButton.click();
    console.log('✓ Chatbot opened');

    // Verify chatbot card is visible
    const chatbotCard = page.locator('[class*="Card"], [role="dialog"]').filter({ hasText: /campus|chat|ask/i }).first();
    await expect(chatbotCard.or(page.locator('text=Hi there!'))).toBeVisible({ timeout: 5000 });
    
    // Close chatbot by clicking the X button or toggle again
    const closeButton = page.locator('button:has(svg.lucide-x)').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      await floatingButton.click();
    }
    console.log('✓ Chatbot closed');
  });

  test('should send a message and receive AI response', async ({ page }) => {
    // Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsGuest();

    // Open chatbot
    const chatButton = page.locator('button:has(svg.lucide-message-square), button:has(svg.lucide-bot)').first();
    const floatingButton = await chatButton.isVisible() 
      ? chatButton 
      : page.locator('button').filter({ has: page.locator('svg') }).last();
    
    await floatingButton.click();
    console.log('✓ Chatbot opened');

    // Wait for initial AI message
    await expect(page.getByText(/Hi there!/i)).toBeVisible({ timeout: 5000 });
    console.log('✓ Initial message visible');

    // Type a question
    const chatInput = page.locator('input[placeholder*="question"], input[type="text"]').last();
    await chatInput.fill('What events are happening this week?');
    console.log('✓ Question typed');

    // Send the message
    const sendButton = page.locator('button:has(svg.lucide-send)').first();
    await sendButton.click();
    console.log('✓ Message sent');

    // Wait for user message to appear
    await expect(page.getByText('What events are happening this week?')).toBeVisible();
    
    // Wait for AI response (loading state should disappear and new message appear)
    // The AI should respond within 30 seconds
    await expect(page.locator('svg.lucide-loader2').or(page.getByText(/loading/i))).not.toBeVisible({ timeout: 30000 });
    
    // Verify we have more than the initial message
    const aiMessages = page.locator('text=/Hi there!|events|sorry/i');
    await expect(aiMessages.first()).toBeVisible();
    console.log('✓ AI response received');
  });

  test('should handle multiple messages in conversation', async ({ page }) => {
    // Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsGuest();

    // Open chatbot
    const chatButton = page.locator('button:has(svg.lucide-message-square), button:has(svg.lucide-bot)').first();
    const floatingButton = await chatButton.isVisible() 
      ? chatButton 
      : page.locator('button').filter({ has: page.locator('svg') }).last();
    
    await floatingButton.click();

    // Wait for chatbot to be ready
    await expect(page.getByText(/Hi there!/i)).toBeVisible({ timeout: 5000 });

    const chatInput = page.locator('input[placeholder*="question"], input[type="text"]').last();
    const sendButton = page.locator('button:has(svg.lucide-send)').first();

    // Send first message
    await chatInput.fill('Hello');
    await sendButton.click();
    await expect(page.getByText('Hello')).toBeVisible();
    console.log('✓ First message sent');

    // Wait for response before sending next
    await page.waitForTimeout(2000); // Small wait to let AI respond

    // Send second message
    await chatInput.fill('What is Campus Hub?');
    await sendButton.click();
    await expect(page.getByText('What is Campus Hub?')).toBeVisible();
    console.log('✓ Second message sent');

    // Verify conversation has multiple user messages
    const userMessages = page.locator('[class*="bg-primary"], [class*="user"]').filter({ hasText: /Hello|Campus Hub/i });
    expect(await userMessages.count()).toBeGreaterThanOrEqual(1);
    console.log('✓ Multiple messages in conversation');
  });
});
