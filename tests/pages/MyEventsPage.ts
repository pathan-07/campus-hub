import { Page, expect } from '@playwright/test';

export class MyEventsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Selectors
  get ticketsTab() {
    return this.page.getByRole('tab', { name: /tickets/i });
  }

  get createdTab() {
    return this.page.getByRole('tab', { name: /created/i });
  }

  get pastTab() {
    return this.page.getByRole('tab', { name: /past/i });
  }

  get eventCards() {
    return this.page.locator('article, [class*="card"]');
  }

  get emptyState() {
    return this.page.getByText(/no events|no tickets|nothing here/i).first();
  }

  // Actions
  async goto() {
    await this.page.goto('/my-events');
    await expect(this.page).toHaveURL('/my-events', { timeout: 10000 });
  }

  async switchToTicketsTab() {
    await this.ticketsTab.click();
    await expect(this.ticketsTab).toHaveAttribute('aria-selected', 'true', { timeout: 5000 });
  }

  async switchToCreatedTab() {
    await this.createdTab.click();
    await expect(this.createdTab).toHaveAttribute('aria-selected', 'true', { timeout: 5000 });
  }

  async switchToPastTab() {
    await this.pastTab.click();
    await expect(this.pastTab).toHaveAttribute('aria-selected', 'true', { timeout: 5000 });
  }

  async verifyEventExists(eventTitle: string) {
    await expect(this.page.getByText(eventTitle).first()).toBeVisible({ timeout: 10000 });
  }

  async getEventCount() {
    return await this.eventCards.count();
  }
}
