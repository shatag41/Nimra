export const AUTH_ERROR_MESSAGES = {
  invalidLogin: 'Incorrect email/username or password.',
  duplicateEmail: 'An account already exists with this email address.',
  duplicateMobile: 'An account already exists with this mobile number.',
  invalidEmail: 'Enter a valid email address.',
  invalidMobile: 'Enter a valid mobile number.',
  network: 'Unable to process your request. Please try again.',
} as const;

const asLowerText = (value: unknown) => String(value || '').trim().toLowerCase();

export const isValidEmailAddress = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const isValidMobileNumber = (value: string) =>
  /^[0-9]{10}$/.test(value.trim());

export const normalizeAuthErrorMessage = (
  response: { message?: unknown; code?: unknown; error?: unknown } | null | undefined,
  context: 'login' | 'register' | 'network' = 'login'
) => {
  const code = asLowerText(response?.code);
  const message = asLowerText(response?.message);
  const error = asLowerText(response?.error);
  const combined = `${code} ${message} ${error}`.trim();

  if (context === 'network' || /network|failed to fetch|unable to reach|service unavailable|server|backend failed|google sheets post failed|invalid response|unexpected server response|request failed|connection error|502|503|504/.test(combined)) {
    return AUTH_ERROR_MESSAGES.network;
  }

  if (/mobile|phone/.test(combined) && /already|exists|registered|duplicate|taken/.test(combined)) {
    return AUTH_ERROR_MESSAGES.duplicateMobile;
  }

  if (/email|username|account/.test(combined) && /already|exists|registered|duplicate|taken/.test(combined)) {
    return AUTH_ERROR_MESSAGES.duplicateEmail;
  }

  if (/email/.test(combined) && /invalid|valid|format/.test(combined)) {
    return AUTH_ERROR_MESSAGES.invalidEmail;
  }

  if (/(mobile|phone|10-digit|10 digit)/.test(combined) && /invalid|valid|format|digits/.test(combined)) {
    return AUTH_ERROR_MESSAGES.invalidMobile;
  }

  if (/invalid|incorrect|wrong|unauthorized|not found|password|credential|login/.test(combined)) {
    return AUTH_ERROR_MESSAGES.invalidLogin;
  }

  if (context === 'register') {
    return response?.message ? String(response.message) : AUTH_ERROR_MESSAGES.network;
  }

  return response?.message ? String(response.message) : AUTH_ERROR_MESSAGES.invalidLogin;
};
