import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { CollectionScreenProps, NFT, Rarity, FilterType, SortBy } from '../types';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { getRarityColor, getTypeColor, shortenAddress, formatSOL } from '../utils/helpers';
import { LedDot } from '../components/LedDot';
import { TypeBadge } from '../components/TypeBadge';
import { NftImage } from '../components/NftImage';

const { width: SCREEN_W } = Dimensions.get('window');

export const CollectionScreen: React.FC<CollectionScreenProps> = ({ nfts, walletAddress, onSelectNft, onBack }) => {
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('number');
  const [favorites, setFavorites] = useState<string[]>(
    nfts.filter(n => n.isFavorite).map(n => n.id)
  );

  const filters: FilterType[] = ['ALL', 'LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON'];
  const sorts: SortBy[] = ['number', 'rarity', 'floor', 'rank'];

  const rarityOrder: Record<Rarity, number> = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };

  const displayed = useMemo(() => {
    let list = [...nfts];
    if (filter !== 'ALL') {
      const rarityFilter = filter.toLowerCase() as Rarity;
      list = list.filter(n => n.rarity === rarityFilter);
    }
    if (search) {
      list = list.filter(n =>
        n.name.toLowerCase().includes(search.toLowerCase()) ||
        n.collection.toLowerCase().includes(search.toLowerCase())
      );
    }
    list.sort((a, b) => {
      if (sortBy === 'number') return a.number.localeCompare(b.number);
      if (sortBy === 'rarity') return rarityOrder[a.rarity] - rarityOrder[b.rarity];
      if (sortBy === 'floor') return b.floorPrice - a.floorPrice;
      if (sortBy === 'rank') return a.rank - b.rank;
      return 0;
    });
    return list;
  }, [nfts, filter, search, sortBy, rarityOrder]);

  const totalValue = nfts.reduce((s, n) => s + (n.floorPrice || 0), 0);

  const toggleFav = (id: string) => {
    setFavorites(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
  };

  const renderNftCard = ({ item }: { item: NFT }) => {
    const isFav = favorites.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.nftCard, { borderColor: getRarityColor(item.rarity) }]}
        onPress={() => onSelectNft(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.nftCardHeader, { backgroundColor: getTypeColor(item.type1) + '33' }]}>
          <Text style={styles.nftCardNumber}>#{item.number}</Text>
          <TouchableOpacity onPress={() => toggleFav(item.id)} style={{ padding: 4 }}>
            <Text style={{ fontSize: 16 }}>{isFav ? '♥' : '♡'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.nftCardImageWrap}>
          <NftImage uri={item.image} size={80} type1={item.type1} number={item.number} />
          <View style={[styles.rarityGlow, { shadowColor: getRarityColor(item.rarity) }]} />
        </View>

        <View style={styles.nftCardInfo}>
          <Text style={styles.nftCardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.nftCardCollection} numberOfLines={1}>{item.collection}</Text>

          <View style={styles.nftCardTypes}>
            <TypeBadge type={item.type1} />
            {item.type2 && <TypeBadge type={item.type2} />}
          </View>

          <View style={styles.nftCardFooter}>
            <Text style={styles.nftCardPrice}>{formatSOL(item.floorPrice)}</Text>
            <Text style={styles.nftCardRank}>#{item.rank}</Text>
          </View>
        </View>

        <View style={[styles.rarityStripe, { backgroundColor: getRarityColor(item.rarity) }]} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.collectionScreen}>
      <View style={styles.collectionHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backArrow}>◀ BACK</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.collectionTitle}>MINTLORE</Text>
          <Text style={styles.walletChip}>{shortenAddress(walletAddress)}</Text>
        </View>
        <LedDot color={COLORS.ledGreen} size={12} pulsing />
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statChip}>
          <Text style={styles.statChipLabel}>COLLECTED</Text>
          <Text style={styles.statChipValue}>{nfts.length}</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={styles.statChipLabel}>FLOOR VALUE</Text>
          <Text style={[styles.statChipValue, { color: COLORS.solanaGreen }]}>{formatSOL(totalValue)}</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={styles.statChipLabel}>FAVORITES</Text>
          <Text style={[styles.statChipValue, { color: COLORS.ledYellow }]}>{favorites.length}</Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>⌕ </Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="SEARCH NFT OR COLLECTION..."
          placeholderTextColor="#444"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 4 }}>
        {filters.map(f => {
          const isActive = filter === f;
          return (
            <TouchableOpacity
              key={f}
              activeOpacity={0.9}
              onPress={() => setFilter(f)}
              style={styles.filterBtnContainer}
            >
              {/* Button Shadow/Base */}
              <View style={[
                styles.filterBtnBase,
                isActive && styles.filterBtnBaseActive
              ]} />

              {/* Button Face */}
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
        <Text style={styles.sortLabel}>SORT:</Text>
        {sorts.map(s => (
          <TouchableOpacity key={s} onPress={() => setSortBy(s)} style={[styles.sortBtn, sortBy === s && styles.sortBtnActive]}>
            <Text style={[styles.sortBtnText, sortBy === s && { color: COLORS.dexRedLight }]}>{s.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={displayed}
        keyExtractor={i => i.id}
        renderItem={renderNftCard}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>NO NFTs FOUND{'\n'}IN SELECTED FILTER</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  collectionScreen: {
    flex: 1,
    backgroundColor: COLORS.dexRed,
  },
  collectionHeader: {
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
  collectionTitle: {
    fontFamily: FONTS.mono,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dexWhite,
    letterSpacing: 4,
  },
  walletChip: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.dexWhite + 'BB',
    backgroundColor: COLORS.dexBlack + '66',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dexBlack,
    marginHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  searchIcon: {
    fontFamily: FONTS.mono,
    color: '#555',
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.dexWhite,
    paddingVertical: 8,
    letterSpacing: 1,
  },
  filterScroll: {
    marginBottom: 6,
    maxHeight: 46,
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
  filterPillText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: '#888',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  filterPillTextActive: {
    color: COLORS.dexRedLight,
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
  sortBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#333',
  },
  sortBtnActive: {
    borderColor: COLORS.dexRedLight + '88',
    backgroundColor: COLORS.dexBlack,
  },
  sortBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: '#666',
    letterSpacing: 1,
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
    letterSpacing: 1,
  },
  nftCardImageWrap: {
    alignItems: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  rarityGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 0,
  },
  nftCardInfo: {
    padding: 8,
  },
  nftCardName: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.dexWhite,
    letterSpacing: 0.5,
  },
  nftCardCollection: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: '#666',
    marginBottom: 5,
  },
  nftCardTypes: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  nftCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nftCardPrice: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.solanaGreen,
    fontWeight: 'bold',
  },
  nftCardRank: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.ledYellow,
  },
  rarityStripe: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 22,
  },
});