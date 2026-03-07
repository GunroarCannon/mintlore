import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { QRScanScreenProps, NFT } from '../types';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { Scanlines } from '../components/Scanlines';
import { decode } from 'js-base64';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export const QRScanScreen: React.FC<QRScanScreenProps> = ({ onScanAddress, onImportData, onBack }) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        if (!permission) {
            requestPermission();
        }
    }, [permission]);

    if (!permission) {
        return <View style={styles.container}><Text style={styles.statusText}>Requesting permission...</Text></View>;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.statusText}>No access to camera</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.button}>
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onBack} style={[styles.button, { marginTop: 20 }]}>
                    <Text style={styles.buttonText}>Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);

        try {
            if (data.startsWith('mintlore://share/')) {
                // Handle Lore Import
                const base64Data = data.replace('mintlore://share/', '');
                const jsonStr = decode(base64Data);
                const importedNfts: NFT[] = JSON.parse(jsonStr);
                Alert.alert('LORE DETECTED', `Import ${importedNfts.length} NFTs to your discovery log?`, [
                    { text: 'Cancel', onPress: () => setScanned(false), style: 'cancel' },
                    { text: 'Import', onPress: () => onImportData(importedNfts) },
                ]);
            } else {
                // Handle Wallet Address
                const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
                const addr = data.trim();
                if (base58Regex.test(addr)) {
                    onScanAddress(addr);
                } else {
                    Alert.alert('Invalid QR', 'This does not look like a Solana address or Mintlore share code.', [
                        { text: 'Retry', onPress: () => setScanned(false) }
                    ]);
                }
            }
        } catch (err) {
            console.error('QR Parse Error:', err);
            Alert.alert('Error', 'Failed to parse QR code data.', [
                { text: 'Retry', onPress: () => setScanned(false) }
            ]);
        }
    };

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
            />

            <Scanlines />

            {/* Retro Viewfinder Overlay */}
            <View style={styles.overlay}>
                <View style={styles.topRow}>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Text style={styles.backText}>◀ CANCEL</Text>
                    </TouchableOpacity>
                    <Text style={styles.scanTitle}>OPTIC SCANNER v1.0</Text>
                </View>

                <View style={styles.viewfinderContainer}>
                    <View style={styles.viewfinder}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                        {scanned && (
                            <View style={styles.scanLock}>
                                <Text style={styles.lockText}>[ TARGET LOCKED ]</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.bottomRow}>
                    <Text style={styles.hintText}>POINT AT WALLET QR OR MINTLORE SHARE</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.dexBlack,
    },
    statusText: {
        fontFamily: FONTS.mono,
        color: COLORS.dexWhite,
        textAlign: 'center',
        marginTop: 100,
    },
    button: {
        backgroundColor: COLORS.dexRed,
        padding: 15,
        borderRadius: 8,
        marginHorizontal: 50,
        alignItems: 'center',
    },
    buttonText: {
        fontFamily: FONTS.mono,
        color: COLORS.dexWhite,
        fontWeight: 'bold',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 40,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.dexRed,
    },
    backText: {
        fontFamily: FONTS.mono,
        color: COLORS.dexRed,
        fontSize: 12,
        fontWeight: 'bold',
    },
    scanTitle: {
        fontFamily: FONTS.mono,
        color: COLORS.ledGreen,
        fontSize: 14,
        fontWeight: 'bold',
        textShadowColor: COLORS.ledGreen,
        textShadowRadius: 10,
    },
    viewfinderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewfinder: {
        width: 250,
        height: 250,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: COLORS.ledGreen,
        borderWidth: 4,
    },
    topLeft: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0 },
    topRight: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0 },
    bottomLeft: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0 },
    bottomRight: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0 },
    scanLock: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(57, 255, 20, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    lockText: {
        fontFamily: FONTS.mono,
        color: COLORS.ledGreen,
        fontWeight: 'bold',
        fontSize: 16,
    },
    bottomRow: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    hintText: {
        fontFamily: FONTS.mono,
        color: COLORS.dexWhite + 'AA',
        fontSize: 10,
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
    },
});
