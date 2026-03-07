import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Dimensions,
    ImageBackground,
} from 'react-native';
import { DiscoveredScreenProps, NFT, DiscoveredEntry, FilterType, SortBy } from '../types';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { getRarityColor, getTypeColor, shortenAddress, formatSOL } from '../utils/helpers';
import { LedDot } from '../components/LedDot';
import { TypeBadge } from '../components/TypeBadge';
import { NftImage } from '../components/NftImage';
import { discoveryStorage } from '../services/discoveryStorage';
import { audioService } from '../services/audio.service';

const { width: SCREEN_W } = Dimensions.get('window');

export const DiscoveredScreen: React.FC<DiscoveredScreenProps> = ({ onSelectNft, onBack, onShare }) => {
    const [entries, setEntries] = useState<DiscoveredEntry[]>([]);
    const [filter, setFilter] = useState<FilterType>('ALL');
    const [sortBy, setSortBy] = useState<SortBy>('date');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDiscovered();
    }, []);

    const loadDiscovered = async () => {
        setLoading(true);
        const data = await discoveryStorage.getAllDiscovered();
        setEntries(data);
        setLoading(false);
    };

    const toggleFav = async (mintAddress: string) => {
        await discoveryStorage.toggleFavorite(mintAddress);
        loadDiscovered();
    };

    const filters: FilterType[] = ['ALL', 'LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON', 'FAVORITES'];
    const sorts: SortBy[] = ['date', 'rarity', 'rank'];

    const rarityOrder: Record<string, number> = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };

    const displayed = useMemo(() => {
        let list = [...entries];
        if (filter === 'FAVORITES') {
            list = list.filter(e => e.nft.isFavorite);
        } else if (filter !== 'ALL') {
            const rarityFilter = filter.toLowerCase();
            list = list.filter(e => e.nft.rarity === rarityFilter);
        }

        list.sort((a, b) => {
            if (sortBy === 'date') return b.discoveredAt - a.discoveredAt;
            if (sortBy === 'rarity') return rarityOrder[a.nft.rarity] - rarityOrder[b.nft.rarity];
            if (sortBy === 'rank') return a.nft.rank - b.nft.rank;
            return 0;
        });
        return list;
    }, [entries, filter, sortBy]);

    const renderEntryCard = ({ item }: { item: DiscoveredEntry }) => {
        const { nft, source, discoveredAt } = item;
        const dateStr = new Date(discoveredAt).toLocaleDateString();

        return (
            <TouchableOpacity
                style={[styles.nftCard, { borderColor: getRarityColor(nft.rarity) }]}
                onPress={() => { audioService.playNftClick(); onSelectNft(nft); }}
                activeOpacity={0.7}
            >
                <View style={[styles.nftCardHeader, { backgroundColor: getTypeColor(nft.type1) + '33' }]}>
                    <Text style={styles.nftCardNumber}>#{nft.number}</Text>
                    <TouchableOpacity onPress={() => toggleFav(nft.mintAddress)} style={{ padding: 4 }}>
                        <Text style={{ fontSize: 16 }}>{nft.isFavorite ? '♥' : '♡'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.nftCardImageWrap}>
                    <NftImage uri={nft.image} size={80} type1={nft.type1} number={nft.number} />
                    {source === 'qr-share' && (
                        <View style={styles.sourceBadge}>
                            <Text style={styles.sourceBadgeText}>📡 QR</Text>
                        </View>
                    )}
                </View>

                <View style={styles.nftCardInfo}>
                    <Text style={styles.nftCardName} numberOfLines={1}>{nft.name}</Text>
                    <Text style={styles.dateLabel}>{dateStr}</Text>

                    <View style={styles.nftCardTypes}>
                        <TypeBadge type={nft.type1} />
                    </View>

                    <View style={styles.nftCardFooter}>
                        <Text style={styles.nftCardRank}>RANK #{nft.rank}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => { audioService.playButtonClick(); onBack(); }} style={styles.backButton}>
                    <Text style={styles.backArrow}>◀ </Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.title}>DISCOVERED LOG</Text>
                    <Text style={styles.subtitle}>OFFLINE POKÉDEX CACHE</Text>
                </View>
                <TouchableOpacity onPress={() => { audioService.playButtonClick(); onShare(); }} style={styles.shareButton}>
                    <Text style={styles.shareIcon}>◈ SHARE</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.statsBar}>
                <View style={styles.statChip}>
                    <Text style={styles.statChipLabel}>SEEN</Text>
                    <Text style={styles.statChipValue}>{entries.length}</Text>
                </View>
                <View style={styles.statChip}>
                    <Text style={styles.statChipLabel}>LAST SCAN</Text>
                    <Text style={[styles.statChipValue, { fontSize: 10 }]}>
                        {entries.length > 0 ? new Date(entries[0].discoveredAt).toLocaleDateString() : 'NEVER'}
                    </Text>
                </View>
            </View>

            <View style={styles.filterRow}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={filters}
                    keyExtractor={f => f}
                    renderItem={({ item: f }) => {
                        const isActive = filter === f;
                        return (
                            <TouchableOpacity
                                onPress={() => setFilter(f)}
                                style={[styles.filterPill, isActive && styles.filterPillActive]}
                            >
                                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>{f}</Text>
                            </TouchableOpacity>
                        );
                    }}
                    contentContainerStyle={{ paddingHorizontal: 14 }}
                />
            </View>

            <FlatList
                style={{ flex: 1 }}
                data={displayed}
                keyExtractor={i => i.nft.mintAddress}
                renderItem={renderEntryCard}
                numColumns={2}
                columnWrapperStyle={styles.gridRow}
                contentContainerStyle={styles.gridContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>⬡</Text>
                        <Text style={styles.emptyText}>LOG EMPTY</Text>
                        <Text style={styles.emptySubtext}>SCAN A WALLET OR QR CODE TO DISCOVER NFTS</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.dexRed,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: 10,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        fontFamily: FONTS.mono,
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.dexWhite,
        letterSpacing: 2,
    },
    subtitle: {
        fontFamily: FONTS.mono,
        fontSize: 8,
        color: COLORS.ledGreen,
        letterSpacing: 1,
    },
    backButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    backArrow: {
        fontFamily: FONTS.mono,
        color: COLORS.dexWhite,
        fontSize: 13,
        fontWeight: 'bold',
    },
    shareButton: {
        backgroundColor: COLORS.dexBlack,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.ledBlue,
    },
    shareIcon: {
        fontFamily: FONTS.mono,
        color: COLORS.ledBlue,
        fontSize: 10,
        fontWeight: 'bold',
    },
    statsBar: {
        flexDirection: 'row',
        backgroundColor: COLORS.dexBlack + 'BB',
        marginHorizontal: 14,
        borderRadius: 6,
        paddingVertical: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.dexRedDark,
    },
    statChip: {
        flex: 1,
        alignItems: 'center',
    },
    statChipLabel: {
        fontFamily: FONTS.mono,
        fontSize: 8,
        color: COLORS.dexWhite + '77',
        letterSpacing: 1,
    },
    statChipValue: {
        fontFamily: FONTS.mono,
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.dexWhite,
    },
    filterRow: {
        marginBottom: 8,
    },
    filterPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        backgroundColor: COLORS.dexBlack,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    filterPillActive: {
        borderColor: COLORS.ledYellow,
        backgroundColor: '#333',
    },
    filterPillText: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        color: '#888',
        fontWeight: 'bold',
    },
    filterPillTextActive: {
        color: COLORS.ledYellow,
    },
    gridRow: {
        justifyContent: 'space-between',
        paddingHorizontal: 14,
    },
    gridContent: {
        paddingBottom: 20,
        gap: 10,
    },
    nftCard: {
        width: (SCREEN_W - 38) / 2,
        backgroundColor: COLORS.dexBlack,
        borderRadius: 8,
        borderWidth: 2,
        overflow: 'hidden',
        position: 'relative',
    },
    nftCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    nftCardNumber: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        color: '#888',
    },
    nftCardImageWrap: {
        alignItems: 'center',
        paddingVertical: 8,
        position: 'relative',
    },
    sourceBadge: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: COLORS.ledBlue,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    sourceBadgeText: {
        fontFamily: FONTS.mono,
        fontSize: 7,
        color: COLORS.dexWhite,
        fontWeight: 'bold',
    },
    nftCardInfo: {
        padding: 8,
    },
    nftCardName: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.dexWhite,
    },
    dateLabel: {
        fontFamily: FONTS.mono,
        fontSize: 8,
        color: '#666',
        marginBottom: 4,
    },
    nftCardTypes: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 6,
    },
    nftCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    nftCardRank: {
        fontFamily: FONTS.mono,
        fontSize: 8,
        color: COLORS.ledYellow,
    },
    emptyContainer: {
        flex: 1,
        minHeight: 400,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIcon: {
        fontSize: 40,
        color: '#333',
        marginBottom: 10,
    },
    emptyText: {
        fontFamily: FONTS.mono,
        fontSize: 16,
        color: '#444',
        fontWeight: 'bold',
    },
    emptySubtext: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        color: '#333',
        textAlign: 'center',
        marginTop: 10,
    }
});
