export const guestCredentials = {
  email: process.env.GUEST_EMAIL ?? process.env.TEST_EMAIL ?? '',
  password: process.env.GUEST_PASSWORD ?? process.env.TEST_PASSWORD ?? '',
};

export const hasGuestCredentials = Boolean(
  guestCredentials.email &&
  guestCredentials.password &&
  !guestCredentials.email.includes('your_') &&
  !guestCredentials.password.includes('your_')
);
