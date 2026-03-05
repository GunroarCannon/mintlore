import { ColorValue } from 'react-native';

export const COLORS = {
  // Pokédex body
  dexRed: '#E3000F',
  dexRedDark: '#A8000B',
  dexRedLight: '#FF3347',
  dexBlack: '#1A1A1A',
  dexGrey: '#2D2D2D',
  dexLightGrey: '#F0F0F0',
  dexWhite: '#FFFFFF',

  // Screen / display
  screenGreen: '#98CB7C',
  screenGreenDark: '#5A8A3C',
  screenGreenLight: '#C6E8A8',
  screenBg: '#8BBD6F',

  // Accent lights
  ledGreen: '#39FF14',
  ledRed: '#FF2020',
  ledYellow: '#FFE500',
  ledBlue: '#00BFFF',

  // Rarity colors
  common: '#A8A8A8',
  uncommon: '#4CAF50',
  rare: '#2196F3',
  epic: '#9C27B0',
  legendary: '#FF9800',

  // Type colors (mapping to Solana NFT traits)
  fire: '#FF6B35',
  water: '#4CC9F0',
  grass: '#52B788',
  electric: '#FFD60A',
  psychic: '#F72585',
  ghost: '#7209B7',
  dragon: '#3A0CA3',
  dark: '#1A1A2E',
  steel: '#8D99AE',
  normal: '#ADB5BD',

  // Solana brand
  solanaPurple: '#9945FF',
  solanaGreen: '#14F195',
} as const;