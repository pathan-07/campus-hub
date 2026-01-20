// tests/comments.spec.ts
// E2E Test for Comments functionality

import { test, expect } from '@playwright/test';
import { LoginPage, HomePage, EventDetailsPage, CreateEventDialog } from './pages';
import { hasGuestCredentials } from './helpers/auth';

test.skip(
  !hasGuestCredentials,
  'Set GUEST_EMAIL/GUEST_PASSWORD or TEST_EMAIL/TEST_PASSWORD in .env.local to run E2E tests.'
);

test.describe('Comments Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('should add a comment on an event', async ({ page }) => {
    // Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsGuest();
    console.log('✓ Guest login successful');

    // Create an event first
    const homePage = new HomePage(page);
    await homePage.openCreateEventDialog();
    
    const createDialog = new CreateEventDialog(page);
    await createDialog.fillManually();
    await createDialog.fillEventForm({
      title: 'Comment Test Event',
      description: 'Event to test comments functionality',
      category: 'Tech',
      venue: 'Test Venue',
      city: 'Ahmedabad',
      daysFromNow: 7
    });
    await createDialog.submit();
    console.log('✓ Event created');

    // Navigate to the event
    await homePage.clickEventDiscuss('Comment Test Event');
    console.log('✓ Navigated to event details');

    // Add a comment
    const eventPage = new EventDetailsPage(page);
    const testComment = `Test comment ${Date.now()}`;
    await eventPage.addComment(testComment);
    console.log('✓ Comment added successfully');

    // Verify comment is visible
    await expect(page.getByText(testComment)).toBeVisible();
    console.log('✓ Comment verified on page');
  });
});
