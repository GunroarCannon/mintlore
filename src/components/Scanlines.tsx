import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ScanlinesProps } from '../types';

export const Scanlines: React.FC<ScanlinesProps> = ({ style }) => (
  <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', opacity: 0.08 }, style]} pointerEvents="none">
    {Array.from({ length: 40 }).map((_, i) => (
      <View key={i} style={{ height: 2, backgroundColor: '#000', marginBottom: 4 }} />
    ))}
  </View>
);