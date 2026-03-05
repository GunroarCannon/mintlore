import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { ScannerScreenProps } from '../types';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { heliusService } from '../services/helius.service';

import { MOCK_WALLET, MOCK_NFTS } from '../data/mockData';

import { LedDot } from '../components/LedDot';
import { Scanlines } from '../components/Scanlines';
import { ScanBeam } from '../components/ScanBeam';

const { width: SCREEN_W } = Dimensions.get('window');

export const ScannerScreen: React.FC<ScannerScreenProps> = ({ onScanComplete }) => {
  const [walletInput, setWalletInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanPhase, setScanPhase] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("")

  const phases = [
    'INITIALIZING RPC NODE...',
    'CONNECTING TO SOLANA...',
    'READING TOKEN ACCOUNTS...',
    'FETCHING METADATA...',
    'DECODING NFT DATA...',
    'LOADING COLLECTION INFO...',
    'COMPUTING RARITY RANKS...',
    'SCAN COMPLETE!',
  ];

  const placeHolderStartScan = useCallback(async () => {
    const addr = walletInput.trim() || MOCK_WALLET;
    setScanning(true);

    for (let i = 0; i < phases.length; i++) {
      setScanPhase(phases[i]);
      await new Promise(r => setTimeout(r, 400));
    }

    setScanning(false);
    setConnected(true);
    setTimeout(() => onScanComplete(MOCK_NFTS, addr), 600);
  }, [walletInput, onScanComplete]);


  const validateWalletAddress = (address: string): boolean => {
    // Basic Solana address validation (base58, 32-44 chars)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(address.trim());
  };

  const startScan = useCallback(async () => {
    const addr = walletInput.trim();

    if (!addr) {
      setError('Please enter a wallet address');
      return;
    }

    if (!validateWalletAddress(addr)) {
      setError('Invalid Solana wallet address');
      return;
    }

    setError('');
    setScanning(true);
    setScanPhase(phases[0]);

    try {
      // Simulate phases for UX
      for (let i = 0; i < phases.length - 1; i++) {
        setScanPhase(phases[i]);
        await new Promise(r => setTimeout(r, 400));
      }

      // Actual API call
      setScanPhase('FETCHING NFT DATA...');
      const nfts = await heliusService.scanWallet(addr, undefined, true);

      setScanPhase('SCAN COMPLETE!');

      // Small delay for UX
      await new Promise(r => setTimeout(r, 500));

      onScanComplete(nfts, addr);
    } catch (error: any) {
      console.error('Scan failed:', error);
      setError(error.message || 'Failed to scan wallet');
      setScanning(false);
    }
  }, [walletInput, onScanComplete]);



  const scanPressAnim = useRef(new Animated.Value(0)).current;
  const mwaPressAnim = useRef(new Animated.Value(0)).current;

  const animatePress = (anim: Animated.Value, toValue: number) => {
    Animated.spring(anim, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 5,
    }).start();
  };

  return (
    <View style={styles.scannerScreen}>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      <View style={styles.dexHinge} />

      <View style={styles.bigLedRing}>
        <View style={[styles.bigLed, { backgroundColor: connected ? COLORS.ledGreen : scanning ? COLORS.ledYellow : COLORS.ledRed }]}>
          <LedDot color={connected ? COLORS.ledGreen : scanning ? COLORS.ledYellow : COLORS.ledRed} size={30} pulsing={scanning} />
        </View>
      </View>

      <View style={styles.ledRow}>
        <LedDot color={COLORS.ledRed} size={14} />
        <LedDot color={COLORS.ledYellow} size={10} />
        <LedDot color={COLORS.ledGreen} size={10} />
      </View>

      <View style={styles.scanScreen}>
        <Scanlines />
        <ScanBeam active={scanning} />
        <View style={styles.scanScreenInner}>
          <Text style={styles.scanTitle}>MINTLORE{'\n'}SCANNER v1.0</Text>
          <View style={styles.dividerLine} />
          {scanning ? (
            <View style={styles.scanProgress}>
              <ActivityIndicator color={COLORS.ledGreen} size="small" />
              <Text style={styles.scanPhaseText}>{scanPhase}</Text>
              <View style={styles.progressDots}>
                {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                  <View key={i} style={[styles.dot, { backgroundColor: phases.indexOf(scanPhase) >= i ? COLORS.ledGreen : '#333' }]} />
                ))}
              </View>
            </View>
          ) : connected ? (
            <Text style={[styles.scanPhaseText, { color: COLORS.ledGreen }]}>WALLET LINKED ✓</Text>
          ) : (
            <Text style={styles.scanHint}>ENTER WALLET ADDRESS OR CONNECT</Text>
          )}
        </View>
      </View>

      <View style={styles.inputBlock}>
        <Text style={styles.inputLabel}>WALLET ADDR:</Text>
        <TextInput
          style={styles.walletInput}
          value={walletInput}
          onChangeText={setWalletInput}
          placeholder="So1ana...wallet"
          placeholderTextColor="#555"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.buttonRow}>
        <View style={styles.btn3DContainer}>
          <View style={[styles.btn3DBase, { backgroundColor: COLORS.dexRedDark }]} />
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={() => animatePress(scanPressAnim, 4)}
            onPressOut={() => animatePress(scanPressAnim, 0)}
            onPress={startScan}
            disabled={scanning}
            style={{ flex: 1 }}
          >
            <Animated.View style={[
              styles.dexButton,
              styles.dexButtonPrimary,
              { transform: [{ translateY: scanPressAnim }] }
            ]}>
              <Text style={styles.dexButtonText}>{scanning ? 'SCANNING...' : '◉ SCAN WALLET'}</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>

        <View style={styles.btn3DContainer}>
          <View style={[styles.btn3DBase, { backgroundColor: '#111' }]} />
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={() => animatePress(mwaPressAnim, 4)}
            onPressOut={() => animatePress(mwaPressAnim, 0)}
            onPress={() => {
              Alert.alert('CONNECT WALLET', 'Mobile Wallet Adapter integration\n[PLACEHOLDER — install @solana-mobile/wallet-adapter-react]');
            }}
            style={{ flex: 1 }}
          >
            <Animated.View style={[
              styles.dexButton,
              styles.dexButtonSecondary,
              { transform: [{ translateY: mwaPressAnim }] }
            ]}>
              <Text style={[styles.dexButtonText, { color: COLORS.solanaGreen }]}>⬡ CONNECT MWA</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.solanaWatermark}>POWERED BY SOLANA</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  scannerScreen: {
    flex: 1,
    backgroundColor: COLORS.dexRed,
    alignItems: 'center',
    paddingVertical: 12,
  },
  dexHinge: {
    width: 80,
    height: 8,
    backgroundColor: COLORS.dexRedDark,
    borderRadius: 4,
    marginBottom: 12,
  },
  bigLedRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.dexRedDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 3,
    borderColor: COLORS.dexBlack,
  },
  bigLed: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.dexBlack,
  },
  ledRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  scanScreen: {
    width: SCREEN_W - 40,
    height: 180,
    backgroundColor: COLORS.screenBg,
    borderRadius: 8,
    borderWidth: 4,
    borderColor: COLORS.dexBlack,
    overflow: 'hidden',
    marginBottom: 16,
  },
  scanScreenInner: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanTitle: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.screenGreenDark,
    textAlign: 'center',
    letterSpacing: 2,
  },
  dividerLine: {
    height: 1,
    backgroundColor: COLORS.dexBlack + '33',
    width: '100%',
    marginVertical: 10,
  },
  scanProgress: {
    alignItems: 'center',
    gap: 8,
  },
  scanPhaseText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.screenGreenDark,
    textAlign: 'center',
    letterSpacing: 1,
  },
  scanHint: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.screenGreenDark + 'AA',
    textAlign: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inputBlock: {
    width: SCREEN_W - 40,
    marginBottom: 12,
  },
  inputLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.dexWhite + 'AA',
    marginBottom: 4,
    letterSpacing: 1,
  },
  walletInput: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.dexWhite,
    backgroundColor: COLORS.dexBlack,
    borderWidth: 2,
    borderColor: COLORS.dexRedDark,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    letterSpacing: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: SCREEN_W - 40,
    marginBottom: 16,
  },
  btn3DContainer: {
    flex: 1,
    height: 48,
    position: 'relative',
  },
  btn3DBase: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    bottom: -4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.dexBlack,
  },
  dexButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: COLORS.dexBlack,
  },
  dexButtonPrimary: {
    borderColor: COLORS.dexRedLight,
    borderTopWidth: 1,
  },
  dexButtonSecondary: {
    borderColor: COLORS.solanaGreen,
    borderTopWidth: 1,
  },
  dexButtonText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.dexWhite,
    letterSpacing: 1,
  },
  solanaWatermark: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.dexWhite + '55',
    letterSpacing: 2,
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: COLORS.ledRed + '22',
    borderColor: COLORS.ledRed,
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
    width: '100%',
  },
  errorText: {
    fontFamily: FONTS.mono,
    color: COLORS.ledRed,
    fontSize: 11,
    textAlign: 'center',
  }
});