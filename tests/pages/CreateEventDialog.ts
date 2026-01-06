import { Page, expect } from '@playwright/test';

export class CreateEventDialog {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Selectors
  get dialog() {
    return this.page.getByRole('dialog');
  }

  get fillManuallyButton() {
    return this.page.getByRole('button', { name: /Fill Form Manually/i });
  }

  get titleInput() {
    return this.page.locator('#title');
  }

  get descriptionInput() {
    return this.page.locator('#description');
  }

  get venueInput() {
    return this.page.locator('#venue');
  }

  get dateInput() {
    return this.page.locator('#date');
  }

  get collegeEventRadio() {
    return this.page.getByLabel('College Event');
  }

  get submitButton() {
    return this.page.getByRole('button', { name: /Post Event/i }).last();
  }

  // Actions
  async fillManually() {
    await this.fillManuallyButton.click();
    await expect(this.titleInput).toBeVisible();
  }

  async selectCategory(category: string) {
    await this.dialog.locator('button[role="combobox"]').first().click();
    await this.page.getByRole('option', { name: category }).click();
  }

  async selectCity(city: string) {
    await this.dialog.locator('button[role="combobox"]').nth(1).click();
    await this.page.getByRole('option', { name: city }).click();
  }

  async fillEventForm(options: {
    title: string;
    description: string;
    category: string;
    venue: string;
    city: string;
    daysFromNow?: number;
  }) {
    await this.collegeEventRadio.click();
    await this.titleInput.fill(options.title);
    await this.descriptionInput.fill(options.description);
    await this.selectCategory(options.category);
    await this.venueInput.fill(options.venue);

    // Set future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + (options.daysFromNow || 7));
    futureDate.setHours(14, 0, 0, 0);
    const dateString = futureDate.toISOString().slice(0, 16);
    await this.dateInput.fill(dateString);

    await this.selectCity(options.city);
  }

  async submit() {
    await this.submitButton.click();
    await expect(this.page.getByText(/Event Created/i).first()).toBeVisible({ timeout: 10000 });
    await expect(this.dialog).not.toBeVisible({ timeout: 5000 });
  }
}
