import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { NftImageProps } from '../types';
import { getTypeColor } from '../utils/helpers';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';

export const NftImage: React.FC<NftImageProps> = ({ uri, size = 120, type1 = 'normal', number = '???' }) => {
  const [errored, setErrored] = useState(false);
  const bg = getTypeColor(type1);
  
  if (!uri || errored) {
    return (
      <View style={[styles.nftPlaceholder, { width: size, height: size, backgroundColor: bg + '33' }]}>
        <View style={[styles.pixelMonster, { width: size * 0.6, height: size * 0.6 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: size * 0.15 }}>
            <View style={{ width: size * 0.1, height: size * 0.1, backgroundColor: COLORS.dexBlack, borderRadius: 2 }} />
            <View style={{ width: size * 0.1, height: size * 0.1, backgroundColor: COLORS.dexBlack, borderRadius: 2 }} />
          </View>
          <View style={{ width: size * 0.25, height: size * 0.06, backgroundColor: COLORS.dexBlack, alignSelf: 'center', marginTop: size * 0.1, borderRadius: 2 }} />
        </View>
        <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: bg, marginTop: 4 }}>#{number}</Text>
      </View>
    );
  }
  
  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: 8 }}
      onError={() => setErrored(true)}
    />
  );
};

const styles = StyleSheet.create({
  nftPlaceholder: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  pixelMonster: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});