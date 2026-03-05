import { Platform } from 'react-native';

export const FONTS = {
  mono: Platform.select({ ios: 'Courier New', android: 'monospace', default: '"Courier New", monospace' }),
  monoB: Platform.select({ ios: 'Courier New', android: 'monospace', default: '"Courier New", monospace' }),
} as const;