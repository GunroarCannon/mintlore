import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RarityBadgeProps, Rarity } from '../types';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';

const getRarityStyles = (rarity: Rarity) => {
  switch (rarity?.toLowerCase()) {
    case 'legendary':
      return {
        borderColor: COLORS.legendary,
        borderWidth: 3,
        backgroundColor: 'rgba(255, 152, 0, 0.15)',
        shadowColor: COLORS.legendary,
        shadowRadius: 8,
        letterSpacing: 4,
        textShadow: true,
      };
    case 'epic':
      return {
        borderColor: COLORS.epic,
        borderWidth: 2.5,
        backgroundColor: 'rgba(156, 39, 176, 0.12)',
        shadowColor: COLORS.epic,
        shadowRadius: 6,
        letterSpacing: 3,
        textShadow: false,
      };
    case 'rare':
      return {
        borderColor: COLORS.rare,
        borderWidth: 2,
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        shadowColor: COLORS.rare,
        shadowRadius: 4,
        letterSpacing: 2,
        textShadow: false,
      };
    case 'uncommon':
      return {
        borderColor: COLORS.uncommon,
        borderWidth: 1.5,
        backgroundColor: 'rgba(76, 175, 80, 0.08)',
        shadowColor: 'transparent',
        shadowRadius: 0,
        letterSpacing: 1.5,
        textShadow: false,
      };
    default:
      return {
        borderColor: COLORS.common,
        borderWidth: 1,
        backgroundColor: 'rgba(168, 168, 168, 0.05)',
        shadowColor: 'transparent',
        shadowRadius: 0,
        letterSpacing: 1,
        textShadow: false,
      };
  }
};

export const RarityBadge: React.FC<RarityBadgeProps> = ({ rarity }) => {
  const settings = getRarityStyles(rarity);

  return (
    <View style={styles.badgeContainer}>
      {/* 3D Base/Shadow */}
      <View style={[
        styles.badgeBase,
        { backgroundColor: settings.borderColor + '44', borderColor: settings.borderColor }
      ]} />

      {/* Main Badge Face */}
      <View style={[
        styles.rarityBadge,
        {
          borderColor: settings.borderColor,
          borderWidth: settings.borderWidth,
          backgroundColor: '#1A1A1A', // Dark physical plate
          shadowColor: settings.shadowColor,
          shadowRadius: settings.shadowRadius,
        }
      ]}>
        {/* Hardware details: Screws in corners */}
        <View style={[styles.screw, { top: 4, left: 4, borderColor: settings.borderColor + '66' }]} />
        <View style={[styles.screw, { top: 4, right: 4, borderColor: settings.borderColor + '66' }]} />
        <View style={[styles.screw, { bottom: 4, left: 4, borderColor: settings.borderColor + '66' }]} />
        <View style={[styles.screw, { bottom: 4, right: 4, borderColor: settings.borderColor + '66' }]} />

        {/* Inner glow/depth */}
        <View style={[styles.glowLayer, { backgroundColor: settings.borderColor + '11' }]} />

        <Text style={[
          styles.rarityText,
          {
            color: settings.borderColor,
            letterSpacing: settings.letterSpacing,
            textShadowColor: settings.textShadow ? settings.borderColor : 'transparent',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 8,
          }
        ]}>
          {rarity?.toUpperCase()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    minWidth: 130,
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  badgeBase: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    bottom: -4,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  rarityBadge: {
    flex: 1,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  glowLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  screw: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    borderWidth: 0.5,
    backgroundColor: '#333',
  },
  rarityText: {
    fontFamily: FONTS.monoB,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});