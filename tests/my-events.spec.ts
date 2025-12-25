// tests/my-events.spec.ts
// E2E Test for My Events page functionality

import { test, expect } from '@playwright/test';
import { LoginPage, HomePage, CreateEventDialog, MyEventsPage, EventDetailsPage } from './pages';

test.describe('My Events Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('should display created events in Created tab', async ({ page }) => {
    // Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsGuest();
    console.log('✓ Guest login successful');

    // Create an event
    const homePage = new HomePage(page);
    await homePage.openCreateEventDialog();
    
    const createDialog = new CreateEventDialog(page);
    await createDialog.fillManually();
    const eventTitle = `My Events Test ${Date.now()}`;
    await createDialog.fillEventForm({
      title: eventTitle,
      description: 'Test event for My Events page',
      category: 'Tech',
      venue: 'Test Venue',
      city: 'Ahmedabad',
      daysFromNow: 7
    });
    await createDialog.submit();
    console.log('✓ Event created');

    // Navigate to My Events page
    await homePage.navigateTo('My Events');
    
    const myEventsPage = new MyEventsPage(page);
    await expect(page).toHaveURL('/my-events', { timeout: 10000 });
    console.log('✓ Navigated to My Events page');

    // Check Created tab
    await myEventsPage.switchToCreatedTab();
    await myEventsPage.verifyEventExists(eventTitle);
    console.log('✓ Event found in Created tab');
  });

  test('should display tickets after RSVP', async ({ page }) => {
    // Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsGuest();
    console.log('✓ Guest login successful');

    // Create and RSVP to an event
    const homePage = new HomePage(page);
    await homePage.openCreateEventDialog();
    
    const createDialog = new CreateEventDialog(page);
    await createDialog.fillManually();
    const eventTitle = `Ticket Test ${Date.now()}`;
    await createDialog.fillEventForm({
      title: eventTitle,
      description: 'Test event for ticket display',
      category: 'Workshop',
      venue: 'Workshop Hall',
      city: 'Ahmedabad',
      daysFromNow: 14
    });
    await createDialog.submit();
    console.log('✓ Event created');

    // Navigate to event and RSVP
    await homePage.clickEventDiscuss(eventTitle);
    
    const eventPage = new EventDetailsPage(page);
    await eventPage.rsvp();
    await eventPage.closeQrDialog();
    console.log('✓ RSVP completed');

    // Navigate to My Events and check Tickets tab
    await homePage.goto();
    await homePage.navigateTo('My Events');
    
    const myEventsPage = new MyEventsPage(page);
    await myEventsPage.switchToTicketsTab();
    await myEventsPage.verifyEventExists(eventTitle);
    console.log('✓ Ticket found in Tickets tab');
  });

  test('should switch between tabs correctly', async ({ page }) => {
    // Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsGuest();

    // Navigate to My Events
    const homePage = new HomePage(page);
    await homePage.navigateTo('My Events');
    
    const myEventsPage = new MyEventsPage(page);
    await expect(page).toHaveURL('/my-events', { timeout: 10000 });

    // Test tab switching
    await myEventsPage.switchToTicketsTab();
    console.log('✓ Switched to Tickets tab');

    await myEventsPage.switchToCreatedTab();
    console.log('✓ Switched to Created tab');

    await myEventsPage.switchToPastTab();
    console.log('✓ Switched to Past tab');
  });
});
