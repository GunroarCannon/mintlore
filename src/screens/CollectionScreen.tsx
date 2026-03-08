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
  Image,
  ImageBackground,
} from 'react-native';
import { CollectionScreenProps, NFT, Rarity, FilterType, SortBy } from '../types';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { getRarityColor, getTypeColor, shortenAddress, formatSOL } from '../utils/helpers';
import { LedDot } from '../components/LedDot';
import { TypeBadge } from '../components/TypeBadge';
import { NftImage } from '../components/NftImage';
import { audioService } from '../services/audio.service';

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
    audioService.playButtonClick();
    setFavorites(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
  };

  const renderNftCard = ({ item }: { item: NFT }) => {
    const isFav = favorites.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.nftCard, { borderColor: getRarityColor(item.rarity) }]}
        onPress={() => { audioService.playNftClick(); onSelectNft(item); }}
        activeOpacity={0.85}
      >
        <View style={styles.nftCardGlow} />
        <View style={[styles.nftCardHeader, { backgroundColor: getTypeColor(item.type1) + '22' }]}>
          <Text style={styles.nftCardNumber}>
            {item.number === '???' ? 'UNKNOWN' : `#${item.number}`}
          </Text>
          <TouchableOpacity onPress={() => toggleFav(item.id)} style={{ padding: 4 }}>
            <Text style={{ fontSize: 18, color: isFav ? '#FF3B30' : '#444' }}>{isFav ? '♥' : '♡'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.nftCardImageWrap}>
          <NftImage uri={item.image} size={90} type1={item.type1} number={item.number} />
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
            <View>
              <Text style={styles.nftCardPriceLabel}>FLOOR</Text>
              <Text style={styles.nftCardPrice}>{item.floorPrice > 0 ? formatSOL(item.floorPrice) : '---'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.nftCardRankLabel}>RANK</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.nftCardRank}>{item.rank > 0 ? `#${item.rank}` : 'NEW'}</Text>
                {isFav && (
                  <View style={styles.favTag}>
                    <Text style={styles.favTagText}>★</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.rarityStripe, { backgroundColor: getRarityColor(item.rarity) }]} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.collectionScreen}>
      <View style={styles.collectionHeader}>
        <TouchableOpacity onPress={() => { audioService.playButtonClick(); onBack(); }} style={styles.backButton}>
          <Text style={styles.backArrow}>◀ BACK</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.collectionTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>MINTLORE</Text>
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
                {/* Engraved Effect Background */}
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
        keyExtractor={i => i.id}
        renderItem={renderNftCard}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {/* Hexagon Pattern Background */}
            <View style={styles.hexagonGrid}>
              {[...Array(6)].map((_, i) => (
                <Image
                  key={i}
                  source={require('../../assets/hexagon.png')}
                  style={[
                    styles.bgHexagon,
                    {
                      top: 100 + (i * 40),
                      left: 50 + (i * 30),
                      transform: [{ scale: 0.5 + (i * 0.1) }, { rotate: `${i * 45}deg` }]
                    }
                  ]}
                />
              ))}
            </View>

            <ImageBackground
              source={require('../../assets/empty-state.png')}
              style={styles.emptyBgImage}
              imageStyle={{ opacity: 0.35, tintColor: COLORS.dexWhite }}
              resizeMode="contain"
            >
              <View style={styles.emptyContent}>
                <Text style={styles.emptyIcon}>⬡</Text>
                <Text style={styles.emptyText}>
                  NO NFTs DETECTED{'\n'}
                  ON <Text style={{ color: COLORS.solanaGreen }}>MAINNET</Text>
                </Text>
                <Text style={styles.emptySubtext}>
                  {search ? `Searching for "${search}"` : 'Try scanning a different wallet'}
                </Text>
              </View>
            </ImageBackground>
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
    letterSpacing: 3,
    flexShrink: 1,
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
  sortOptionsContainer: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  sortBtnFrame: {
    flex: 1,
    height: 28,
    backgroundColor: '#1A1A1A', // Darker well
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
    borderTopColor: '#111', // Top shadow
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
  nftCardCollection: {
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
    minHeight: 500,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  hexagonGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.25,
  },
  bgHexagon: {
    position: 'absolute',
    width: 60,
    height: 60,
    tintColor: COLORS.dexWhite,
  },
  emptyBgImage: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyIcon: {
    fontSize: 40,
    color: COLORS.solanaGreen,
    marginBottom: 10,
    textShadowColor: COLORS.solanaGreen,
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 0 },
  },
  emptyText: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DDD',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 22,
  },
  emptySubtext: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: '#888',
    marginTop: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});