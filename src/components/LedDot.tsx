import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { LedDotProps } from '../types';
import { COLORS } from '../constants/colors';

export const LedDot: React.FC<LedDotProps> = ({ color = COLORS.ledGreen, size = 12, pulsing = false }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (!pulsing) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulsing, pulse]);
  
  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: pulse,
        shadowColor: color,
        shadowOpacity: 0.9,
        shadowRadius: 6,
        elevation: 4,
      }}
    />
  );
};