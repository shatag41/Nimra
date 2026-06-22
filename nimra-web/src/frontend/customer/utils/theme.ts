export type AppTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'nimra_theme';
export const LEGACY_THEME_STORAGE_KEY = 'theme';
export const THEME_CHANGE_EVENT = 'nimra-theme-change';

export function getStoredTheme(): AppTheme {
  if (typeof window === 'undefined') return 'light';

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    || window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
  return savedTheme === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme: AppTheme, persist = false) {
  if (typeof document === 'undefined') return;

  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
  document.body?.setAttribute('data-theme', theme);

  if (persist && typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    window.localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent<AppTheme>(THEME_CHANGE_EVENT, { detail: theme }));
  }
}

export function initializeTheme(): AppTheme {
  const theme = getStoredTheme();
  applyTheme(theme);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    window.localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
  }

  return theme;
}
