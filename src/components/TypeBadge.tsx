import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TypeBadgeProps } from '../types';
import { getTypeColor } from '../utils/helpers';
import { FONTS } from '../constants/fonts';
import { COLORS } from '../constants/colors';

export const TypeBadge: React.FC<TypeBadgeProps> = ({ type }) => (
  <View style={[styles.typeBadge, { backgroundColor: getTypeColor(type) }]}>
    <Text style={styles.typeBadgeText}>{type?.toUpperCase()}</Text>
  </View>
);

const styles = StyleSheet.create({
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.dexWhite,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});