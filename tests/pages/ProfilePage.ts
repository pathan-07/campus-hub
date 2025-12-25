import { Page, expect } from '@playwright/test';

export class ProfilePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Selectors
  get displayNameInput() {
    return this.page.locator('input[name="displayName"], input[placeholder*="name"], #displayName').first();
  }

  get bioInput() {
    return this.page.locator('textarea[name="bio"], textarea[placeholder*="bio"], #bio').first();
  }

  get saveButton() {
    return this.page.getByRole('button', { name: /save|update/i }).first();
  }

  get avatarUpload() {
    return this.page.locator('input[type="file"]').first();
  }

  get successToast() {
    return this.page.getByText(/profile updated|saved successfully/i).first();
  }

  // Actions
  async goto() {
    await this.page.goto('/profile');
    await expect(this.page).toHaveURL('/profile', { timeout: 10000 });
  }

  async updateDisplayName(name: string) {
    await expect(this.displayNameInput).toBeVisible({ timeout: 5000 });
    await this.displayNameInput.clear();
    await this.displayNameInput.fill(name);
  }

  async updateBio(bio: string) {
    await expect(this.bioInput).toBeVisible({ timeout: 5000 });
    await this.bioInput.clear();
    await this.bioInput.fill(bio);
  }

  async saveProfile() {
    await this.saveButton.click();
    await expect(this.successToast).toBeVisible({ timeout: 10000 });
  }

  async uploadAvatar(filePath: string) {
    await this.avatarUpload.setInputFiles(filePath);
  }
}
