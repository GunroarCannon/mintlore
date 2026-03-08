import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, StatusBar, Animated, AppState, BackHandler } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ScreenType, NFT } from './src/types';
import { COLORS } from './src/constants/colors';
import { audioService } from './src/services/audio.service';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { CollectionScreen } from './src/screens/CollectionScreen';
import { DetailScreen } from './src/screens/DetailScreen';
import { DiscoveredScreen } from './src/screens/DiscoveredScreen';
import { QRScanScreen } from './src/screens/QRScanScreen';
import { QRShareScreen } from './src/screens/QRShareScreen';
import { discoveryStorage } from './src/services/discoveryStorage';

// Providers for Solana Mobile
import { ConnectionProvider } from './src/utils/ConnectionProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  const [screen, setScreen] = useState<ScreenType>('SCANNER');
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [discoveredNfts, setDiscoveredNfts] = useState<NFT[]>([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Handle music based on screen and AppState
  useEffect(() => {
    if (screen === 'SCANNER') {
      console.log('[App] Starting music for SCANNER screen');
      audioService.startMusic();
    } else {
      console.log('[App] Stopping music for screen:', screen);
      audioService.stopMusic();
    }
  }, [screen]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState.match(/inactive|background/)) {
        console.log('[App] App moving to background, pausing music');
        audioService.pauseMusic();
      } else if (nextAppState === 'active' && screen === 'SCANNER') {
        console.log('[App] App moving to foreground, resuming music');
        audioService.resumeMusic();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [screen]);

  // Hardware Back Button handler (Android)
  useEffect(() => {
    const onBackPress = () => {
      if (screen === 'SCANNER') {
        return false; // Let the OS handle it (exits app)
      }

      audioService.playButtonClick();

      if (screen === 'DETAIL') {
        const inCurrentCollection = nfts.some(n => n.mintAddress === selectedNft?.mintAddress);
        setScreen(inCurrentCollection ? 'COLLECTION' : 'DISCOVERED');
      } else if (screen === 'QR_SHARE') {
        setScreen('DISCOVERED');
      } else {
        setScreen('SCANNER');
      }

      return true; // Prevent default back behaviour
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [screen, nfts, selectedNft]);

  const handleScanComplete = useCallback(async (data: NFT[], addr: string) => {
    setNfts(data);
    setWalletAddress(addr);

    // Save to discovery storage
    await discoveryStorage.saveDiscovered(data, 'wallet');

    setScreen('COLLECTION');
  }, []);

  const handleImportData = useCallback(async (importedNfts: NFT[]) => {
    await discoveryStorage.saveDiscovered(importedNfts, 'qr-share');
    setScreen('DISCOVERED');
  }, []);

  const handleSelectNft = useCallback((nft: NFT) => {
    // Determine which list we are navigation from
    const list = screen === 'DISCOVERED' ? discoveredNfts : nfts;
    const idx = list.findIndex(n => n.mintAddress === nft.mintAddress);
    setSelectedIndex(idx);
    setSelectedNft(nft);
    setScreen('DETAIL');
  }, [nfts, discoveredNfts, screen]);

  const handleNext = useCallback(() => {
    const list = screen === 'DETAIL' && nfts.find(n => n.mintAddress === selectedNft?.mintAddress) ? nfts : discoveredNfts;
    const next = (selectedIndex + 1) % list.length;
    setSelectedIndex(next);
    setSelectedNft(list[next]);
  }, [selectedIndex, nfts, discoveredNfts, selectedNft]);

  const handlePrev = useCallback(() => {
    const list = screen === 'DETAIL' && nfts.find(n => n.mintAddress === selectedNft?.mintAddress) ? nfts : discoveredNfts;
    const prev = (selectedIndex - 1 + list.length) % list.length;
    setSelectedIndex(prev);
    setSelectedNft(list[prev]);
  }, [selectedIndex, nfts, discoveredNfts, selectedNft]);

  const openDiscovered = useCallback(async () => {
    const data = await discoveryStorage.getAllDiscovered();
    setDiscoveredNfts(data.map(e => e.nft));
    setScreen('DISCOVERED');
  }, []);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset and animate on screen change
    fadeAnim.setValue(0);
    slideAnim.setValue(20);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, [screen]);

  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider>
        <SafeAreaProvider>
          <SafeAreaView style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.dexRed} />

            <Animated.View style={{
              flex: 1,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}>
              {screen === 'SCANNER' && (
                <ScannerScreen
                  onScanComplete={handleScanComplete}
                  onOpenDiscovered={openDiscovered}
                  onOpenQRScan={() => setScreen('QR_SCAN')}
                />
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
                  onBack={() => {
                    const inCurrentCollection = nfts.some(n => n.mintAddress === selectedNft.mintAddress);
                    setScreen(inCurrentCollection ? 'COLLECTION' : 'DISCOVERED');
                  }}
                  onNext={handleNext}
                  onPrev={handlePrev}
                />
              )}

              {screen === 'DISCOVERED' && (
                <DiscoveredScreen
                  onSelectNft={handleSelectNft}
                  onBack={() => setScreen('SCANNER')}
                  onShare={async () => {
                    const data = await discoveryStorage.getAllDiscovered();
                    setDiscoveredNfts(data.map(e => e.nft));
                    setScreen('QR_SHARE');
                  }}
                />
              )}

              {screen === 'QR_SCAN' && (
                <QRScanScreen
                  onScanAddress={(addr) => {
                    setScreen('SCANNER');
                  }}
                  onImportData={handleImportData}
                  onBack={() => setScreen('SCANNER')}
                />
              )}

              {screen === 'QR_SHARE' && (
                <QRShareScreen
                  discoveredNfts={discoveredNfts}
                  onBack={() => setScreen('DISCOVERED')}
                />
              )}
            </Animated.View>
          </SafeAreaView>
        </SafeAreaProvider>
      </ConnectionProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.dexRed,
  },
});