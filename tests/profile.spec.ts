// tests/profile.spec.ts
// E2E Test for Profile page functionality

import { test, expect } from '@playwright/test';
import { LoginPage, HomePage, ProfilePage } from './pages';

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('should navigate to profile page', async ({ page }) => {
    // Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsGuest();
    console.log('✓ Guest login successful');

    // Navigate to Profile
    const homePage = new HomePage(page);
    await homePage.navigateTo('Profile');
    
    await expect(page).toHaveURL('/profile', { timeout: 10000 });
    console.log('✓ Navigated to Profile page');
  });

  test('should update display name', async ({ page }) => {
    // Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsGuest();

    // Navigate to Profile
    const homePage = new HomePage(page);
    await homePage.navigateTo('Profile');

    // Update profile
    const profilePage = new ProfilePage(page);
    const newName = `Test User ${Date.now()}`;
    await profilePage.updateDisplayName(newName);
    await profilePage.saveProfile();
    console.log('✓ Display name updated');

    // Verify the name was saved (reload page and check)
    await page.reload();
    await expect(profilePage.displayNameInput).toHaveValue(newName, { timeout: 10000 });
    console.log('✓ Display name persisted after reload');
  });

  test('should update bio', async ({ page }) => {
    // Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsGuest();

    // Navigate to Profile
    const homePage = new HomePage(page);
    await homePage.navigateTo('Profile');

    // Update bio
    const profilePage = new ProfilePage(page);
    const newBio = `This is a test bio updated at ${new Date().toISOString()}`;
    await profilePage.updateBio(newBio);
    await profilePage.saveProfile();
    console.log('✓ Bio updated');

    // Verify bio was saved
    await page.reload();
    await expect(profilePage.bioInput).toHaveValue(newBio, { timeout: 10000 });
    console.log('✓ Bio persisted after reload');
  });

  test('should update both display name and bio', async ({ page }) => {
    // Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsGuest();

    // Navigate to Profile
    const homePage = new HomePage(page);
    await homePage.navigateTo('Profile');

    // Update both fields
    const profilePage = new ProfilePage(page);
    const newName = `Full Update User ${Date.now()}`;
    const newBio = 'Testing complete profile update functionality';
    
    await profilePage.updateDisplayName(newName);
    await profilePage.updateBio(newBio);
    await profilePage.saveProfile();
    console.log('✓ Profile updated');

    // Verify both fields were saved
    await page.reload();
    await expect(profilePage.displayNameInput).toHaveValue(newName, { timeout: 10000 });
    await expect(profilePage.bioInput).toHaveValue(newBio, { timeout: 10000 });
    console.log('✓ All profile fields persisted after reload');
  });
});
