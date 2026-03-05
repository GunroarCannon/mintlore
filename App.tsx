import React, { useState, useCallback } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ScreenType, NFT } from './src/types';
import { COLORS } from './src/constants/colors';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { CollectionScreen } from './src/screens/CollectionScreen';
import { DetailScreen } from './src/screens/DetailScreen';

export default function App() {
  const [screen, setScreen] = useState<ScreenType>('SCANNER');
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleScanComplete = useCallback((data: NFT[], addr: string) => {
    setNfts(data);
    setWalletAddress(addr);
    setScreen('COLLECTION');
  }, []);

  const handleSelectNft = useCallback((nft: NFT) => {
    const idx = nfts.findIndex(n => n.id === nft.id);
    setSelectedIndex(idx);
    setSelectedNft(nft);
    setScreen('DETAIL');
  }, [nfts]);

  const handleNext = useCallback(() => {
    const next = (selectedIndex + 1) % nfts.length;
    setSelectedIndex(next);
    setSelectedNft(nfts[next]);
  }, [selectedIndex, nfts]);

  const handlePrev = useCallback(() => {
    const prev = (selectedIndex - 1 + nfts.length) % nfts.length;
    setSelectedIndex(prev);
    setSelectedNft(nfts[prev]);
  }, [selectedIndex, nfts]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.dexRed} />

        {screen === 'SCANNER' && (
          <ScannerScreen onScanComplete={handleScanComplete} />
        )}

        {screen === 'COLLECTION' && (
          <CollectionScreen
            nfts={nfts}
            walletAddress={walletAddress}
            onSelectNft={handleSelectNft}
            onBack={() => setScreen('SCANNER')}
          />
        )}

        {screen === 'DETAIL' && selectedNft && (
          <DetailScreen
            nft={selectedNft}
            onBack={() => setScreen('COLLECTION')}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.dexRed,
  },
});