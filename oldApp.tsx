// /**
//  * MintLore — Retro Pokédex-style Solana NFT Scanner
//  * A full-featured React Native app that scans Solana wallets for NFTs
//  * and displays them in a retro Pokédex UI.
//  *
//  * PLACEHOLDER comments mark areas where real API/blockchain calls go.
//  */

// import React, {
//   useState,
//   useEffect,
//   useRef,
//   useCallback,
//   useMemo,
// } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   TouchableHighlight,
//   FlatList,
//   ScrollView,
//   TextInput,
//   Modal,
//   Animated,
//   Easing,
//   Dimensions,
//   Platform,
//   StatusBar,
//   Image,
//   ActivityIndicator,
//   Pressable,
//   Alert,
//   Vibration,
//   ViewStyle,
//   TextStyle,
//   ColorValue,
// } from 'react-native';
// import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// // ─── TYPES ────────────────────────────────────────────────────────────────────

// type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
// type PokemonType = 'fire' | 'water' | 'grass' | 'electric' | 'psychic' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'normal';
// type TabType = 'ABOUT' | 'STATS' | 'TRAITS' | 'MARKET';
// type ScreenType = 'SCANNER' | 'COLLECTION' | 'DETAIL';
// type SortBy = 'number' | 'rarity' | 'floor' | 'rank';
// type FilterType = 'ALL' | 'LEGENDARY' | 'EPIC' | 'RARE' | 'UNCOMMON' | 'COMMON';

// interface Attribute {
//   trait: string;
//   value: number;
//   max: number;
// }

// interface NFT {
//   id: string;
//   mintAddress: string;
//   name: string;
//   collection: string;
//   image: string | null;
//   rarity: Rarity;
//   type1: PokemonType;
//   type2?: PokemonType;
//   number: string;
//   description: string;
//   attributes: Attribute[];
//   floorPrice: number;
//   lastSale: number;
//   holderCount: number;
//   totalSupply: number;
//   rank: number;
//   evolution: string[];
//   abilities: string[];
//   owner: string;
//   isFavorite: boolean;
// }

// interface StatsBarProps {
//   label: string;
//   value: number;
//   max?: number;
// }

// interface LedDotProps {
//   color?: string;
//   size?: number;
//   pulsing?: boolean;
// }

// interface ScanlinesProps {
//   style?: ViewStyle;
// }

// interface TypeBadgeProps {
//   type: PokemonType;
// }

// interface RarityBadgeProps {
//   rarity: Rarity;
// }

// interface NftImageProps {
//   uri: string | null;
//   size?: number;
//   type1?: PokemonType;
//   number?: string;
// }

// interface ScanBeamProps {
//   active: boolean;
// }

// interface ScannerScreenProps {
//   onScanComplete: (nfts: NFT[], address: string) => void;
// }

// interface CollectionScreenProps {
//   nfts: NFT[];
//   walletAddress: string;
//   onSelectNft: (nft: NFT) => void;
//   onBack: () => void;
// }

// interface DetailScreenProps {
//   nft: NFT;
//   onBack: () => void;
//   onNext: () => void;
//   onPrev: () => void;
// }

// // ─── CONSTANTS ────────────────────────────────────────────────────────────────

// const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// const COLORS = {
//   // Pokédex body
//   dexRed: '#E3000F',
//   dexRedDark: '#A8000B',
//   dexRedLight: '#FF3347',
//   dexBlack: '#1A1A1A',
//   dexGrey: '#2D2D2D',
//   dexLightGrey: '#F0F0F0',
//   dexWhite: '#FFFFFF',

//   // Screen / display
//   screenGreen: '#98CB7C',
//   screenGreenDark: '#5A8A3C',
//   screenGreenLight: '#C6E8A8',
//   screenBg: '#8BBD6F',

//   // Accent lights
//   ledGreen: '#39FF14',
//   ledRed: '#FF2020',
//   ledYellow: '#FFE500',
//   ledBlue: '#00BFFF',

//   // Rarity colors
//   common: '#A8A8A8',
//   uncommon: '#4CAF50',
//   rare: '#2196F3',
//   epic: '#9C27B0',
//   legendary: '#FF9800',

//   // Type colors (mapping to Solana NFT traits)
//   fire: '#FF6B35',
//   water: '#4CC9F0',
//   grass: '#52B788',
//   electric: '#FFD60A',
//   psychic: '#F72585',
//   ghost: '#7209B7',
//   dragon: '#3A0CA3',
//   dark: '#1A1A2E',
//   steel: '#8D99AE',
//   normal: '#ADB5BD',

//   // Solana brand
//   solanaPurple: '#9945FF',
//   solanaGreen: '#14F195',
// } as const;

// const FONTS = {
//   mono: Platform.select({ ios: 'Courier New', android: 'monospace', default: '"Courier New", monospace' }),
//   monoB: Platform.select({ ios: 'Courier New', android: 'monospace', default: '"Courier New", monospace' }),
// } as const;

// // ─── MOCK DATA ─────────────────────────────────────────────────────────────────
// // PLACEHOLDER: Replace with real Solana RPC + Metaplex metadata fetching

// const MOCK_WALLET = 'So1ana...moCKwa11et1234567890abcdefgh'; // PLACEHOLDER

// const MOCK_NFTS: NFT[] = [
//   {
//     id: '1',
//     mintAddress: 'NFT1abc...xyz', // PLACEHOLDER mint address
//     name: 'Flame Phantom #001',
//     collection: 'Phantom Legends',
//     image: null, // PLACEHOLDER: real image URI from metadata
//     rarity: 'legendary',
//     type1: 'fire',
//     type2: 'ghost',
//     number: '001',
//     description: 'A spectral flame entity born from volcanic eruptions on the blockchain.', // PLACEHOLDER metadata
//     attributes: [
//       { trait: 'Power', value: 95, max: 100 },
//       { trait: 'Speed', value: 87, max: 100 },
//       { trait: 'Defense', value: 42, max: 100 },
//       { trait: 'Magic', value: 78, max: 100 },
//       { trait: 'Luck', value: 91, max: 100 },
//     ],
//     floorPrice: 12.5, // PLACEHOLDER: real floor from Magic Eden / Tensor
//     lastSale: 11.2,   // PLACEHOLDER
//     holderCount: 1,
//     totalSupply: 3333,
//     rank: 47,
//     evolution: ['Ember Wraith #000', 'Flame Phantom #001', 'Inferno God #002'],
//     abilities: ['Ember Strike', 'Soul Burn', 'Phantom Dash'],
//     owner: 'So1ana...abc',  // PLACEHOLDER
//     isFavorite: true,
//   },
//   {
//     id: '2',
//     mintAddress: 'NFT2def...uvw', // PLACEHOLDER
//     name: 'Aqua Cipher #042',
//     collection: 'Cipher Society',
//     image: null,
//     rarity: 'rare',
//     type1: 'water',
//     type2: 'psychic',
//     number: '042',
//     description: 'An encrypted aquatic being that guards the depths of the Solana seas.',
//     attributes: [
//       { trait: 'Power', value: 60, max: 100 },
//       { trait: 'Speed', value: 72, max: 100 },
//       { trait: 'Defense', value: 88, max: 100 },
//       { trait: 'Magic', value: 95, max: 100 },
//       { trait: 'Luck', value: 55, max: 100 },
//     ],
//     floorPrice: 4.2,
//     lastSale: 3.9,
//     holderCount: 1,
//     totalSupply: 10000,
//     rank: 512,
//     evolution: ['Aqua Cipher #042'],
//     abilities: ['Hydro Encrypt', 'Mind Flood', 'Data Stream'],
//     owner: 'So1ana...abc',
//     isFavorite: false,
//   },
//   {
//     id: '3',
//     mintAddress: 'NFT3ghi...rst', // PLACEHOLDER
//     name: 'Volt Specter #128',
//     collection: 'Specter Grid',
//     image: null,
//     rarity: 'epic',
//     type1: 'electric',
//     type2: 'dark',
//     number: '128',
//     description: 'A lightning ghost haunting the validator nodes of the network.',
//     attributes: [
//       { trait: 'Power', value: 82, max: 100 },
//       { trait: 'Speed', value: 99, max: 100 },
//       { trait: 'Defense', value: 31, max: 100 },
//       { trait: 'Magic', value: 65, max: 100 },
//       { trait: 'Luck', value: 74, max: 100 },
//     ],
//     floorPrice: 7.8,
//     lastSale: 8.1,
//     holderCount: 1,
//     totalSupply: 5555,
//     rank: 203,
//     evolution: ['Static Shade #127', 'Volt Specter #128', 'Thunder God #129'],
//     abilities: ['Chain Lightning', 'Shadow Surge', 'Overdrive'],
//     owner: 'So1ana...abc',
//     isFavorite: false,
//   },
//   {
//     id: '4',
//     mintAddress: 'NFT4jkl...opq', // PLACEHOLDER
//     name: 'Terra Node #007',
//     collection: 'Node Genesis',
//     image: null,
//     rarity: 'uncommon',
//     type1: 'grass',
//     type2: 'steel',
//     number: '007',
//     description: 'Rooted deep into the ledger, it draws nutrients from each confirmed block.',
//     attributes: [
//       { trait: 'Power', value: 55, max: 100 },
//       { trait: 'Speed', value: 40, max: 100 },
//       { trait: 'Defense', value: 95, max: 100 },
//       { trait: 'Magic', value: 48, max: 100 },
//       { trait: 'Luck', value: 60, max: 100 },
//     ],
//     floorPrice: 1.1,
//     lastSale: 0.9,
//     holderCount: 1,
//     totalSupply: 20000,
//     rank: 4821,
//     evolution: ['Sprout Node #006', 'Terra Node #007', 'Iron Grove #008'],
//     abilities: ['Root Lock', 'Iron Bark', 'Photon Feed'],
//     owner: 'So1ana...abc',
//     isFavorite: false,
//   },
//   {
//     id: '5',
//     mintAddress: 'NFT5mno...lmn', // PLACEHOLDER
//     name: 'Dragon Validator #333',
//     collection: 'Validator Dragons',
//     image: null,
//     rarity: 'legendary',
//     type1: 'dragon',
//     type2: 'psychic',
//     number: '333',
//     description: 'The apex validator. Legend says it has never missed a block since genesis.',
//     attributes: [
//       { trait: 'Power', value: 100, max: 100 },
//       { trait: 'Speed', value: 95, max: 100 },
//       { trait: 'Defense', value: 90, max: 100 },
//       { trait: 'Magic', value: 100, max: 100 },
//       { trait: 'Luck', value: 100, max: 100 },
//     ],
//     floorPrice: 88.0,
//     lastSale: 75.5,
//     holderCount: 1,
//     totalSupply: 444,
//     rank: 1,
//     evolution: ['Dragon Validator #333'],
//     abilities: ['Genesis Roar', 'Consensus Crush', 'Epoch Breath'],
//     owner: 'So1ana...abc',
//     isFavorite: true,
//   },
// ];

// // ─── UTILITY HELPERS ───────────────────────────────────────────────────────────

// const getRarityColor = (rarity: Rarity): string => {
//   const colors: Record<Rarity, string> = {
//     common: COLORS.common,
//     uncommon: COLORS.uncommon,
//     rare: COLORS.rare,
//     epic: COLORS.epic,
//     legendary: COLORS.legendary,
//   };
//   return colors[rarity] || COLORS.common;
// };

// const getTypeColor = (type: PokemonType): string => {
//   return COLORS[type] || COLORS.normal;
// };

// const shortenAddress = (addr: string): string =>
//   addr ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : '????';

// const formatSOL = (val: number): string => `◎ ${Number(val).toFixed(2)}`;

// // ─── SUB-COMPONENTS ────────────────────────────────────────────────────────────

// /** Retro LED dot indicator */
// const LedDot: React.FC<LedDotProps> = ({ color = COLORS.ledGreen, size = 12, pulsing = false }) => {
//   const pulse = useRef(new Animated.Value(1)).current;
//   useEffect(() => {
//     if (!pulsing) return;
//     const anim = Animated.loop(
//       Animated.sequence([
//         Animated.timing(pulse, { toValue: 0.3, duration: 600, useNativeDriver: true }),
//         Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
//       ])
//     );
//     anim.start();
//     return () => anim.stop();
//   }, [pulsing, pulse]);
//   return (
//     <Animated.View
//       style={{
//         width: size,
//         height: size,
//         borderRadius: size / 2,
//         backgroundColor: color,
//         opacity: pulse,
//         shadowColor: color,
//         shadowOpacity: 0.9,
//         shadowRadius: 6,
//         elevation: 4,
//       }}
//     />
//   );
// };

// /** Retro scanline overlay for screens */
// const Scanlines: React.FC<ScanlinesProps> = ({ style }) => (
//   <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', opacity: 0.08 }, style]} pointerEvents="none">
//     {Array.from({ length: 40 }).map((_, i) => (
//       <View key={i} style={{ height: 2, backgroundColor: '#000', marginBottom: 4 }} />
//     ))}
//   </View>
// );

// /** Type badge pill */
// const TypeBadge: React.FC<TypeBadgeProps> = ({ type }) => (
//   <View style={[styles.typeBadge, { backgroundColor: getTypeColor(type) }]}>
//     <Text style={styles.typeBadgeText}>{type?.toUpperCase()}</Text>
//   </View>
// );

// /** Rarity badge */
// const RarityBadge: React.FC<RarityBadgeProps> = ({ rarity }) => (
//   <View style={[styles.rarityBadge, { borderColor: getRarityColor(rarity) }]}>
//     <Text style={[styles.rarityText, { color: getRarityColor(rarity) }]}>
//       {rarity?.toUpperCase()}
//     </Text>
//   </View>
// );

// /** Stat bar — retro pixel style */
// const StatBar: React.FC<StatsBarProps> = ({ label, value, max = 100 }) => {
//   const pct = value / max;
//   const barColor = pct > 0.7 ? COLORS.ledGreen : pct > 0.4 ? COLORS.ledYellow : COLORS.ledRed;
//   const segmentCount = 20;
//   return (
//     <View style={styles.statRow}>
//       <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
//       <View style={styles.statBarOuter}>
//         {Array.from({ length: segmentCount }).map((_, i) => (
//           <View
//             key={i}
//             style={[
//               styles.statSegment,
//               { backgroundColor: i / segmentCount < pct ? barColor : '#333' },
//             ]}
//           />
//         ))}
//       </View>
//       <Text style={styles.statValue}>{value}</Text>
//     </View>
//   );
// };

// /** NFT placeholder image with retro pixel art fallback */
// const NftImage: React.FC<NftImageProps> = ({ uri, size = 120, type1 = 'normal', number = '???' }) => {
//   const [errored, setErrored] = useState(false);
//   const bg = getTypeColor(type1);
//   if (!uri || errored) {
//     // PLACEHOLDER: Render a retro pixel art placeholder
//     return (
//       <View style={[styles.nftPlaceholder, { width: size, height: size, backgroundColor: bg + '33' }]}>
//         <View style={[styles.pixelMonster, { width: size * 0.6, height: size * 0.6 }]}>
//           {/* Simple pixel art face — PLACEHOLDER for real NFT image */}
//           <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: size * 0.15 }}>
//             <View style={{ width: size * 0.1, height: size * 0.1, backgroundColor: COLORS.dexBlack, borderRadius: 2 }} />
//             <View style={{ width: size * 0.1, height: size * 0.1, backgroundColor: COLORS.dexBlack, borderRadius: 2 }} />
//           </View>
//           <View style={{ width: size * 0.25, height: size * 0.06, backgroundColor: COLORS.dexBlack, alignSelf: 'center', marginTop: size * 0.1, borderRadius: 2 }} />
//         </View>
//         <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: bg, marginTop: 4 }}>#{number}</Text>
//       </View>
//     );
//   }
//   return (
//     <Image
//       source={{ uri }}
//       style={{ width: size, height: size, borderRadius: 8 }}
//       onError={() => setErrored(true)}
//     />
//   );
// };

// /** Animated scanning beam */
// const ScanBeam: React.FC<ScanBeamProps> = ({ active }) => {
//   const anim = useRef(new Animated.Value(0)).current;
//   useEffect(() => {
//     if (!active) { 
//       anim.setValue(0); 
//       return; 
//     }
//     const loop = Animated.loop(
//       Animated.timing(anim, { 
//         toValue: 1, 
//         duration: 1800, 
//         easing: Easing.linear, 
//         useNativeDriver: true 
//       })
//     );
//     loop.start();
//     return () => loop.stop();
//   }, [active, anim]);
  
//   const translateY = anim.interpolate({ 
//     inputRange: [0, 1], 
//     outputRange: [0, 200] 
//   });
  
//   if (!active) return null;
//   return (
//     <Animated.View
//       style={{
//         position: 'absolute', 
//         left: 0, 
//         right: 0, 
//         height: 3,
//         backgroundColor: COLORS.solanaGreen,
//         opacity: 0.8,
//         shadowColor: COLORS.solanaGreen,
//         shadowOpacity: 1,
//         shadowRadius: 10,
//         transform: [{ translateY }],
//       }}
//       pointerEvents="none"
//     />
//   );
// };

// // ─── SCREENS ───────────────────────────────────────────────────────────────────

// /** ── SCREEN 1: Wallet Scanner ── */
// const ScannerScreen: React.FC<ScannerScreenProps> = ({ onScanComplete }) => {
//   const [walletInput, setWalletInput] = useState('');
//   const [scanning, setScanning] = useState(false);
//   const [scanPhase, setScanPhase] = useState('');
//   const [connected, setConnected] = useState(false);
//   const glowAnim = useRef(new Animated.Value(0)).current;

//   const phases = [
//     'INITIALIZING RPC NODE...',
//     'CONNECTING TO SOLANA...',
//     'READING TOKEN ACCOUNTS...',
//     'FETCHING METADATA...',
//     'DECODING NFT DATA...',
//     'LOADING COLLECTION INFO...',
//     'COMPUTING RARITY RANKS...',
//     'SCAN COMPLETE!',
//   ];

//   const startScan = useCallback(async () => {
//     const addr = walletInput.trim() || MOCK_WALLET;
//     setScanning(true);

//     // PLACEHOLDER: Real wallet validation
//     // const conn = new Connection('https://api.mainnet-beta.solana.com');
//     // const pubkey = new PublicKey(addr);
//     // const tokenAccounts = await conn.getParsedTokenAccountsByOwner(pubkey, { programId: TOKEN_PROGRAM_ID });

//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(glowAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
//         Animated.timing(glowAnim, { toValue: 0.4, duration: 500, useNativeDriver: true }),
//       ])
//     ).start();

//     for (let i = 0; i < phases.length; i++) {
//       setScanPhase(phases[i]);
//       await new Promise(r => setTimeout(r, 400));
//     }

//     // PLACEHOLDER: Replace with real NFT data from Metaplex/Helius API
//     setScanning(false);
//     setConnected(true);
//     setTimeout(() => onScanComplete(MOCK_NFTS, addr), 600);
//   }, [walletInput, glowAnim, onScanComplete]);

//   return (
//     <View style={styles.scannerScreen}>
//       {/* Top dex hinge */}
//       <View style={styles.dexHinge} />

//       {/* Big LED ring */}
//       <View style={styles.bigLedRing}>
//         <View style={[styles.bigLed, { backgroundColor: connected ? COLORS.ledGreen : scanning ? COLORS.ledYellow : COLORS.ledRed }]}>
//           <LedDot color={connected ? COLORS.ledGreen : scanning ? COLORS.ledYellow : COLORS.ledRed} size={30} pulsing={scanning} />
//         </View>
//       </View>

//       {/* Small accent LEDs */}
//       <View style={styles.ledRow}>
//         <LedDot color={COLORS.ledRed} size={14} />
//         <LedDot color={COLORS.ledYellow} size={10} />
//         <LedDot color={COLORS.ledGreen} size={10} />
//       </View>

//       {/* Main scan screen */}
//       <View style={styles.scanScreen}>
//         <Scanlines />
//         <ScanBeam active={scanning} />
//         <View style={styles.scanScreenInner}>
//           <Text style={styles.scanTitle}>MINTLORE{'\n'}SCANNER v1.0</Text>
//           <View style={styles.dividerLine} />
//           {scanning ? (
//             <View style={styles.scanProgress}>
//               <ActivityIndicator color={COLORS.ledGreen} size="small" />
//               <Text style={styles.scanPhaseText}>{scanPhase}</Text>
//               <View style={styles.progressDots}>
//                 {[0,1,2,3,4,5,6,7].map(i => (
//                   <View key={i} style={[styles.dot, { backgroundColor: phases.indexOf(scanPhase) >= i ? COLORS.ledGreen : '#333' }]} />
//                 ))}
//               </View>
//             </View>
//           ) : connected ? (
//             <Text style={[styles.scanPhaseText, { color: COLORS.ledGreen }]}>WALLET LINKED ✓</Text>
//           ) : (
//             <Text style={styles.scanHint}>ENTER WALLET ADDRESS OR CONNECT</Text>
//           )}
//         </View>
//       </View>

//       {/* Wallet input */}
//       <View style={styles.inputBlock}>
//         <Text style={styles.inputLabel}>WALLET ADDR:</Text>
//         <TextInput
//           style={styles.walletInput}
//           value={walletInput}
//           onChangeText={setWalletInput}
//           placeholder="So1ana...wallet" // PLACEHOLDER
//           placeholderTextColor="#555"
//           autoCapitalize="none"
//           autoCorrect={false}
//         />
//       </View>

//       {/* Action buttons */}
//       <View style={styles.buttonRow}>
//         <TouchableHighlight
//           style={[styles.dexButton, styles.dexButtonPrimary]}
//           underlayColor={COLORS.dexRedDark}
//           onPress={startScan}
//           disabled={scanning}
//         >
//           <Text style={styles.dexButtonText}>{scanning ? 'SCANNING...' : '◉ SCAN WALLET'}</Text>
//         </TouchableHighlight>

//         <TouchableHighlight
//           style={[styles.dexButton, styles.dexButtonSecondary]}
//           underlayColor="#333"
//           onPress={() => {
//             // PLACEHOLDER: Mobile Wallet Adapter connect
//             // await transact(async wallet => { await wallet.authorize({ cluster: 'mainnet-beta', ... }); });
//             Alert.alert('CONNECT WALLET', 'Mobile Wallet Adapter integration\n[PLACEHOLDER — install @solana-mobile/wallet-adapter-react]');
//           }}
//         >
//           <Text style={[styles.dexButtonText, { color: COLORS.solanaGreen }]}>⬡ CONNECT MWA</Text>
//         </TouchableHighlight>
//       </View>

//       {/* D-pad decoration */}
//       <View style={styles.dpadWrap}>
//         <View style={styles.dpadRow}>
//           <View style={styles.dpadCell} />
//           <TouchableOpacity style={styles.dpadBtn}><Text style={styles.dpadArrow}>▲</Text></TouchableOpacity>
//           <View style={styles.dpadCell} />
//         </View>
//         <View style={styles.dpadRow}>
//           <TouchableOpacity style={styles.dpadBtn}><Text style={styles.dpadArrow}>◀</Text></TouchableOpacity>
//           <View style={[styles.dpadBtn, styles.dpadCenter]} />
//           <TouchableOpacity style={styles.dpadBtn}><Text style={styles.dpadArrow}>▶</Text></TouchableOpacity>
//         </View>
//         <View style={styles.dpadRow}>
//           <View style={styles.dpadCell} />
//           <TouchableOpacity style={styles.dpadBtn}><Text style={styles.dpadArrow}>▼</Text></TouchableOpacity>
//           <View style={styles.dpadCell} />
//         </View>
//       </View>

//       <Text style={styles.solanaWatermark}>POWERED BY SOLANA</Text>
//     </View>
//   );
// };

// /** ── SCREEN 2: NFT Collection List ── */
// const CollectionScreen: React.FC<CollectionScreenProps> = ({ nfts, walletAddress, onSelectNft, onBack }) => {
//   const [filter, setFilter] = useState<FilterType>('ALL');
//   const [search, setSearch] = useState('');
//   const [sortBy, setSortBy] = useState<SortBy>('number');
//   const [favorites, setFavorites] = useState<string[]>(
//     nfts.filter(n => n.isFavorite).map(n => n.id)
//   );

//   const filters: FilterType[] = ['ALL', 'LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON'];
//   const sorts: SortBy[] = ['number', 'rarity', 'floor', 'rank'];

//   const rarityOrder: Record<Rarity, number> = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };

//   const displayed = useMemo(() => {
//     let list = [...nfts];
//     if (filter !== 'ALL') {
//       const rarityFilter = filter.toLowerCase() as Rarity;
//       list = list.filter(n => n.rarity === rarityFilter);
//     }
//     if (search) {
//       list = list.filter(n =>
//         n.name.toLowerCase().includes(search.toLowerCase()) ||
//         n.collection.toLowerCase().includes(search.toLowerCase())
//       );
//     }
//     list.sort((a, b) => {
//       if (sortBy === 'number') return a.number.localeCompare(b.number);
//       if (sortBy === 'rarity') return rarityOrder[a.rarity] - rarityOrder[b.rarity];
//       if (sortBy === 'floor') return b.floorPrice - a.floorPrice;
//       if (sortBy === 'rank') return a.rank - b.rank;
//       return 0;
//     });
//     return list;
//   }, [nfts, filter, search, sortBy, rarityOrder]);

//   const totalValue = nfts.reduce((s, n) => s + (n.floorPrice || 0), 0);

//   const toggleFav = (id: string) => {
//     setFavorites(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
//   };

//   const renderNftCard = ({ item }: { item: NFT }) => {
//     const isFav = favorites.includes(item.id);
//     return (
//       <TouchableOpacity
//         style={[styles.nftCard, { borderColor: getRarityColor(item.rarity) }]}
//         onPress={() => onSelectNft(item)}
//         activeOpacity={0.7}
//       >
//         {/* Card header */}
//         <View style={[styles.nftCardHeader, { backgroundColor: getTypeColor(item.type1) + '33' }]}>
//           <Text style={styles.nftCardNumber}>#{item.number}</Text>
//           <TouchableOpacity onPress={() => toggleFav(item.id)} style={{ padding: 4 }}>
//             <Text style={{ fontSize: 16 }}>{isFav ? '♥' : '♡'}</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Image area */}
//         <View style={styles.nftCardImageWrap}>
//           <NftImage uri={item.image} size={80} type1={item.type1} number={item.number} />
//           <View style={[styles.rarityGlow, { shadowColor: getRarityColor(item.rarity) }]} />
//         </View>

//         {/* Info */}
//         <View style={styles.nftCardInfo}>
//           <Text style={styles.nftCardName} numberOfLines={1}>{item.name}</Text>
//           <Text style={styles.nftCardCollection} numberOfLines={1}>{item.collection}</Text>

//           <View style={styles.nftCardTypes}>
//             <TypeBadge type={item.type1} />
//             {item.type2 && <TypeBadge type={item.type2} />}
//           </View>

//           <View style={styles.nftCardFooter}>
//             <Text style={styles.nftCardPrice}>{formatSOL(item.floorPrice)}</Text>
//             <Text style={styles.nftCardRank}>#{item.rank}</Text>
//           </View>
//         </View>

//         {/* Rarity stripe */}
//         <View style={[styles.rarityStripe, { backgroundColor: getRarityColor(item.rarity) }]} />
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <View style={styles.collectionScreen}>
//       {/* Header */}
//       <View style={styles.collectionHeader}>
//         <TouchableOpacity onPress={onBack} style={styles.backButton}>
//           <Text style={styles.backArrow}>◀ BACK</Text>
//         </TouchableOpacity>
//         <View style={styles.headerCenter}>
//           <Text style={styles.collectionTitle}>MINTLORE</Text>
//           <Text style={styles.walletChip}>{shortenAddress(walletAddress)}</Text>
//         </View>
//         <LedDot color={COLORS.ledGreen} size={12} pulsing />
//       </View>

//       {/* Stats bar */}
//       <View style={styles.statsBar}>
//         <View style={styles.statChip}>
//           <Text style={styles.statChipLabel}>COLLECTED</Text>
//           <Text style={styles.statChipValue}>{nfts.length}</Text>
//         </View>
//         <View style={styles.statChip}>
//           <Text style={styles.statChipLabel}>FLOOR VALUE</Text>
//           <Text style={[styles.statChipValue, { color: COLORS.solanaGreen }]}>{formatSOL(totalValue)}</Text>
//         </View>
//         <View style={styles.statChip}>
//           <Text style={styles.statChipLabel}>FAVORITES</Text>
//           <Text style={[styles.statChipValue, { color: COLORS.ledYellow }]}>{favorites.length}</Text>
//         </View>
//       </View>

//       {/* Search */}
//       <View style={styles.searchBar}>
//         <Text style={styles.searchIcon}>⌕ </Text>
//         <TextInput
//           style={styles.searchInput}
//           value={search}
//           onChangeText={setSearch}
//           placeholder="SEARCH NFT OR COLLECTION..."
//           placeholderTextColor="#444"
//         />
//       </View>

//       {/* Filter pills */}
//       <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: 12 }}>
//         {filters.map(f => (
//           <TouchableOpacity
//             key={f}
//             style={[styles.filterPill, filter === f && styles.filterPillActive]}
//             onPress={() => setFilter(f)}
//           >
//             <Text style={[styles.filterPillText, filter === f && styles.filterPillTextActive]}>{f}</Text>
//           </TouchableOpacity>
//         ))}
//       </ScrollView>

//       {/* Sort row */}
//       <View style={styles.sortRow}>
//         <Text style={styles.sortLabel}>SORT:</Text>
//         {sorts.map(s => (
//           <TouchableOpacity key={s} onPress={() => setSortBy(s)} style={[styles.sortBtn, sortBy === s && styles.sortBtnActive]}>
//             <Text style={[styles.sortBtnText, sortBy === s && { color: COLORS.dexRedLight }]}>{s.toUpperCase()}</Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       {/* NFT grid */}
//       <FlatList
//         data={displayed}
//         keyExtractor={i => i.id}
//         renderItem={renderNftCard}
//         numColumns={2}
//         columnWrapperStyle={styles.gridRow}
//         contentContainerStyle={styles.gridContent}
//         showsVerticalScrollIndicator={false}
//         ListEmptyComponent={
//           <View style={styles.emptyState}>
//             <Text style={styles.emptyText}>NO NFTs FOUND{'\n'}IN SELECTED FILTER</Text>
//           </View>
//         }
//       />
//     </View>
//   );
// };

// /** ── SCREEN 3: NFT Detail (Retro Pokédex entry) ── */
// const DetailScreen: React.FC<DetailScreenProps> = ({ nft, onBack, onNext, onPrev }) => {
//   const [tab, setTab] = useState<TabType>('ABOUT');
//   const slideAnim = useRef(new Animated.Value(0)).current;
//   const entryAnim = useRef(new Animated.Value(0)).current;
//   const tabs: TabType[] = ['ABOUT', 'STATS', 'TRAITS', 'MARKET'];

//   useEffect(() => {
//     Animated.spring(entryAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }).start();
//   }, [nft, entryAnim]);

//   useEffect(() => {
//     Animated.timing(slideAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
//   }, [tab, slideAnim]);

//   const renderTab = () => {
//     switch (tab) {
//       case 'ABOUT':
//         return (
//           <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
//             <View style={styles.aboutRow}>
//               <Text style={styles.aboutLabel}>MINT ADDR</Text>
//               <Text style={styles.aboutValue}>{shortenAddress(nft.mintAddress)}</Text>
//             </View>
//             <View style={styles.aboutRow}>
//               <Text style={styles.aboutLabel}>COLLECTION</Text>
//               <Text style={styles.aboutValue}>{nft.collection}</Text>
//             </View>
//             <View style={styles.aboutRow}>
//               <Text style={styles.aboutLabel}>SUPPLY</Text>
//               <Text style={styles.aboutValue}>{nft.totalSupply.toLocaleString()}</Text>
//             </View>
//             <View style={styles.aboutRow}>
//               <Text style={styles.aboutLabel}>RANK</Text>
//               <Text style={[styles.aboutValue, { color: COLORS.ledYellow }]}>#{nft.rank} / {nft.totalSupply}</Text>
//             </View>
//             <View style={styles.dividerLine} />
//             <Text style={styles.sectionTitle}>DESCRIPTION</Text>
//             <Text style={styles.descText}>{nft.description}</Text>
//             <View style={styles.dividerLine} />
//             <Text style={styles.sectionTitle}>ABILITIES</Text>
//             {nft.abilities.map((a, i) => (
//               <View key={i} style={styles.abilityRow}>
//                 <View style={styles.abilityDot} />
//                 <Text style={styles.abilityText}>{a}</Text>
//               </View>
//             ))}
//             <View style={styles.dividerLine} />
//             <Text style={styles.sectionTitle}>EVOLUTION LINE</Text>
//             <View style={styles.evolutionRow}>
//               {nft.evolution.map((e, i) => (
//                 <React.Fragment key={i}>
//                   <View style={[styles.evoChip, e === nft.name && styles.evoChipActive]}>
//                     <Text style={[styles.evoText, e === nft.name && { color: COLORS.dexWhite }]}>{e}</Text>
//                   </View>
//                   {i < nft.evolution.length - 1 && <Text style={styles.evoArrow}>▶</Text>}
//                 </React.Fragment>
//               ))}
//             </View>
//           </ScrollView>
//         );

//       case 'STATS':
//         return (
//           <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
//             <Text style={styles.sectionTitle}>BASE STATS</Text>
//             {nft.attributes.map((attr, i) => (
//               <StatBar key={i} label={attr.trait} value={attr.value} max={attr.max} />
//             ))}
//             <View style={styles.dividerLine} />
//             <View style={styles.totalRow}>
//               <Text style={styles.totalLabel}>TOTAL POWER</Text>
//               <Text style={styles.totalValue}>
//                 {nft.attributes.reduce((s, a) => s + a.value, 0)} / {nft.attributes.reduce((s, a) => s + a.max, 0)}
//               </Text>
//             </View>
//             {/* Type defense matrix — PLACEHOLDER for real type effectiveness */}
//             <View style={styles.dividerLine} />
//             <Text style={styles.sectionTitle}>TYPE MATCHUPS</Text>
//             <Text style={styles.placeholderNote}>[PLACEHOLDER: type effectiveness matrix]</Text>
//           </ScrollView>
//         );

//       case 'TRAITS':
//         return (
//           <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
//             <Text style={styles.sectionTitle}>ON-CHAIN TRAITS</Text>
//             {/* PLACEHOLDER: Real traits from Metaplex metadata attributes array */}
//             {nft.attributes.map((attr, i) => (
//               <View key={i} style={styles.traitRow}>
//                 <View style={styles.traitCard}>
//                   <Text style={styles.traitLabel}>{attr.trait.toUpperCase()}</Text>
//                   <Text style={styles.traitValue}>{attr.value}</Text>
//                   <Text style={styles.traitRarity}>
//                     {/* PLACEHOLDER: real trait rarity % from collection database */}
//                     ~{Math.round((100 - attr.value) / 10 + 5)}% have this
//                   </Text>
//                 </View>
//               </View>
//             ))}
//             <View style={styles.dividerLine} />
//             <Text style={styles.placeholderNote}>[PLACEHOLDER: Full metadata.attributes from Metaplex]</Text>
//           </ScrollView>
//         );

//       case 'MARKET':
//         return (
//           <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
//             <Text style={styles.sectionTitle}>MARKET DATA</Text>
//             <View style={styles.marketCard}>
//               <View style={styles.marketRow}>
//                 <Text style={styles.marketLabel}>FLOOR PRICE</Text>
//                 <Text style={[styles.marketValue, { color: COLORS.solanaGreen }]}>{formatSOL(nft.floorPrice)}</Text>
//               </View>
//               <View style={styles.marketRow}>
//                 <Text style={styles.marketLabel}>LAST SALE</Text>
//                 <Text style={styles.marketValue}>{formatSOL(nft.lastSale)}</Text>
//               </View>
//               <View style={styles.marketRow}>
//                 <Text style={styles.marketLabel}>COLLECTION RANK</Text>
//                 <Text style={[styles.marketValue, { color: COLORS.ledYellow }]}>#{nft.rank}</Text>
//               </View>
//               <View style={styles.marketRow}>
//                 <Text style={styles.marketLabel}>TOTAL SUPPLY</Text>
//                 <Text style={styles.marketValue}>{nft.totalSupply.toLocaleString()}</Text>
//               </View>
//             </View>
//             <View style={styles.dividerLine} />
//             {/* PLACEHOLDER: Real price history chart from Magic Eden / Tensor API */}
//             <Text style={styles.sectionTitle}>PRICE HISTORY</Text>
//             <View style={styles.chartPlaceholder}>
//               <Text style={styles.placeholderNote}>[PLACEHOLDER: Price chart from Magic Eden/Tensor API]</Text>
//               {/* Fake sparkline bars for visual interest */}
//               <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 60, marginTop: 12, gap: 4 }}>
//                 {[8, 5, 9, 7, 11, 10, 12, 9, 13, 12, 11, 12.5].map((v, i) => (
//                   <View
//                     key={i}
//                     style={{
//                       flex: 1,
//                       height: (v / 13) * 56,
//                       backgroundColor: i === 11 ? COLORS.solanaGreen : COLORS.dexGrey,
//                       borderRadius: 2,
//                     }}
//                   />
//                 ))}
//               </View>
//               <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
//                 <Text style={styles.chartAxisLabel}>30D AGO</Text>
//                 <Text style={styles.chartAxisLabel}>TODAY</Text>
//               </View>
//             </View>
//             <View style={styles.dividerLine} />
//             {/* Action buttons */}
//             <TouchableOpacity
//               style={styles.marketActionBtn}
//               onPress={() => {
//                 // PLACEHOLDER: Open Magic Eden listing
//                 Alert.alert('MARKETPLACE', 'Open on Magic Eden\n[PLACEHOLDER — link to nft.mintAddress]');
//               }}
//             >
//               <Text style={styles.marketActionText}>⬡ VIEW ON MAGIC EDEN</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={[styles.marketActionBtn, { backgroundColor: '#1A1A1A', borderColor: COLORS.solanaGreen, marginTop: 8 }]}
//               onPress={() => {
//                 // PLACEHOLDER: Open Tensor
//                 Alert.alert('TENSOR', 'Open on Tensor.trade\n[PLACEHOLDER]');
//               }}
//             >
//               <Text style={[styles.marketActionText, { color: COLORS.solanaGreen }]}>◈ VIEW ON TENSOR</Text>
//             </TouchableOpacity>
//           </ScrollView>
//         );

//       default:
//         return null;
//     }
//   };

//   return (
//     <Animated.View
//       style={[styles.detailScreen, { opacity: entryAnim, transform: [{ scale: entryAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}
//     >
//       {/* Top strip — type color */}
//       <View style={[styles.detailTopStrip, { backgroundColor: getTypeColor(nft.type1) }]}>
//         <View style={styles.detailTopRow}>
//           <TouchableOpacity onPress={onBack} style={styles.backButton}>
//             <Text style={[styles.backArrow, { color: COLORS.dexWhite }]}>◀</Text>
//           </TouchableOpacity>
//           <View style={{ flex: 1, marginHorizontal: 8 }}>
//             <Text style={styles.detailName}>{nft.name}</Text>
//             <Text style={styles.detailNumber}>#{nft.number}</Text>
//           </View>
//           <RarityBadge rarity={nft.rarity} />
//         </View>

//         {/* Type badges */}
//         <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, paddingHorizontal: 16 }}>
//           <TypeBadge type={nft.type1} />
//           {nft.type2 && <TypeBadge type={nft.type2} />}
//         </View>

//         {/* NFT image — floats over */}
//         <View style={styles.detailImageFloat}>
//           <NftImage uri={nft.image} size={140} type1={nft.type1} number={nft.number} />
//         </View>
//       </View>

//       {/* White card below */}
//       <View style={styles.detailCard}>
//         {/* Nav prev/next */}
//         <View style={styles.navRow}>
//           <TouchableOpacity onPress={onPrev} style={styles.navBtn}>
//             <Text style={styles.navBtnText}>◀ PREV</Text>
//           </TouchableOpacity>
//           <View style={{ flex: 1 }} />
//           <TouchableOpacity onPress={onNext} style={styles.navBtn}>
//             <Text style={styles.navBtnText}>NEXT ▶</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Tabs */}
//         <View style={styles.tabRow}>
//           {tabs.map(t => (
//             <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
//               <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>{t}</Text>
//             </TouchableOpacity>
//           ))}
//         </View>

//         {/* Tab content */}
//         <View style={styles.tabContentWrap}>
//           {renderTab()}
//         </View>
//       </View>
//     </Animated.View>
//   );
// };

// // ─── ROOT APP ──────────────────────────────────────────────────────────────────

// export default function App() {
//   const [screen, setScreen] = useState<ScreenType>('SCANNER'); // 'SCANNER' | 'COLLECTION' | 'DETAIL'
//   const [nfts, setNfts] = useState<NFT[]>([]);
//   const [walletAddress, setWalletAddress] = useState('');
//   const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
//   const [selectedIndex, setSelectedIndex] = useState(0);

//   const handleScanComplete = useCallback((data: NFT[], addr: string) => {
//     setNfts(data);
//     setWalletAddress(addr);
//     setScreen('COLLECTION');
//   }, []);

//   const handleSelectNft = useCallback((nft: NFT) => {
//     const idx = nfts.findIndex(n => n.id === nft.id);
//     setSelectedIndex(idx);
//     setSelectedNft(nft);
//     setScreen('DETAIL');
//   }, [nfts]);

//   const handleNext = useCallback(() => {
//     const next = (selectedIndex + 1) % nfts.length;
//     setSelectedIndex(next);
//     setSelectedNft(nfts[next]);
//   }, [selectedIndex, nfts]);

//   const handlePrev = useCallback(() => {
//     const prev = (selectedIndex - 1 + nfts.length) % nfts.length;
//     setSelectedIndex(prev);
//     setSelectedNft(nfts[prev]);
//   }, [selectedIndex, nfts]);

//   return (
//     <SafeAreaProvider>
//     <SafeAreaView style={styles.root}>
//       <StatusBar barStyle="light-content" backgroundColor={COLORS.dexRed} />

//       {screen === 'SCANNER' && (
//         <ScannerScreen onScanComplete={handleScanComplete} />
//       )}

//       {screen === 'COLLECTION' && (
//         <CollectionScreen
//           nfts={nfts}
//           walletAddress={walletAddress}
//           onSelectNft={handleSelectNft}
//           onBack={() => setScreen('SCANNER')}
//         />
//       )}

//       {screen === 'DETAIL' && selectedNft && (
//         <DetailScreen
//           nft={selectedNft}
//           onBack={() => setScreen('COLLECTION')}
//           onNext={handleNext}
//           onPrev={handlePrev}
//         />
//       )}
//     </SafeAreaView></SafeAreaProvider>
//   );
// }

// // ─── STYLES ────────────────────────────────────────────────────────────────────

// const styles = StyleSheet.create({
//   root: {
//     flex: 1,
//     backgroundColor: COLORS.dexRed,
//   } as ViewStyle,

//   // ── Scanner Screen ──
//   scannerScreen: {
//     flex: 1,
//     backgroundColor: COLORS.dexRed,
//     alignItems: 'center',
//     paddingVertical: 12,
//   } as ViewStyle,
  
//   dexHinge: {
//     width: 80,
//     height: 8,
//     backgroundColor: COLORS.dexRedDark,
//     borderRadius: 4,
//     marginBottom: 12,
//   } as ViewStyle,
  
//   bigLedRing: {
//     width: 70,
//     height: 70,
//     borderRadius: 35,
//     backgroundColor: COLORS.dexRedDark,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 10,
//     borderWidth: 3,
//     borderColor: COLORS.dexBlack,
//   } as ViewStyle,
  
//   bigLed: {
//     width: 54,
//     height: 54,
//     borderRadius: 27,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 2,
//     borderColor: COLORS.dexBlack,
//   } as ViewStyle,
  
//   ledRow: {
//     flexDirection: 'row',
//     gap: 8,
//     marginBottom: 16,
//     alignItems: 'center',
//   } as ViewStyle,
  
//   scanScreen: {
//     width: SCREEN_W - 40,
//     height: 180,
//     backgroundColor: COLORS.screenBg,
//     borderRadius: 8,
//     borderWidth: 4,
//     borderColor: COLORS.dexBlack,
//     overflow: 'hidden',
//     marginBottom: 16,
//   } as ViewStyle,
  
//   scanScreenInner: {
//     flex: 1,
//     padding: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//   } as ViewStyle,
  
//   scanTitle: {
//     fontFamily: FONTS.mono,
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: COLORS.screenGreenDark,
//     textAlign: 'center',
//     letterSpacing: 2,
//   } as TextStyle,
  
//   dividerLine: {
//     height: 1,
//     backgroundColor: COLORS.dexBlack + '33',
//     width: '100%',
//     marginVertical: 10,
//   } as ViewStyle,
  
//   scanProgress: {
//     alignItems: 'center',
//     gap: 8,
//   } as ViewStyle,
  
//   scanPhaseText: {
//     fontFamily: FONTS.mono,
//     fontSize: 12,
//     color: COLORS.screenGreenDark,
//     textAlign: 'center',
//     letterSpacing: 1,
//   } as TextStyle,
  
//   scanHint: {
//     fontFamily: FONTS.mono,
//     fontSize: 11,
//     color: COLORS.screenGreenDark + 'AA',
//     textAlign: 'center',
//   } as TextStyle,
  
//   progressDots: {
//     flexDirection: 'row',
//     gap: 6,
//   } as ViewStyle,
  
//   dot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//   } as ViewStyle,
  
//   inputBlock: {
//     width: SCREEN_W - 40,
//     marginBottom: 12,
//   } as ViewStyle,
  
//   inputLabel: {
//     fontFamily: FONTS.mono,
//     fontSize: 10,
//     color: COLORS.dexWhite + 'AA',
//     marginBottom: 4,
//     letterSpacing: 1,
//   } as TextStyle,
  
//   walletInput: {
//     fontFamily: FONTS.mono,
//     fontSize: 13,
//     color: COLORS.dexWhite,
//     backgroundColor: COLORS.dexBlack,
//     borderWidth: 2,
//     borderColor: COLORS.dexRedDark,
//     borderRadius: 4,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     letterSpacing: 1,
//   } as TextStyle,
  
//   buttonRow: {
//     flexDirection: 'row',
//     gap: 10,
//     width: SCREEN_W - 40,
//     marginBottom: 16,
//   } as ViewStyle,
  
//   dexButton: {
//     flex: 1,
//     paddingVertical: 12,
//     borderRadius: 6,
//     alignItems: 'center',
//     borderWidth: 2,
//   } as ViewStyle,
  
//   dexButtonPrimary: {
//     backgroundColor: COLORS.dexBlack,
//     borderColor: COLORS.dexRedLight,
//   } as ViewStyle,
  
//   dexButtonSecondary: {
//     backgroundColor: COLORS.dexBlack,
//     borderColor: COLORS.solanaGreen,
//   } as ViewStyle,
  
//   dexButtonText: {
//     fontFamily: FONTS.mono,
//     fontSize: 11,
//     fontWeight: 'bold',
//     color: COLORS.dexWhite,
//     letterSpacing: 1,
//   } as TextStyle,
  
//   dpadWrap: {
//     marginTop: 4,
//     marginBottom: 10,
//   } as ViewStyle,
  
//   dpadRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   } as ViewStyle,
  
//   dpadBtn: {
//     width: 44,
//     height: 44,
//     backgroundColor: COLORS.dexBlack,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     borderColor: '#333',
//   } as ViewStyle,
  
//   dpadCell: {
//     width: 44,
//     height: 44,
//   } as ViewStyle,
  
//   dpadCenter: {
//     backgroundColor: '#222',
//   } as ViewStyle,
  
//   dpadArrow: {
//     color: COLORS.dexLightGrey,
//     fontSize: 16,
//   } as TextStyle,
  
//   solanaWatermark: {
//     fontFamily: FONTS.mono,
//     fontSize: 9,
//     color: COLORS.dexWhite + '55',
//     letterSpacing: 2,
//     marginTop: 4,
//   } as TextStyle,

//   // ── Collection Screen ──
//   collectionScreen: {
//     flex: 1,
//     backgroundColor: COLORS.dexRed,
//   } as ViewStyle,
  
//   collectionHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 14,
//     paddingTop: 8,
//     paddingBottom: 10,
//   } as ViewStyle,
  
//   headerCenter: {
//     flex: 1,
//     alignItems: 'center',
//   } as ViewStyle,
  
//   collectionTitle: {
//     fontFamily: FONTS.mono,
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: COLORS.dexWhite,
//     letterSpacing: 4,
//   } as TextStyle,
  
//   walletChip: {
//     fontFamily: FONTS.mono,
//     fontSize: 9,
//     color: COLORS.dexWhite + 'BB',
//     backgroundColor: COLORS.dexBlack + '66',
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 10,
//     marginTop: 2,
//   } as TextStyle,
  
//   backButton: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//   } as ViewStyle,
  
//   backArrow: {
//     fontFamily: FONTS.mono,
//     color: COLORS.dexWhite,
//     fontSize: 13,
//     fontWeight: 'bold',
//   } as TextStyle,
  
//   statsBar: {
//     flexDirection: 'row',
//     backgroundColor: COLORS.dexBlack + 'BB',
//     marginHorizontal: 14,
//     borderRadius: 6,
//     paddingVertical: 8,
//     marginBottom: 10,
//     borderWidth: 1,
//     borderColor: COLORS.dexRedDark,
//   } as ViewStyle,
  
//   statChip: {
//     flex: 1,
//     alignItems: 'center',
//   } as ViewStyle,
  
//   statChipLabel: {
//     fontFamily: FONTS.mono,
//     fontSize: 8,
//     color: COLORS.dexWhite + '77',
//     letterSpacing: 1,
//   } as TextStyle,
  
//   statChipValue: {
//     fontFamily: FONTS.mono,
//     fontSize: 15,
//     fontWeight: 'bold',
//     color: COLORS.dexWhite,
//   } as TextStyle,
  
//   searchBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.dexBlack,
//     marginHorizontal: 14,
//     borderRadius: 6,
//     borderWidth: 1,
//     borderColor: '#333',
//     paddingHorizontal: 10,
//     marginBottom: 8,
//   } as ViewStyle,
  
//   searchIcon: {
//     fontFamily: FONTS.mono,
//     color: '#555',
//     fontSize: 18,
//   } as TextStyle,
  
//   searchInput: {
//     flex: 1,
//     fontFamily: FONTS.mono,
//     fontSize: 11,
//     color: COLORS.dexWhite,
//     paddingVertical: 8,
//     letterSpacing: 1,
//   } as TextStyle,
  
//   filterScroll: {
//     marginBottom: 6,
//     maxHeight: 36,
//   } as ViewStyle,
  
//   filterPill: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 20,
//     backgroundColor: COLORS.dexBlack + '66',
//     borderWidth: 1,
//     borderColor: '#333',
//     marginRight: 6,
//   } as ViewStyle,
  
//   filterPillActive: {
//     backgroundColor: COLORS.dexBlack,
//     borderColor: COLORS.dexRedLight,
//   } as ViewStyle,
  
//   filterPillText: {
//     fontFamily: FONTS.mono,
//     fontSize: 9,
//     color: '#888',
//     fontWeight: 'bold',
//     letterSpacing: 1,
//   } as TextStyle,
  
//   filterPillTextActive: {
//     color: COLORS.dexRedLight,
//   } as TextStyle,
  
//   sortRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 14,
//     marginBottom: 8,
//     gap: 6,
//   } as ViewStyle,
  
//   sortLabel: {
//     fontFamily: FONTS.mono,
//     fontSize: 9,
//     color: '#888',
//     letterSpacing: 1,
//   } as TextStyle,
  
//   sortBtn: {
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     borderRadius: 3,
//     borderWidth: 1,
//     borderColor: '#333',
//   } as ViewStyle,
  
//   sortBtnActive: {
//     borderColor: COLORS.dexRedLight + '88',
//     backgroundColor: COLORS.dexBlack,
//   } as ViewStyle,
  
//   sortBtnText: {
//     fontFamily: FONTS.mono,
//     fontSize: 8,
//     color: '#666',
//     letterSpacing: 1,
//   } as TextStyle,
  
//   gridRow: {
//     justifyContent: 'space-between',
//     paddingHorizontal: 14,
//   } as ViewStyle,
  
//   gridContent: {
//     paddingBottom: 20,
//     gap: 10,
//   } as ViewStyle,
  
//   nftCard: {
//     width: (SCREEN_W - 38) / 2,
//     backgroundColor: COLORS.dexBlack,
//     borderRadius: 8,
//     borderWidth: 2,
//     overflow: 'hidden',
//     position: 'relative',
//   } as ViewStyle,
  
//   nftCardHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//   } as ViewStyle,
  
//   nftCardNumber: {
//     fontFamily: FONTS.mono,
//     fontSize: 10,
//     color: '#888',
//     letterSpacing: 1,
//   } as TextStyle,
  
//   nftCardImageWrap: {
//     alignItems: 'center',
//     paddingVertical: 8,
//     position: 'relative',
//   } as ViewStyle,
  
//   rarityGlow: {
//     position: 'absolute',
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     shadowOpacity: 0.4,
//     shadowRadius: 20,
//     elevation: 0,
//   } as ViewStyle,
  
//   nftCardInfo: {
//     padding: 8,
//   } as ViewStyle,
  
//   nftCardName: {
//     fontFamily: FONTS.mono,
//     fontSize: 11,
//     fontWeight: 'bold',
//     color: COLORS.dexWhite,
//     letterSpacing: 0.5,
//   } as TextStyle,
  
//   nftCardCollection: {
//     fontFamily: FONTS.mono,
//     fontSize: 9,
//     color: '#666',
//     marginBottom: 5,
//   } as TextStyle,
  
//   nftCardTypes: {
//     flexDirection: 'row',
//     gap: 4,
//     marginBottom: 6,
//     flexWrap: 'wrap',
//   } as ViewStyle,
  
//   nftCardFooter: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   } as ViewStyle,
  
//   nftCardPrice: {
//     fontFamily: FONTS.mono,
//     fontSize: 10,
//     color: COLORS.solanaGreen,
//     fontWeight: 'bold',
//   } as TextStyle,
  
//   nftCardRank: {
//     fontFamily: FONTS.mono,
//     fontSize: 9,
//     color: COLORS.ledYellow,
//   } as TextStyle,
  
//   rarityStripe: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     height: 3,
//   } as ViewStyle,
  
//   emptyState: {
//     alignItems: 'center',
//     paddingTop: 60,
//   } as ViewStyle,
  
//   emptyText: {
//     fontFamily: FONTS.mono,
//     fontSize: 13,
//     color: '#555',
//     textAlign: 'center',
//     letterSpacing: 1,
//     lineHeight: 22,
//   } as TextStyle,

//   // ── Detail Screen ──
//   detailScreen: {
//     flex: 1,
//     backgroundColor: COLORS.dexWhite,
//   } as ViewStyle,
  
//   detailTopStrip: {
//     paddingTop: 12,
//     paddingBottom: 60,
//     paddingHorizontal: 16,
//   } as ViewStyle,
  
//   detailTopRow: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 4,
//   } as ViewStyle,
  
//   detailName: {
//     fontFamily: FONTS.mono,
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: COLORS.dexWhite,
//     letterSpacing: 1,
//   } as TextStyle,
  
//   detailNumber: {
//     fontFamily: FONTS.mono,
//     fontSize: 12,
//     color: COLORS.dexWhite + 'CC',
//     letterSpacing: 2,
//   } as TextStyle,
  
//   detailImageFloat: {
//     position: 'absolute',
//     right: 20,
//     bottom: -50,
//     zIndex: 10,
//     shadowColor: '#000',
//     shadowOpacity: 0.3,
//     shadowRadius: 15,
//     elevation: 8,
//   } as ViewStyle,
  
//   detailCard: {
//     flex: 1,
//     backgroundColor: COLORS.dexWhite,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     marginTop: -20,
//     paddingTop: 50,
//     paddingHorizontal: 16,
//   } as ViewStyle,
  
//   navRow: {
//     flexDirection: 'row',
//     marginBottom: 12,
//     alignItems: 'center',
//   } as ViewStyle,
  
//   navBtn: {
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderWidth: 1,
//     borderColor: '#DDD',
//     borderRadius: 4,
//   } as ViewStyle,
  
//   navBtnText: {
//     fontFamily: FONTS.mono,
//     fontSize: 10,
//     color: '#666',
//     letterSpacing: 1,
//   } as TextStyle,
  
//   tabRow: {
//     flexDirection: 'row',
//     borderBottomWidth: 2,
//     borderBottomColor: '#EEE',
//     marginBottom: 12,
//   } as ViewStyle,
  
//   tabBtn: {
//     flex: 1,
//     alignItems: 'center',
//     paddingBottom: 10,
//     borderBottomWidth: 2,
//     borderBottomColor: 'transparent',
//     marginBottom: -2,
//   } as ViewStyle,
  
//   tabBtnActive: {
//     borderBottomColor: COLORS.dexRed,
//   } as ViewStyle,
  
//   tabBtnText: {
//     fontFamily: FONTS.mono,
//     fontSize: 10,
//     color: '#999',
//     letterSpacing: 1,
//     fontWeight: 'bold',
//   } as TextStyle,
  
//   tabBtnTextActive: {
//     color: COLORS.dexRed,
//   } as TextStyle,
  
//   tabContentWrap: {
//     flex: 1,
//   } as ViewStyle,
  
//   tabContent: {
//     flex: 1,
//   } as ViewStyle,

//   // About tab
//   aboutRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingVertical: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F0F0F0',
//   } as ViewStyle,
  
//   aboutLabel: {
//     fontFamily: FONTS.mono,
//     fontSize: 10,
//     color: '#999',
//     letterSpacing: 1,
//   } as TextStyle,
  
//   aboutValue: {
//     fontFamily: FONTS.mono,
//     fontSize: 10,
//     color: COLORS.dexBlack,
//     fontWeight: 'bold',
//     maxWidth: '55%',
//     textAlign: 'right',
//   } as TextStyle,
  
//   sectionTitle: {
//     fontFamily: FONTS.mono,
//     fontSize: 11,
//     fontWeight: 'bold',
//     color: '#888',
//     letterSpacing: 2,
//     marginBottom: 8,
//     marginTop: 4,
//   } as TextStyle,
  
//   descText: {
//     fontFamily: FONTS.mono,
//     fontSize: 11,
//     color: '#444',
//     lineHeight: 18,
//   } as TextStyle,
  
//   abilityRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 6,
//   } as ViewStyle,
  
//   abilityDot: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: COLORS.dexRed,
//     marginRight: 8,
//   } as ViewStyle,
  
//   abilityText: {
//     fontFamily: FONTS.mono,
//     fontSize: 11,
//     color: COLORS.dexBlack,
//   } as TextStyle,
  
//   evolutionRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flexWrap: 'wrap',
//     gap: 6,
//     marginBottom: 16,
//   } as ViewStyle,
  
//   evoChip: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#DDD',
//     backgroundColor: '#F5F5F5',
//   } as ViewStyle,
  
//   evoChipActive: {
//     backgroundColor: COLORS.dexRed,
//     borderColor: COLORS.dexRed,
//   } as ViewStyle,
  
//   evoText: {
//     fontFamily: FONTS.mono,
//     fontSize: 9,
//     color: '#666',
//     letterSpacing: 0.5,
//   } as TextStyle,
  
//   evoArrow: {
//     fontFamily: FONTS.mono,
//     fontSize: 10,
//     color: '#CCC',
//   } as TextStyle,

//   // Stats tab
//   statRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//     gap: 6,
//   } as ViewStyle,
  
//   statLabel: {
//     fontFamily: FONTS.mono,
//     fontSize: 9,
//     color: '#999',
//     width: 60,
//     letterSpacing: 1,
//   } as TextStyle,
  
//   statBarOuter: {
//     flex: 1,
//     flexDirection: 'row',
//     gap: 2,
//     height: 12,
//   } as ViewStyle,
  
//   statSegment: {
//     flex: 1,
//     borderRadius: 1,
//   } as ViewStyle,
  
//   statValue: {
//     fontFamily: FONTS.mono,
//     fontSize: 10,
//     color: COLORS.dexBlack,
//     fontWeight: 'bold',
//     width: 28,
//     textAlign: 'right',
//   } as TextStyle,
  
//   totalRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 8,
//   } as ViewStyle,
  
//   totalLabel: {
//     fontFamily: FONTS.mono,
//     fontSize: 11,
//     color: '#888',
//     letterSpacing: 1,
//   } as TextStyle,
  
//   totalValue: {
//     fontFamily: FONTS.mono,
//     fontSize: 14,
//     fontWeight: 'bold',
//     color: COLORS.dexBlack,
//   } as TextStyle,
  
//   placeholderNote: {
//     fontFamily: FONTS.mono,
//     fontSize: 9,
//     color: '#CCC',
//     fontStyle: 'italic',
//     textAlign: 'center',
//     padding: 12,
//     borderWidth: 1,
//     borderColor: '#EEE',
//     borderRadius: 4,
//     borderStyle: 'dashed',
//   } as TextStyle,

//   // Traits tab
//   traitRow: {
//     marginBottom: 8,
//   } as ViewStyle,
  
//   traitCard: {
//     backgroundColor: '#F8F8F8',
//     borderRadius: 6,
//     padding: 10,
//     borderWidth: 1,
//     borderColor: '#EEE',
//   } as ViewStyle,
  
//   traitLabel: {
//     fontFamily: FONTS.mono,
//     fontSize: 9,
//     color: '#999',
//     letterSpacing: 2,
//   } as TextStyle,
  
//   traitValue: {
//     fontFamily: FONTS.mono,
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: COLORS.dexBlack,
//     marginTop: 2,
//   } as TextStyle,
  
//   traitRarity: {
//     fontFamily: FONTS.mono,
//     fontSize: 9,
//     color: COLORS.dexRed,
//     marginTop: 2,
//   } as TextStyle,

//   // Market tab
//   marketCard: {
//     backgroundColor: '#F8F8F8',
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#EEE',
//     padding: 12,
//     marginBottom: 8,
//   } as ViewStyle,
  
//   marketRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingVertical: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: '#EEE',
//   } as ViewStyle,
  
//   marketLabel: {
//     fontFamily: FONTS.mono,
//     fontSize: 10,
//     color: '#999',
//     letterSpacing: 1,
//   } as TextStyle,
  
//   marketValue: {
//     fontFamily: FONTS.mono,
//     fontSize: 13,
//     fontWeight: 'bold',
//     color: COLORS.dexBlack,
//   } as TextStyle,
  
//   chartPlaceholder: {
//     backgroundColor: '#111',
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 8,
//   } as ViewStyle,
  
//   chartAxisLabel: {
//     fontFamily: FONTS.mono,
//     fontSize: 8,
//     color: '#555',
//   } as TextStyle,
  
//   marketActionBtn: {
//     backgroundColor: COLORS.solanaPurple,
//     borderRadius: 6,
//     paddingVertical: 14,
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: COLORS.solanaPurple,
//   } as ViewStyle,
  
//   marketActionText: {
//     fontFamily: FONTS.mono,
//     fontSize: 12,
//     fontWeight: 'bold',
//     color: COLORS.dexWhite,
//     letterSpacing: 2,
//   } as TextStyle,

//   // ── Shared ──
//   typeBadge: {
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 10,
//   } as ViewStyle,
  
//   typeBadgeText: {
//     fontFamily: FONTS.mono,
//     fontSize: 8,
//     fontWeight: 'bold',
//     color: COLORS.dexWhite,
//     letterSpacing: 0.5,
//   } as TextStyle,
  
//   rarityBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     borderRadius: 10,
//     borderWidth: 1.5,
//     backgroundColor: 'transparent',
//   } as ViewStyle,
  
//   rarityText: {
//     fontFamily: FONTS.mono,
//     fontSize: 8,
//     fontWeight: 'bold',
//     letterSpacing: 1,
//   } as TextStyle,
  
//   nftPlaceholder: {
//     borderRadius: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 2,
//     borderColor: '#333',
//     borderStyle: 'dashed',
//   } as ViewStyle,
  
//   pixelMonster: {
//     alignItems: 'center',
//     justifyContent: 'center',
//   } as ViewStyle,
// });