import { Platform } from 'react-native';

export const Colors = {
  background: '#F5F0EB',
  surface: '#FAFAF8',
  surfaceAlt: '#EBE6E0',
  border: '#DDD8D0',
  borderLight: '#EDE9E3',

  primary: '#2C2417',
  primaryLight: '#4A3D2A',
  accent: '#C8A96E',
  accentLight: '#E8D5A8',
  accentDark: '#A07840',

  textPrimary: '#1A1208',
  textSecondary: '#6B5E4A',
  textMuted: '#9B8E7C',
  textInverse: '#FAFAF8',

  success: '#5A7A5A',
  error: '#8B3A3A',
  warning: '#8B6B3A',
  info: '#3A5A7A',

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(26, 18, 8, 0.5)',
  overlayLight: 'rgba(26, 18, 8, 0.15)',
} as const;

export const Typography = {
  fontSerif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia',
  }),
  fontSans: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }),

  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 34,
  '4xl': 42,

  // Line heights
  lineHeightTight: 1.2,
  lineHeightBase: 1.5,
  lineHeightRelaxed: 1.7,

  // Letter spacing
  trackingTight: -0.5,
  trackingNormal: 0,
  trackingWide: 0.5,
  trackingWidest: 2,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const Radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 20,
  full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;
