import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { QRShareScreenProps } from '../types';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { encode } from 'js-base64';

const { width: SCREEN_W } = Dimensions.get('window');

export const QRShareScreen: React.FC<QRShareScreenProps> = ({ discoveredNfts, onBack }) => {
    const [page, setPage] = React.useState(0);
    const perPage = 10; // mint addresses + short names are small
    const totalPages = Math.ceil(discoveredNfts.length / perPage);

    // Ultra-compact: only share mint address + name
    const pageNfts = discoveredNfts.slice(page * perPage, (page + 1) * perPage);
    const shareData = pageNfts.map(n => ({
        m: n.mintAddress,  // mint address
        n: n.name,          // name
        r: n.rarity[0],     // first letter of rarity (c/u/r/e/l)
    }));

    const jsonStr = JSON.stringify(shareData);
    const base64 = encode(jsonStr);
    const qrValue = `mintlore://share/${base64}`;
    const dataTooBig = qrValue.length > 2900;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backText}>◀ </Text>
                </TouchableOpacity>
                <Text style={styles.title}>TRANSMIT LORE</Text>
            </View>

            <View style={styles.qrContainer}>
                <View style={styles.qrFrame}>
                    <View style={styles.qrInnerFrame}>
                        {dataTooBig ? (
                            <Text style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.dexRed, padding: 20, textAlign: 'center' }}>
                                DATA PACKET TOO LARGE{'\n'}TRY FEWER NFTs
                            </Text>
                        ) : (
                            <QRCode
                                value={qrValue}
                                size={SCREEN_W * 0.6}
                                color={COLORS.dexBlack}
                                backgroundColor={COLORS.dexWhite}
                            />
                        )}
                    </View>
                </View>
                <Text style={styles.payloadInfo}>
                    DATA PACKET: {qrValue.length} BYTES • PAGE {page + 1}/{totalPages}
                </Text>
                <Text style={styles.syncStatus}>
                    [ BROADCASTING {pageNfts.length} NFTs... ]
                </Text>
            </View>

            {totalPages > 1 && (
                <View style={styles.pageRow}>
                    <TouchableOpacity
                        onPress={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        style={[styles.pageBtn, page === 0 && { opacity: 0.3 }]}
                    >
                        <Text style={styles.pageBtnText}>◀ PREV</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page === totalPages - 1}
                        style={[styles.pageBtn, page === totalPages - 1 && { opacity: 0.3 }]}
                    >
                        <Text style={styles.pageBtnText}>NEXT ▶</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>HOW TO SHARE:</Text>
                <Text style={styles.infoText}>
                    1. Ask another trainer to open their SCANNER{'\n'}
                    2. Have them tap 📷 SCAN QR CODE{'\n'}
                    3. Point their camera at this screen{'\n'}
                    {totalPages > 1 ? `4. Repeat for all ${totalPages} pages!` : ''}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.dexRed,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
    },
    backButton: {
        backgroundColor: COLORS.dexBlack,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.dexRedLight,
    },
    backText: {
        fontFamily: FONTS.mono,
        color: COLORS.dexWhite,
        fontSize: 12,
        fontWeight: 'bold',
    },
    title: {
        flex: 1,
        fontFamily: FONTS.mono,
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.dexWhite,
        textAlign: 'center',
        marginRight: 60, // Balance the back button
        letterSpacing: 2,
    },
    qrContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    qrFrame: {
        padding: 15,
        backgroundColor: COLORS.dexBlack,
        borderRadius: 12,
        borderWidth: 4,
        borderColor: COLORS.dexRedDark,
    },
    qrInnerFrame: {
        padding: 10,
        backgroundColor: COLORS.dexWhite,
        borderRadius: 4,
    },
    payloadInfo: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        color: COLORS.dexWhite + 'AA',
        marginTop: 20,
        letterSpacing: 1,
    },
    syncStatus: {
        fontFamily: FONTS.mono,
        fontSize: 12,
        color: COLORS.ledGreen,
        marginTop: 10,
        fontWeight: 'bold',
        textShadowColor: COLORS.ledGreen,
        textShadowRadius: 5,
    },
    infoBox: {
        backgroundColor: COLORS.dexBlack + 'AA',
        padding: 20,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.dexRedDark,
    },
    infoTitle: {
        fontFamily: FONTS.mono,
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.ledYellow,
        marginBottom: 10,
    },
    infoText: {
        fontFamily: FONTS.mono,
        fontSize: 11,
        color: COLORS.dexWhite,
        lineHeight: 18,
    },
    warningText: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        color: COLORS.dexWhite + '66',
        marginTop: 20,
        textAlign: 'center',
    },
    pageRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 20,
    },
    pageBtn: {
        backgroundColor: COLORS.dexBlack,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.dexRedLight,
    },
    pageBtnText: {
        fontFamily: FONTS.mono,
        fontSize: 11,
        color: COLORS.dexWhite,
        fontWeight: 'bold',
    },
});
