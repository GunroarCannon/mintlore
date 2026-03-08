import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import { DetailScreenProps, TabType } from '../types';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { getTypeColor, shortenAddress, formatSOL } from '../utils/helpers';
import { TypeBadge } from '../components/TypeBadge';
import { RarityBadge } from '../components/RarityBadge';
import { StatBar } from '../components/StatBar';
import { NftImage } from '../components/NftImage';
import { aiService } from '../services/ai.service';
import { heliusService } from '../services/helius.service';
import { getTypeEffectiveness } from '../utils/matchup';
import { audioService } from '../services/audio.service';
import { Linking } from 'react-native';

export const DetailScreen: React.FC<DetailScreenProps> = ({ nft, onBack, onNext, onPrev }) => {
  const [tab, setTab] = useState<TabType>('ABOUT');
  const entryAnim = useRef(new Animated.Value(0)).current;
  const tabs: TabType[] = ['ABOUT', 'STATS', 'TRAITS', 'MARKET'];

  useEffect(() => {
    Animated.spring(entryAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }).start();
    // Victory sting for rare or above
    const rarityTier = ['rare', 'epic', 'legendary'];
    if (rarityTier.includes(nft.rarity)) {
      audioService.playVictory();
    } else {
      audioService.playNftClick();
    }
  }, [nft, entryAnim]);

  const [description, setDescription] = useState(nft.description);
  const [loadingDesc, setLoadingDesc] = useState(false);
  const [rarityData, setRarityData] = useState({ rarity: nft.rarity, rank: nft.rank });
  const [loadingRarity, setLoadingRarity] = useState(false);
  const [marketData, setMarketData] = useState({ floorPrice: nft.floorPrice, lastSale: nft.lastSale });
  const [loadingMarket, setLoadingMarket] = useState(false);

  useEffect(() => {
    // Reset local state for the new NFT immediately
    setDescription(nft.description);
    setRarityData({ rarity: nft.rarity, rank: nft.rank });
    setMarketData({ floorPrice: nft.floorPrice, lastSale: nft.lastSale });
    setLoadingDesc(false);
    setLoadingRarity(false);
    setLoadingMarket(false);

    const fetchLazyData = async () => {
      // 1. Fetch AI Description
      if (nft.description === 'No description available' || nft.description.length < 50) {
        setLoadingDesc(true);
        console.log(`[DetailScreen] Syncing AI Insights for ${nft.name}`);
        const aiDesc = await aiService.getNFTDescription(
          nft.name,
          nft.type1,
          nft.type2,
          nft.rarity,
          nft.description
        );
        setDescription(aiDesc);
        setLoadingDesc(false);
      }

      // 2. Fetch Rarity & Rank (Lazy Load)
      if (nft.rank === 0 || nft.collection !== 'Unknown Collection') {
        setLoadingRarity(true);
        console.log(`[DetailScreen] Validating Scarcity for ${nft.name}`);
        const result = await heliusService.calculateRarityForNft(nft);
        setRarityData(result);
        setLoadingRarity(false);
      }

      // 3. Fetch Market Data (Lazy Load)
      if (nft.floorPrice === 0 || nft.lastSale === 0) {
        setLoadingMarket(true);
        console.log(`[DetailScreen] Analyzing Market Dynamics for ${nft.name}`);
        const mData = await heliusService.getMarketData(nft.mintAddress);
        setMarketData(mData);
        setLoadingMarket(false);
      }
    };
    fetchLazyData();
  }, [nft.id]); // Key on nft.id for stability

  const renderTab = () => {
    switch (tab) {
      case 'ABOUT':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>MINT ADDR</Text>
              <Text style={styles.aboutValue}>{shortenAddress(nft.mintAddress)}</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>COLLECTION</Text>
              <Text style={styles.aboutValue}>{nft.collection}</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>SUPPLY</Text>
              <Text style={styles.aboutValue}>{nft.totalSupply.toLocaleString()}</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>RANK</Text>
              <Text style={[styles.aboutValue, { color: COLORS.ledYellow }]}>
                {loadingRarity ? 'VALIDATING...' : rarityData.rank > 0 ? `#${rarityData.rank} / ${nft.totalSupply}` : 'UNRANKED'}
              </Text>
            </View>
            <View style={styles.dividerLine} />
            <Text style={styles.sectionTitle}>BIOSYNC DESCRIPTION</Text>
            {loadingDesc ? (
              <View style={styles.descLoading}>
                <Text style={styles.descLoadingText}>SYNCING WITH GLOBAL DATABASE...</Text>
              </View>
            ) : (
              <Text style={styles.descText}>{description}</Text>
            )}
            <View style={styles.dividerLine} />
            <Text style={styles.sectionTitle}>ABILITIES</Text>
            {nft.abilities.map((a, i) => (
              <View key={i} style={styles.abilityRow}>
                <View style={styles.abilityDot} />
                <Text style={styles.abilityText}>{a}</Text>
              </View>
            ))}
            <View style={styles.dividerLine} />
            <Text style={styles.sectionTitle}>EVOLUTION LINE</Text>
            <View style={styles.evolutionRow}>
              {nft.evolution.map((e, i) => (
                <React.Fragment key={i}>
                  <View style={[styles.evoChip, e === nft.name && styles.evoChipActive]}>
                    <Text style={[styles.evoText, e === nft.name && { color: COLORS.dexWhite }]}>{e}</Text>
                  </View>
                  {i < nft.evolution.length - 1 && <Text style={styles.evoArrow}>▶</Text>}
                </React.Fragment>
              ))}
            </View>
          </ScrollView>
        );

      case 'STATS':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>BASE STATS</Text>
            {nft.attributes.map((attr, i) => {
              const isNumeric = attr.value > 0 || !isNaN(Number(attr.displayValue));
              if (isNumeric) {
                return <StatBar key={i} label={attr.trait} value={attr.value || Number(attr.displayValue)} max={attr.max} />;
              }
              return (
                <View key={i} style={styles.aboutRow}>
                  <Text style={styles.aboutLabel}>{attr.trait.toUpperCase()}</Text>
                  <Text style={styles.aboutValue}>{attr.displayValue || attr.value}</Text>
                </View>
              );
            })}
            <View style={styles.dividerLine} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL POWER</Text>
              <Text style={styles.totalValue}>
                {nft.attributes.reduce((s, a) => s + a.value, 0)} / {nft.attributes.reduce((s, a) => s + a.max, 0)}
              </Text>
            </View>
            <View style={styles.dividerLine} />
            <Text style={styles.sectionTitle}>TYPE MATCHUPS</Text>
            <View style={styles.matchupGrid}>
              <View style={styles.matchupCol}>
                <Text style={styles.matchupLabel}>EFFECTIVE VS</Text>
                <View style={styles.badgeRow}>
                  {getTypeEffectiveness(nft.type1, nft.type2).strengths.map(t => (
                    <View key={t} style={[styles.miniBadge, { backgroundColor: getTypeColor(t) }]}>
                      <Text style={styles.miniBadgeText}>{t.toUpperCase()}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.matchupCol}>
                <Text style={styles.matchupLabel}>WEAK AGAINST</Text>
                <View style={styles.badgeRow}>
                  {getTypeEffectiveness(nft.type1, nft.type2).weaknesses.map(t => (
                    <View key={t} style={[styles.miniBadge, { backgroundColor: getTypeColor(t) }]}>
                      <Text style={styles.miniBadgeText}>{t.toUpperCase()}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        );

      case 'TRAITS':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>ON-CHAIN TRAITS</Text>
            <View style={styles.traitsGrid}>
              {nft.attributes.map((attr, i) => {
                return (
                  <View key={i} style={styles.traitCard}>
                    <Text style={styles.traitLabel}>{attr.trait.toUpperCase()}</Text>
                    <Text style={styles.traitValue}>{attr.displayValue || attr.value}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        );

      case 'MARKET':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>MARKET DATA</Text>
            <View style={styles.marketCard}>
              <View style={styles.marketRow}>
                <Text style={styles.marketLabel}>FLOOR PRICE</Text>
                <Text style={[styles.marketValue, { color: COLORS.solanaGreen }]}>
                  {loadingMarket ? 'SYNCING...' : marketData.floorPrice > 0 ? formatSOL(marketData.floorPrice) : '---'}
                </Text>
              </View>
              <View style={styles.marketRow}>
                <Text style={styles.marketLabel}>LAST SALE</Text>
                <Text style={styles.marketValue}>
                  {loadingMarket ? 'SYNCING...' : marketData.lastSale > 0 ? formatSOL(marketData.lastSale) : '---'}
                </Text>
              </View>
              <View style={styles.marketRow}>
                <Text style={styles.marketLabel}>COLLECTION RANK</Text>
                <Text style={[styles.marketValue, { color: COLORS.ledYellow }]}>#{nft.rank}</Text>
              </View>
              <View style={styles.marketRow}>
                <Text style={styles.marketLabel}>TOTAL SUPPLY</Text>
                <Text style={styles.marketValue}>{nft.totalSupply.toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.dividerLine} />
            <Text style={styles.sectionTitle}>MARKET TRENDS (30D)</Text>
            <View style={styles.chartPlaceholder}>
              {!marketData.floorPrice && !loadingMarket && (
                <Text style={styles.placeholderNote}>NO MARKET DATA DETECTED FOR THIS ASSET</Text>
              )}
              {loadingMarket && (
                <Text style={styles.placeholderNote}>SYNCING WITH GLOBAL MARKETPLACES...</Text>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 60, marginTop: 12, gap: 4 }}>
                {[8, 5, 9, 7, 11, 10, 12, 9, 13, 12, 11, 12.5].map((v, i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      height: (v / 13) * 56,
                      backgroundColor: i === 11 ? COLORS.solanaGreen : COLORS.dexGrey,
                      borderRadius: 2,
                    }}
                  />
                ))}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={styles.chartAxisLabel}>30D AGO</Text>
                <Text style={[styles.chartAxisLabel, { fontStyle: 'italic', opacity: 0.5 }]}>[DATA SIMULATED]</Text>
                <Text style={styles.chartAxisLabel}>TODAY</Text>
              </View>
            </View>
            <View style={styles.dividerLine} />
            <TouchableOpacity
              style={styles.marketActionBtn}
              onPress={() => {
                audioService.playButtonClick();
                Linking.openURL(`https://magiceden.io/item-details/${nft.mintAddress}`);
              }}
            >
              <Text style={styles.marketActionText}>⬡ VIEW ON MAGIC EDEN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.marketActionBtn, { backgroundColor: '#1A1A1A', borderColor: COLORS.solanaGreen, marginTop: 8 }]}
              onPress={() => {
                audioService.playButtonClick();
                Linking.openURL(`https://www.tensor.trade/item/${nft.mintAddress}`);
              }}
            >
              <Text style={[styles.marketActionText, { color: COLORS.solanaGreen }]}>◈ VIEW ON TENSOR</Text>
            </TouchableOpacity>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <Animated.View
      style={[styles.detailScreen, { opacity: entryAnim, transform: [{ scale: entryAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}
    >
      <View style={[styles.detailTopStrip, { backgroundColor: getTypeColor(nft.type1) }]}>
        <View style={styles.detailTopRow}>
          <TouchableOpacity onPress={() => { audioService.playButtonClick(); onBack(); }} style={styles.backButton}>
            <Text style={[styles.backArrow, { color: COLORS.dexWhite }]}>◀</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: 8 }}>
            <Text style={styles.detailName} numberOfLines={2}>{nft.name}</Text>
            <Text style={styles.detailNumber}>{nft.number === '???' ? 'UNKNOWN' : `#${nft.number}`}</Text>
          </View>
          <RarityBadge rarity={nft.rarity} />
        </View>

        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, paddingHorizontal: 16 }}>
          <TypeBadge type={nft.type1} />
          {nft.type2 && <TypeBadge type={nft.type2} />}
        </View>
      </View>

      <View style={styles.detailImageFloat}>
        <NftImage uri={nft.image} size={140} type1={nft.type1} number={nft.number} />
      </View>

      <View style={styles.detailCard}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => { audioService.playButtonClick(); onPrev(); }} style={styles.navBtn}>
            <Text style={styles.navBtnText}>◀ PREV</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => { audioService.playButtonClick(); onNext(); }} style={styles.navBtn}>
            <Text style={styles.navBtnText}>NEXT ▶</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabRow}>
          {tabs.map(t => (
            <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => {
              if (t === 'MARKET') { audioService.playCoin(); }
              else { audioService.playButtonClick(); }
              setTab(t);
            }}>
              <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContentWrap}>
          {renderTab()}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  detailScreen: {
    flex: 1,
    backgroundColor: COLORS.dexWhite,
  },
  detailTopStrip: {
    paddingTop: 12,
    paddingBottom: 120,
    paddingHorizontal: 16,
    minHeight: 300, // Push the white card lower
  },
  detailTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
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
  detailName: {
    fontFamily: FONTS.mono,
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.dexWhite,
    letterSpacing: 1,
  },
  detailNumber: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.dexWhite + 'CC',
    letterSpacing: 2,
  },
  detailImageFloat: {
    position: 'absolute',
    right: 20,
    top: 120, // Lowered image to align with the higher card
    zIndex: 100, // Highest zIndex
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  detailCard: {
    flex: 1,
    backgroundColor: COLORS.dexWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  navRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  navBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
  },
  navBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: '#666',
    letterSpacing: 1,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#EEE',
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -2,
  },
  tabBtnActive: {
    borderBottomColor: COLORS.dexRed,
  },
  tabBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: '#999',
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  tabBtnTextActive: {
    color: COLORS.dexRed,
  },
  tabContentWrap: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  dividerLine: {
    height: 1,
    backgroundColor: COLORS.dexBlack + '33',
    width: '100%',
    marginVertical: 10,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  aboutLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: '#999',
    letterSpacing: 1,
  },
  aboutValue: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.dexBlack,
    fontWeight: 'bold',
    maxWidth: '55%',
    textAlign: 'right',
  },
  sectionTitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#888',
    letterSpacing: 2,
    marginBottom: 8,
    marginTop: 4,
  },
  descText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: '#444',
    lineHeight: 18,
  },
  abilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  abilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.dexRed,
    marginRight: 8,
  },
  abilityText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.dexBlack,
  },
  evolutionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  evoChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#F5F5F5',
  },
  evoChipActive: {
    backgroundColor: COLORS.dexRed,
    borderColor: COLORS.dexRed,
  },
  evoText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: '#666',
    letterSpacing: 0.5,
  },
  evoArrow: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: '#CCC',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: '#888',
    letterSpacing: 1,
  },
  totalValue: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dexBlack,
  },
  placeholderNote: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: '#CCC',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 4,
    borderStyle: 'dashed',
  },
  traitRow: {
    marginBottom: 8,
  },
  traitCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEE',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  traitLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: '#999',
    letterSpacing: 2,
    marginBottom: 4,
    textAlign: 'center',
  },
  traitValue: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dexBlack,
    textAlign: 'center',
  },
  traitRarity: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.dexRed,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600',
  },
  marketCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE',
    padding: 12,
    marginBottom: 8,
  },
  marketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  marketLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: '#999',
    letterSpacing: 1,
  },
  marketValue: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.dexBlack,
  },
  chartPlaceholder: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  chartAxisLabel: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: '#555',
  },
  marketActionBtn: {
    backgroundColor: COLORS.solanaPurple,
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.solanaPurple,
  },
  marketActionText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.dexWhite,
    letterSpacing: 2,
  },
  descLoading: {
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  descLoadingText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: '#999',
    letterSpacing: 1,
  },
  traitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  matchupGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  matchupCol: {
    flex: 1,
  },
  matchupLabel: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: '#999',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  miniBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  miniBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 7,
    color: COLORS.dexWhite,
    fontWeight: 'bold',
  },
});