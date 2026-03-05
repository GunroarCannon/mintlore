import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { ScanBeamProps } from '../types';
import { COLORS } from '../constants/colors';

export const ScanBeam: React.FC<ScanBeamProps> = ({ active }) => {
  const anim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (!active) { 
      anim.setValue(0); 
      return; 
    }
    const loop = Animated.loop(
      Animated.timing(anim, { 
        toValue: 1, 
        duration: 1800, 
        easing: Easing.linear, 
        useNativeDriver: true 
      })
    );
    loop.start();
    return () => loop.stop();
  }, [active, anim]);
  
  const translateY = anim.interpolate({ 
    inputRange: [0, 1], 
    outputRange: [0, 200] 
  });
  
  if (!active) return null;
  
  return (
    <Animated.View
      style={{
        position: 'absolute', 
        left: 0, 
        right: 0, 
        height: 3,
        backgroundColor: COLORS.solanaGreen,
        opacity: 0.8,
        shadowColor: COLORS.solanaGreen,
        shadowOpacity: 1,
        shadowRadius: 10,
        transform: [{ translateY }],
      }}
      pointerEvents="none"
    />
  );
};