import { Rarity, PokemonType } from '../types';
import { COLORS } from '../constants/colors';

export const getRarityColor = (rarity: Rarity): string => {
  const colors: Record<Rarity, string> = {
    common: COLORS.common,
    uncommon: COLORS.uncommon,
    rare: COLORS.rare,
    epic: COLORS.epic,
    legendary: COLORS.legendary,
  };
  return colors[rarity] || COLORS.common;
};

export const getTypeColor = (type: PokemonType): string => {
  return COLORS[type] || COLORS.normal;
};

export const shortenAddress = (addr: string): string =>
  addr ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : '????';

export const formatSOL = (val: number): string => `◎ ${Number(val).toFixed(2)}`;