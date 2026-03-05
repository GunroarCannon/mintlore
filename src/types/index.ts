import { ViewStyle } from 'react-native';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type PokemonType = 'fire' | 'water' | 'grass' | 'electric' | 'psychic' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'normal';
export type TabType = 'ABOUT' | 'STATS' | 'TRAITS' | 'MARKET';
export type ScreenType = 'SCANNER' | 'COLLECTION' | 'DETAIL';
export type SortBy = 'number' | 'rarity' | 'floor' | 'rank';
export type FilterType = 'ALL' | 'LEGENDARY' | 'EPIC' | 'RARE' | 'UNCOMMON' | 'COMMON';

export interface Attribute {
  trait: string;
  value: number;
  max: number;
}

export interface NFT {
  id: string;
  mintAddress: string;
  name: string;
  collection: string;
  image: string | null;
  rarity: Rarity;
  type1: PokemonType;
  type2?: PokemonType;
  number: string;
  description: string;
  attributes: Attribute[];
  floorPrice: number;
  lastSale: number;
  holderCount: number;
  totalSupply: number;
  rank: number;
  evolution: string[];
  abilities: string[];
  owner: string;
  isFavorite: boolean;
}

export interface StatsBarProps {
  label: string;
  value: number;
  max?: number;
}

export interface LedDotProps {
  color?: string;
  size?: number;
  pulsing?: boolean;
}

export interface ScanlinesProps {
  style?: ViewStyle;
}

export interface TypeBadgeProps {
  type: PokemonType;
}

export interface RarityBadgeProps {
  rarity: Rarity;
}

export interface NftImageProps {
  uri: string | null;
  size?: number;
  type1?: PokemonType;
  number?: string;
}

export interface ScanBeamProps {
  active: boolean;
}

export interface ScannerScreenProps {
  onScanComplete: (nfts: NFT[], address: string) => void;
}

export interface CollectionScreenProps {
  nfts: NFT[];
  walletAddress: string;
  onSelectNft: (nft: NFT) => void;
  onBack: () => void;
}

export interface DetailScreenProps {
  nft: NFT;
  onBack: () => void;
  onNext: () => void;
  onPrev: () => void;
}

// types/index.ts
export interface ScanProgress {
  phase: string;
  current: number;
  total: number;
  percentage: number;
}