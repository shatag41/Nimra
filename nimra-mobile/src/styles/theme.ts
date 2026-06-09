export const COLORS = {
  primary: '#00a299',
  primaryRGB: 'rgba(0, 162, 153, 1)',
  primaryLight: 'rgba(0, 162, 153, 0.1)',
  secondary: '#0f172a',
  accent: '#10b981',
  orange: '#f97316',
  orangeLight: 'rgba(249, 115, 22, 0.1)',
  
  // Theme colors
  light: {
    background: '#f8fafc',
    card: '#ffffff',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
  },
  dark: {
    background: '#0b0f19',
    card: '#111827',
    text: '#f8fafc',
    textMuted: '#9ca3af',
    border: '#1f2937',
  }
};

export type ThemeType = 'light' | 'dark';
