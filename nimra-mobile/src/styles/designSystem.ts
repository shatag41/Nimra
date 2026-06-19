import { StyleSheet, useWindowDimensions } from 'react-native';

export const BREAKPOINTS = {
  mobile: 0,
  tablet: 600,
  laptop: 900,
  desktop: 1200,
} as const;

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const },
  h1: { fontSize: 24, lineHeight: 30, fontWeight: '800' as const },
  h2: { fontSize: 20, lineHeight: 26, fontWeight: '800' as const },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '800' as const },
  body: { fontSize: 14, lineHeight: 21 },
  bodyStrong: { fontSize: 14, lineHeight: 21, fontWeight: '700' as const },
  small: { fontSize: 12, lineHeight: 17 },
  smallStrong: { fontSize: 12, lineHeight: 17, fontWeight: '800' as const },
  micro: { fontSize: 10, lineHeight: 13, fontWeight: '800' as const },
} as const;

export type Breakpoint = 'mobile' | 'tablet' | 'laptop' | 'desktop';

export function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.laptop) return 'laptop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  return 'mobile';
}

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const breakpoint = getBreakpoint(width);
  const isTablet = width >= BREAKPOINTS.tablet;
  const isLaptop = width >= BREAKPOINTS.laptop;
  const isDesktop = width >= BREAKPOINTS.desktop;

  return {
    width,
    height,
    breakpoint,
    isTablet,
    isLaptop,
    isDesktop,
    columns: isDesktop ? 4 : isLaptop ? 3 : isTablet ? 2 : 1,
    gutter: isLaptop ? space[6] : isTablet ? space[5] : space[4],
    pagePadding: isLaptop ? space[8] : isTablet ? space[6] : space[4],
    bottomInset: isTablet ? space[8] : 120,
    maxContentWidth: isDesktop ? 1180 : isLaptop ? 1040 : 760,
  };
}

export const ds = StyleSheet.create({
  page: {
    flex: 1,
  },
  content: {
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: space[4],
    gap: space[3],
  },
  cardLarge: {
    borderWidth: 1,
    borderRadius: radius['2xl'],
    padding: space[5],
    gap: space[4],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[3],
  },
  group: {
    gap: space[2],
  },
  label: {
    ...typography.smallStrong,
  },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    ...typography.body,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  button: {
    minHeight: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[5],
    paddingVertical: space[3],
  },
  buttonText: {
    color: 'white',
    ...typography.bodyStrong,
    fontWeight: '800',
    textAlign: 'center',
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[5],
    paddingVertical: space[3],
  },
  tabButton: {
    minHeight: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[4],
    paddingVertical: space[2],
  },
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: space[3],
    paddingVertical: space[1],
    alignSelf: 'flex-start',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space[6],
    gap: space[4],
  },
});
