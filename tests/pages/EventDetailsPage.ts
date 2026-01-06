import { Page, expect } from '@playwright/test';

export class EventDetailsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Selectors
  get rsvpButton() {
    return this.page.getByRole('button', { name: /RSVP & Get Ticket/i });
  }

  get viewTicketButton() {
    return this.page.getByRole('button', { name: /View Ticket/i });
  }

  get qrDialog() {
    return this.page.getByRole('dialog');
  }

  get commentInput() {
    return this.page.locator('textarea[placeholder*="comment"], input[placeholder*="comment"], textarea[name="comment"]').first();
  }

  get commentSubmitButton() {
    return this.page.getByRole('button', { name: /post|send|submit|comment/i }).first();
  }

  get commentsSection() {
    return this.page.locator('[class*="comment"], [data-testid="comments"]').first();
  }

  // Actions
  async goto(eventId: string) {
    await this.page.goto(`/events/${eventId}`);
  }

  async rsvp() {
    await expect(this.rsvpButton).toBeVisible();
    await this.rsvpButton.click();
    await expect(this.qrDialog).toBeVisible({ timeout: 10000 });
  }

  async closeQrDialog() {
    await this.page.keyboard.press('Escape');
    await expect(this.qrDialog).not.toBeVisible({ timeout: 5000 });
  }

  async verifyTicketState() {
    await expect(this.viewTicketButton).toBeVisible({ timeout: 5000 });
  }

  async addComment(commentText: string) {
    // Wait for comment input to be visible
    await expect(this.commentInput).toBeVisible({ timeout: 5000 });
    await this.commentInput.fill(commentText);
    await this.commentSubmitButton.click();
    
    // Verify comment appears
    await expect(this.page.getByText(commentText)).toBeVisible({ timeout: 10000 });
  }

  async viewTicket() {
    await this.viewTicketButton.click();
    await expect(this.qrDialog).toBeVisible({ timeout: 5000 });
  }
}
