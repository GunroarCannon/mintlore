import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Dimensions,
    ImageBackground,
    ScrollView,
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
        audioService.playButtonClick();
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
                activeOpacity={0.85}
            >
                <View style={styles.nftCardGlow} />
                <View style={[styles.nftCardHeader, { backgroundColor: getTypeColor(nft.type1) + '22' }]}>
                    <Text style={styles.nftCardNumber}>
                        {nft.number === '???' ? 'UNKNOWN' : `#${nft.number}`}
                    </Text>
                    <TouchableOpacity onPress={() => toggleFav(nft.mintAddress)} style={{ padding: 4 }}>
                        <Text style={{ fontSize: 18, color: nft.isFavorite ? '#FF3B30' : '#444' }}>
                            {nft.isFavorite ? '♥' : '♡'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.nftCardImageWrap}>
                    <NftImage uri={nft.image} size={90} type1={nft.type1} number={nft.number} />
                    <View style={[styles.rarityGlow, { shadowColor: getRarityColor(nft.rarity) }]} />
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
                        {nft.type2 && <TypeBadge type={nft.type2} />}
                    </View>

                    <View style={styles.nftCardFooter}>
                        <View>
                            <Text style={styles.nftCardPriceLabel}>SOURCE</Text>
                            <Text style={styles.nftCardPrice}>{source.toUpperCase()}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.nftCardRankLabel}>RANK</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Text style={styles.nftCardRank}>{nft.rank > 0 ? `#${nft.rank}` : 'NEW'}</Text>
                                {nft.isFavorite && (
                                    <View style={styles.favTag}>
                                        <Text style={styles.favTagText}>★</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
                <View style={[styles.rarityStripe, { backgroundColor: getRarityColor(nft.rarity) }]} />
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

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
                contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
            >
                {filters.map(f => {
                    const isActive = filter === f;
                    return (
                        <TouchableOpacity
                            key={f}
                            activeOpacity={0.9}
                            onPress={() => { audioService.playRarityClick(f); setFilter(f); }}
                            style={styles.filterBtnContainer}
                        >
                            <View style={[
                                styles.filterBtnBase,
                                isActive && styles.filterBtnBaseActive
                            ]} />
                            <View style={[
                                styles.filterPill,
                                isActive ? styles.filterPillActive : styles.filterPillInactive,
                                isActive && { transform: [{ translateY: 3 }] }
                            ]}>
                                <Text style={[
                                    styles.filterPillText,
                                    isActive && styles.filterPillTextActive
                                ]}>
                                    {f}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <View style={styles.sortRow}>
                <Text style={styles.sortLabel}>SORT BY:</Text>
                <View style={styles.sortOptionsContainer}>
                    {sorts.map(s => {
                        const isActive = sortBy === s;
                        return (
                            <TouchableOpacity
                                key={s}
                                onPress={() => { audioService.playButtonClick(); setSortBy(s); }}
                                style={[styles.sortBtnFrame, isActive && styles.sortBtnFrameActive]}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.sortBtnEngrave, isActive && styles.sortBtnEngraveActive]} />
                                <View style={[styles.sortBtnFace, isActive && styles.sortBtnFaceActive]}>
                                    <Text style={[styles.sortBtnText, isActive && styles.sortBtnTextActive]}>
                                        {s.toUpperCase()}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
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
    filterPillText: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        color: '#888',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    filterPillTextActive: {
        color: COLORS.ledYellow,
    },
    filterScroll: {
        marginBottom: 6,
        maxHeight: 52,
        zIndex: 20,
    },
    filterBtnContainer: {
        marginRight: 8,
        height: 36,
        justifyContent: 'center',
    },
    filterPill: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 6,
        backgroundColor: '#333',
        borderWidth: 1,
        borderColor: '#444',
        borderTopWidth: 1.5,
        borderTopColor: '#555',
    },
    filterBtnBase: {
        position: 'absolute',
        top: 4,
        left: 0,
        right: 0,
        bottom: -2,
        backgroundColor: '#111',
        borderRadius: 6,
    },
    filterBtnBaseActive: {
        backgroundColor: COLORS.dexRedDark,
    },
    filterPillInactive: {
        backgroundColor: '#2A2A2A',
    },
    filterPillActive: {
        backgroundColor: COLORS.dexRed,
        borderColor: COLORS.dexRedLight,
        borderTopColor: '#FF6B6B',
    },
    sortRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        marginBottom: 8,
        gap: 6,
    },
    sortLabel: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        color: '#888',
        letterSpacing: 1,
    },
    sortOptionsContainer: {
        flexDirection: 'row',
        gap: 8,
        flex: 1,
    },
    sortBtnFrame: {
        flex: 1,
        height: 28,
        backgroundColor: '#1A1A1A',
        borderRadius: 4,
        padding: 1,
        overflow: 'hidden',
    },
    sortBtnFrameActive: {
        borderColor: COLORS.dexRedDark,
    },
    sortBtnEngrave: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
        opacity: 0.5,
    },
    sortBtnEngraveActive: {
        opacity: 0.8,
        backgroundColor: COLORS.dexBlack,
    },
    sortBtnFace: {
        flex: 1,
        backgroundColor: '#222',
        borderRadius: 3,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#111',
        borderLeftWidth: 1,
        borderLeftColor: '#111',
    },
    sortBtnFaceActive: {
        backgroundColor: COLORS.dexBlack,
        borderTopColor: '#000',
        borderLeftColor: '#000',
    },
    sortBtnText: {
        fontFamily: FONTS.mono,
        fontSize: 7.5,
        color: '#555',
        letterSpacing: 0.5,
        fontWeight: 'bold',
    },
    sortBtnTextActive: {
        color: COLORS.dexRedLight,
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
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        borderWidth: 1.5,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    nftCardGlow: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 100,
        height: 100,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 50,
    },
    nftCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    nftCardNumber: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        color: '#AAA',
        letterSpacing: 1,
        fontWeight: 'bold',
    },
    nftCardImageWrap: {
        alignItems: 'center',
        paddingVertical: 12,
        position: 'relative',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    rarityGlow: {
        position: 'absolute',
        width: 90,
        height: 90,
        borderRadius: 45,
        shadowOpacity: 0.5,
        shadowRadius: 25,
        elevation: 0,
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
        padding: 10,
        backgroundColor: '#1A1A1A',
    },
    nftCardName: {
        fontFamily: FONTS.mono,
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.dexWhite,
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    dateLabel: {
        fontFamily: FONTS.mono,
        fontSize: 8,
        color: '#666',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    nftCardTypes: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 10,
        flexWrap: 'wrap',
    },
    nftCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: 8,
    },
    nftCardPriceLabel: {
        fontFamily: FONTS.mono,
        fontSize: 7,
        color: '#555',
        marginBottom: 1,
    },
    nftCardPrice: {
        fontFamily: FONTS.mono,
        fontSize: 11,
        color: COLORS.solanaGreen,
        fontWeight: 'bold',
    },
    nftCardRankLabel: {
        fontFamily: FONTS.mono,
        fontSize: 7,
        color: '#555',
        marginBottom: 1,
        textAlign: 'right',
    },
    nftCardRank: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        color: COLORS.ledYellow,
        fontWeight: 'bold',
    },
    favTag: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
    },
    favTagText: {
        color: 'white',
        fontSize: 8,
        fontWeight: 'bold',
    },
    rarityStripe: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
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
