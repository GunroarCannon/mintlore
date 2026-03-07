import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ScreenType, NFT } from './src/types';
import { COLORS } from './src/constants/colors';
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

  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider>
        <SafeAreaProvider>
          <SafeAreaView style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.dexRed} />

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
                  // Back to wherever we came from
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
                  // Trigger scan from ScannerScreen logic essentially
                  // but we'll just go back to scanner and let user paste if needed, 
                  // or we could trigger handleScanComplete here if we had a way to trigger executeScan.
                  // For now, let's just use the scanner logic in ScannerScreen.
                  setScreen('SCANNER');
                  // We'll need a way to pass the address back. 
                  // Let's just navigate back and let handleScanComplete be triggered by the user hitting scan.
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