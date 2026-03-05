import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatsBarProps } from '../types';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';

export const StatBar: React.FC<StatsBarProps> = ({ label, value, max = 100 }) => {
  const pct = value / max;
  const barColor = pct > 0.7 ? COLORS.ledGreen : pct > 0.4 ? COLORS.ledYellow : COLORS.ledRed;
  const segmentCount = 20;
  
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
      <View style={styles.statBarOuter}>
        {Array.from({ length: segmentCount }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.statSegment,
              { backgroundColor: i / segmentCount < pct ? barColor : '#333' },
            ]}
          />
        ))}
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: '#999',
    width: 60,
    letterSpacing: 1,
  },
  statBarOuter: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
    height: 12,
  },
  statSegment: {
    flex: 1,
    borderRadius: 1,
  },
  statValue: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.dexBlack,
    fontWeight: 'bold',
    width: 28,
    textAlign: 'right',
  },
});