import { Page, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Selectors
  get postEventButton() {
    return this.page.getByRole('button', { name: /Post Event/i });
  }

  get createEventDialog() {
    return this.page.getByRole('dialog');
  }

  get chatbotButton() {
    return this.page.locator('button[aria-label*="chat"], button:has-text("Ask"), [class*="chatbot"]').first();
  }

  get avatarDropdown() {
    return this.page.locator('header').getByRole('button').first();
  }

  // Actions
  async goto() {
    await this.page.goto('/');
    await expect(this.postEventButton).toBeVisible({ timeout: 10000 });
  }

  async openCreateEventDialog() {
    await this.postEventButton.click();
    await expect(this.createEventDialog).toBeVisible();
  }

  async openAvatarMenu() {
    await this.avatarDropdown.click();
    await expect(this.page.getByRole('menu')).toBeVisible();
  }

  async navigateTo(menuItem: string) {
    await this.openAvatarMenu();
    await this.page.getByRole('menuitem', { name: new RegExp(menuItem, 'i') }).click();
  }

  async findEventCard(eventTitle: string) {
    return this.page.locator('article, [class*="card"]').filter({ hasText: eventTitle }).first();
  }

  async clickEventDiscuss(eventTitle: string) {
    const eventCard = await this.findEventCard(eventTitle);
    await expect(eventCard).toBeVisible({ timeout: 10000 });
    await eventCard.getByRole('link', { name: /Discuss/i }).click();
    await expect(this.page).toHaveURL(/\/events\//, { timeout: 10000 });
  }

  async openChatbot() {
    // Look for chatbot trigger button (floating button or in header)
    const chatButton = this.page.locator('button').filter({ hasText: /chat|ask|help/i }).first();
    if (await chatButton.isVisible()) {
      await chatButton.click();
    }
  }
}
