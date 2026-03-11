const ALLOWED_WHEN_EXPIRED_PREFIXES = ['/settings', '/auth', '/onboarding', '/admin'];

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeStatus = (status) => String(status || '').trim().toLowerCase();

export const getSubscriptionExpiryDate = (user) => {
  if (!user) return null;

  const subscription = user.subscription || {};
  return (
    parseDate(subscription.expirationDate) ||
    parseDate(subscription.expiresAt) ||
    parseDate(subscription.endDate) ||
    parseDate(subscription.trialEndsAt) ||
    parseDate(user.trialEndsAt)
  );
};

export const isSubscriptionExpired = (user) => {
  if (!user) return false;

  const subscription = user.subscription || {};
  const status = normalizeStatus(subscription.status);
  const expiryDate = getSubscriptionExpiryDate(user);
  if (expiryDate) {
    return expiryDate.getTime() <= Date.now();
  }

  return status === 'expired' || status === 'inactive' || status === 'cancelled';
};

export const isRouteAllowedWhenExpired = (pathname = '/') => {
  return ALLOWED_WHEN_EXPIRED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
};

export const buildWhatsAppRenewalLink = (phoneNumber, message) => {
  const number = String(phoneNumber || '').replace(/[^\d]/g, '');
  if (!number) return '#';
  const encodedMessage = encodeURIComponent(
    message || 'Hello, my StudyMaster subscription has expired. I want to renew.'
  );
  return `https://wa.me/${number}?text=${encodedMessage}`;
};
