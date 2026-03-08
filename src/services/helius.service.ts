// services/helius.service.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { NFT, Attribute, Rarity, PokemonType, ScanProgress } from '../types';
import { API_KEY, RPC_ENDPOINT } from '@env';

import { cacheService } from './cache.service';
import { colorService } from './color.service';
import { aiService } from './ai.service';

// Define Helius asset type locally for the DAS API response
interface HeliusAsset {
  id: string;
  content: {
    metadata: {
      name: string;
      symbol: string;
      description?: string;
      attributes?: Array<{
        trait_type: string;
        value: string | number;
      }>;
    };
    links: {
      image: string;
    };
  };
  grouping: Array<{
    group_key: string;
    group_value: string;
  }>;
  supply: {
    print_max_supply: number;
    print_current_supply: number;
  };
  ownership: {
    owner: string;
  };
}

interface RarityConfig {
  legendary: number;
  epic: number;
  rare: number;
  uncommon: number;
  common: number;
}

const typeMappings: Record<string, PokemonType> = {
  'Fire': 'fire', 'Flame': 'fire', 'Inferno': 'fire',
  'Water': 'water', 'Aqua': 'water', 'Ocean': 'water',
  'Grass': 'grass', 'Nature': 'grass', 'Leaf': 'grass',
  'Electric': 'electric', 'Lightning': 'electric', 'Volt': 'electric',
  'Psychic': 'psychic', 'Mind': 'psychic',
  'Ghost': 'ghost', 'Spectral': 'ghost',
  'Dragon': 'dragon', 'Drake': 'dragon',
  'Dark': 'dark', 'Shadow': 'dark',
  'Steel': 'steel', 'Iron': 'steel',
  'Normal': 'normal'
};

export class HeliusService {
  private rpcUrl: string;
  private connection: Connection;
  private readonly METADATA_PROGRAM_ID = new PublicKey('metaqbxxUf2WpBR1E4CwbcvcrGsn6vGj6yDrsTdQ6tH');

  // Cache collection symbol -> floor price to avoid hammering ME API
  private floorPriceCache: Map<string, { price: number; ts: number }> = new Map();
  private readonly FLOOR_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.rpcUrl = RPC_ENDPOINT;
    this.connection = new Connection(this.rpcUrl);
  }

  async scanWallet(
    walletAddress: string,
    onProgress?: (progress: ScanProgress) => void,
    forceRefresh: boolean = false
  ): Promise<NFT[]> {
    try {
      console.log(`Scanning wallet: ${walletAddress} (forceRefresh: ${forceRefresh})`);

      onProgress?.({ phase: 'FETCHING ASSETS', current: 0, total: 100, percentage: 10 });

      let assets: HeliusAsset[];
      const cacheKey = `assets_owner_${walletAddress}`;
      const cached = forceRefresh ? null : cacheService.get<HeliusAsset[]>(cacheKey);

      if (cached) {
        console.log('Returning cached assets for', walletAddress);
        assets = cached;
      } else {
        assets = await this.getAssetsByOwner(walletAddress);
        cacheService.set(cacheKey, assets, 2 * 60 * 1000);
      }

      console.log(`Found ${assets.length} assets`);

      onProgress?.({ phase: 'PROCESSING NFTs', current: 0, total: assets.length, percentage: 30 });

      const nfts: NFT[] = [];
      const concurrency = 5;

      for (let i = 0; i < assets.length; i += concurrency) {
        const batch = assets.slice(i, i + concurrency);
        const batchResults = await Promise.all(
          batch.map(asset => this.processAsset(asset, walletAddress))
        );
        nfts.push(...batchResults);

        onProgress?.({
          phase: 'PROCESSING NFTs',
          current: Math.min(i + concurrency, assets.length),
          total: assets.length,
          percentage: 30 + (Math.min(i + concurrency, assets.length) / assets.length) * 40
        });
      }

      onProgress?.({ phase: 'FETCHING MARKET DATA', current: 0, total: nfts.length, percentage: 85 });

      await this.enrichWithMarketData(nfts);

      onProgress?.({ phase: 'COMPLETE', current: assets.length, total: assets.length, percentage: 100 });

      return nfts;
    } catch (error: any) {
      console.error('Scan failed:', error);
      throw new Error(`Failed to scan wallet: ${error.message}`);
    }
  }

  private async getAssetsByOwner(walletAddress: string): Promise<HeliusAsset[]> {
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'scan-' + Date.now(),
          method: 'getAssetsByOwner',
          params: {
            ownerAddress: walletAddress,
            page: 1,
            limit: 1000,
            displayOptions: { showFungible: false }
          }
        })
      });

      const data = await response.json();
      return data.result?.items || [];
    } catch (error) {
      console.error('Error fetching assets:', error);
      return [];
    }
  }

  private async processAsset(asset: HeliusAsset, owner: string): Promise<NFT> {
    try {
      const metadata = asset.content?.metadata || {};
      const attributes = this.processAttributes(metadata.attributes || []);
      const collection = asset.grouping?.find(g => g.group_key === 'collection');
      const collectionId = collection?.group_value || 'Unknown Collection';

      let imageUrl = asset.content?.links?.image || null;
      if (!imageUrl) {
        imageUrl = await this.fetchNFTImage(asset.id);
      }

      const normalizedUrl = this.normalizeImageUrl(imageUrl);
      const { type1, type2 } = await this.mapToPokemonType(attributes, metadata.name, normalizedUrl);

      // FIX: Use real supply-based rarity, not random override
      const rarity = this.calculateSupplyRarity(asset, attributes);

      const baseDescription = metadata.description || 'No description available';

      // FIX: Also check attributes for the number (edition, serial, etc.)
      const number = this.extractNumber(metadata.name, attributes);

      const nft: NFT = {
        id: asset.id,
        mintAddress: asset.id,
        name: metadata.name || 'Unnamed NFT',
        collection: collectionId,
        // Store symbol for ME floor price lookup
        symbol: metadata.symbol || '',
        image: normalizedUrl,
        rarity: rarity,
        type1: type1,
        type2: type2,
        number: number,
        description: baseDescription,
        attributes: attributes,
        floorPrice: 0,
        lastSale: 0,
        holderCount: 1,
        totalSupply: asset.supply?.print_max_supply || 1,
        rank: 0,
        evolution: [],
        abilities: this.deriveAbilities(attributes, type1, type2),
        owner: owner,
        isFavorite: false,
      };

      return nft;
    } catch (error) {
      return this.getErrorNFT(asset.id, owner);
    }
  }

  // FIX: Real rarity based on supply — no random override
  private calculateSupplyRarity(asset: HeliusAsset, attributes: Attribute[]): Rarity {
    const maxSupply = asset.supply?.print_max_supply;

    if (maxSupply && maxSupply > 0) {
      if (maxSupply === 1) return 'legendary';
      if (maxSupply <= 10) return 'epic';
      if (maxSupply <= 100) return 'rare';
      if (maxSupply <= 500) return 'uncommon';
      return 'common';
    }

    // No supply data — fall back to weighted random as last resort
    return this.getWeightedRandomRarity();
  }

  public async fetchNFTImage(mintAddress: string): Promise<string | null> {
    try {
      const [metadataPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          this.METADATA_PROGRAM_ID.toBuffer(),
          new PublicKey(mintAddress).toBuffer()
        ],
        this.METADATA_PROGRAM_ID
      );

      const accountInfo = await this.connection.getAccountInfo(metadataPDA);
      if (!accountInfo) return null;

      return null;
    } catch {
      return null;
    }
  }

  private normalizeImageUrl(url: string | null): string | null {
    if (!url) return null;
    if (url.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${url.replace('ipfs://', '')}`;
    if (url.startsWith('ar://')) return `https://arweave.net/${url.replace('ar://', '')}`;
    return url;
  }

  private processAttributes(rawAttributes: any[]): Attribute[] {
    return (rawAttributes || []).map(attr => {
      const val = attr.value;
      const isNum = typeof val === 'number' && !isNaN(val);
      return {
        trait: attr.trait_type || 'Unknown',
        value: isNum ? val : 0,
        displayValue: String(val),
        max: 100,
      };
    }).filter(attr => attr.trait !== 'Unknown');
  }

  // FIX: Also check attributes for edition/serial numbers
  private extractNumber(name: string, attributes?: Attribute[]): string {
    // 1. Check attributes first for explicit edition/number fields
    if (attributes?.length) {
      const numberAttr = attributes.find(a =>
        ['edition', 'number', 'id', 'serial', 'token_id', '#'].includes(a.trait.toLowerCase())
      );
      if (numberAttr && numberAttr.displayValue) {
        const num = numberAttr.displayValue.replace(/\D/g, '');
        if (num) return num.padStart(3, '0');
      }
    }

    // 2. # followed by digits in name
    let match = name?.match(/#(\d+)/);
    if (match) return match[1].padStart(3, '0');

    // 3. Trailing digits
    match = name?.match(/(\d+)$/);
    if (match) return match[1].padStart(3, '0');

    // 4. Any digits
    match = name?.match(/\d+/);
    if (match) return match[0].padStart(3, '0');

    return '???';
  }

  private readonly MOVE_POOL: Record<PokemonType, string[]> = {
    fire: ['Flamethrower', 'Fire Blast', 'Ember', 'Heat Wave', 'Burn Out'],
    water: ['Hydro Pump', 'Surf', 'Aqua Jet', 'Water Gun', 'Rain Dance'],
    grass: ['Solar Beam', 'Razor Leaf', 'Vine Whip', 'Synthesis', 'Petal Dance'],
    electric: ['Thunderbolt', 'Thunder', 'Spark', 'Volt Tackle', 'Charge'],
    psychic: ['Confusion', 'Psybeam', 'Psychic', 'Mind Reader', 'Hypnosis'],
    ghost: ['Shadow Ball', 'Lick', 'Night Shade', 'Confuse Ray', 'Curse'],
    dragon: ['Dragon Breath', 'Dragon Claw', 'Outrage', 'Dragon Dance', 'Twister'],
    dark: ['Bite', 'Crunch', 'Dark Pulse', 'Night Slash', 'Feint Attack'],
    steel: ['Iron Head', 'Steel Wing', 'Metal Claw', 'Flash Cannon', 'Iron Defense'],
    normal: ['Tackle', 'Quick Attack', 'Scratch', 'Slam', 'Hyper Beam'],
  };

  private deriveAbilities(attributes: Attribute[], type1: PokemonType, type2?: PokemonType): string[] {
    const abilities: string[] = [];

    const masteries = attributes
      .filter(a => a.value > 90)
      .map(a => `${a.trait} Mastery`);
    abilities.push(...masteries);

    const typeMoves = [...(this.MOVE_POOL[type1] || [])];
    if (type2) typeMoves.push(...(this.MOVE_POOL[type2] || []));

    const seed = attributes.reduce((acc, a) => acc + a.value, 0);
    const shuffled = [...typeMoves].sort((a, b) =>
      (seed % a.length) - (seed % b.length)
    );

    abilities.push(...shuffled);
    return [...new Set(abilities)].slice(0, 3);
  }

  private async mapToPokemonType(
    attributes: Attribute[],
    name: string,
    imageUrl: string | null
  ): Promise<{ type1: PokemonType; type2?: PokemonType }> {
    let type1: PokemonType = 'normal';
    let type2: PokemonType | undefined;
    const searchString = (name + attributes.map(a => a.trait).join('')).toLowerCase();

    for (const [key, val] of Object.entries(typeMappings)) {
      if (searchString.includes(key.toLowerCase())) {
        if (type1 === 'normal') type1 = val;
        else if (!type2 && val !== type1) { type2 = val; break; }
      }
    }

    if (type1 === 'normal' && imageUrl) {
      const color = await colorService.getDominantColor(imageUrl);
      type1 = colorService.mapColorToType(color);
    }

    if (type1 === 'normal') {
      const types: PokemonType[] = Object.values(typeMappings);
      type1 = types[Math.floor(Math.random() * types.length)];
      if (Math.random() > 0.7) {
        type2 = types[Math.floor(Math.random() * types.length)];
        if (type2 === type1) type2 = undefined;
      }
    }

    return { type1, type2 };
  }

  private groupByCollection(nfts: NFT[]): Record<string, NFT[]> {
    return nfts.reduce<Record<string, NFT[]>>((acc, nft) => {
      if (!acc[nft.collection]) acc[nft.collection] = [];
      acc[nft.collection].push(nft);
      return acc;
    }, {});
  }

  private async enrichWithRarity(collectionNfts: NFT[], collectionId: string) {
    const collectionAssets = await this.getAssetsByCollection(collectionId);
    for (const nft of collectionNfts) {
      nft.rarity = await this.calculateRarity(nft, collectionAssets);
      const sorted = [...collectionNfts].sort((a, b) => this.calculateRarityScore(b) - this.calculateRarityScore(a));
      nft.rank = sorted.findIndex(n => n.id === nft.id) + 1;
    }
  }

  public async calculateRarityForNft(nft: NFT): Promise<{ rarity: Rarity; rank: number }> {
    if (nft.collection === 'Unknown Collection') return { rarity: nft.rarity, rank: nft.rank };

    try {
      console.log(`[HeliusService] Calculating rarity for ${nft.name} in collection ${nft.collection}`);
      const collectionAssets = await this.getAssetsByCollection(nft.collection);

      if (!collectionAssets.length) return { rarity: 'common', rank: 1 };

      const score = this.calculateAttributeRarity(nft, collectionAssets);
      const percentile = (1 - (score / (nft.attributes.length || 1))) * 100;

      let rarity: Rarity = 'common';
      if (percentile <= 1) rarity = 'legendary';
      else if (percentile <= 5) rarity = 'epic';
      else if (percentile <= 20) rarity = 'rare';
      else if (percentile <= 50) rarity = 'uncommon';

      const sorted = collectionAssets
        .map(asset => ({
          id: asset.id,
          score: this.calculateAttributeRarityFromAsset(asset, collectionAssets)
        }))
        .sort((a, b) => b.score - a.score);

      const rank = sorted.findIndex(s => s.id === nft.id) + 1 || 1;

      return { rarity, rank };
    } catch (e) {
      console.error('[HeliusService] Rarity calculation error:', e);
      return { rarity: nft.rarity, rank: nft.rank };
    }
  }

  // FIX: Real floor price via Magic Eden free API (no key needed)
  // Uses collection symbol from metadata (e.g. "degods", "okay_bears")
  private async getMagicEdenFloorPrice(symbol: string): Promise<number> {
    if (!symbol) return 0;

    const normalizedSymbol = symbol.toLowerCase().replace(/\s+/g, '_');

    // Check in-memory cache first
    const cached = this.floorPriceCache.get(normalizedSymbol);
    if (cached && Date.now() - cached.ts < this.FLOOR_CACHE_TTL) {
      return cached.price;
    }

    try {
      const response = await fetch(
        `https://api-mainnet.magiceden.dev/v2/collections/${normalizedSymbol}/stats`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (!response.ok) {
        console.warn(`[HeliusService] ME floor price not found for symbol: ${normalizedSymbol}`);
        return 0;
      }

      const data = await response.json();
      // Magic Eden returns floorPrice in lamports
      const floorInSol = data?.floorPrice ? data.floorPrice / 1e9 : 0;

      this.floorPriceCache.set(normalizedSymbol, { price: floorInSol, ts: Date.now() });
      console.log(`[HeliusService] ME floor price for ${normalizedSymbol}: ${floorInSol} SOL`);
      return floorInSol;
    } catch (e) {
      console.error(`[HeliusService] Magic Eden fetch error for ${normalizedSymbol}:`, e);
      return 0;
    }
  }

  // FIX: getMarketData now uses Magic Eden for floor price
  public async getMarketData(
    mintAddress: string,
    collectionSymbol?: string
  ): Promise<{ floorPrice: number; lastSale: number }> {
    try {
      console.log(`[HeliusService] Fetching market data for ${mintAddress}`);

      // Fetch asset to get symbol if not provided
      let symbol = collectionSymbol || '';

      if (!symbol) {
        const heliusResponse = await fetch(this.rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'market-' + Date.now(),
            method: 'getAsset',
            params: { id: mintAddress, displayOptions: { showCollectionMetadata: true } }
          })
        });

        if (heliusResponse.ok) {
          const heliusData = await heliusResponse.json();
          const asset = heliusData.result;
          // Try symbol from metadata, then collection metadata
          symbol = asset?.content?.metadata?.symbol
            || asset?.collection_metadata?.symbol
            || '';
        }
      }

      // Get floor price from Magic Eden using the symbol
      const floorPrice = await this.getMagicEdenFloorPrice(symbol);

      // Last sale: try Magic Eden activities endpoint (also free)
      let lastSale = 0;
      try {
        const activityRes = await fetch(
          `https://api-mainnet.magiceden.dev/v2/tokens/${mintAddress}/activities?offset=0&limit=1`,
          { headers: { 'Accept': 'application/json' } }
        );
        if (activityRes.ok) {
          const activities = await activityRes.json();
          const lastSaleActivity = activities?.find((a: any) => a.type === 'buyNow');
          if (lastSaleActivity?.price) {
            lastSale = lastSaleActivity.price; // Already in SOL from ME v2
          }
        }
      } catch (e) {
        console.warn('[HeliusService] Could not fetch last sale activity:', e);
      }

      return { floorPrice, lastSale };
    } catch (e) {
      console.error('[HeliusService] Market data fetch error:', e);
      return { floorPrice: 0, lastSale: 0 };
    }
  }

  // FIX: enrichWithMarketData now passes the symbol to getMarketData
  public async enrichWithMarketData(nfts: NFT[]) {
    const collections = [...new Set(nfts.map(n => n.collection))].filter(c => c !== 'Unknown Collection');

    for (const collectionId of collections) {
      try {
        const sampleNft = nfts.find(n => n.collection === collectionId);
        if (!sampleNft) continue;

        // Pass the symbol so we avoid a redundant getAsset call
        const symbol = (sampleNft as any).symbol || '';
        const mData = await this.getMarketData(sampleNft.mintAddress, symbol);

        nfts.filter(n => n.collection === collectionId).forEach(nft => {
          nft.floorPrice = mData.floorPrice;
          // Only set lastSale on the specific NFT, not the whole collection
        });

        // Set lastSale on the sample NFT (most expensive lookup, skip for others)
        sampleNft.lastSale = mData.lastSale;
      } catch (e) {
        console.error(`[HeliusService] Failed to enrich collection ${collectionId}:`, e);
      }
    }
  }

  private calculateAttributeRarityFromAsset(asset: HeliusAsset, collection: HeliusAsset[]): number {
    const assetAttributes = this.processAttributes(asset.content?.metadata?.attributes || []);
    return assetAttributes.reduce((total, attr) => {
      const count = collection.filter(a =>
        (a.content?.metadata?.attributes || []).some(ra => ra.trait_type === attr.trait && String(ra.value) === String(attr.value))
      ).length;
      return total + (1 - (count / collection.length));
    }, 0);
  }

  private async calculateRarity(nft: NFT, collectionAssets: HeliusAsset[]): Promise<Rarity> {
    if (!collectionAssets.length) return 'common';
    const score = this.calculateAttributeRarity(nft, collectionAssets);
    const percentile = (1 - (score / (nft.attributes.length || 1))) * 100;

    if (percentile <= 1) return 'legendary';
    if (percentile <= 5) return 'epic';
    if (percentile <= 20) return 'rare';
    if (percentile <= 50) return 'uncommon';
    return 'common';
  }

  private calculateAttributeRarity(nft: NFT, collection: HeliusAsset[]): number {
    return nft.attributes.reduce((total, attr) => {
      const count = collection.filter(a =>
        (a.content?.metadata?.attributes || []).some(ra => ra.trait_type === attr.trait && String(ra.value) === String(attr.value))
      ).length;
      return total + (1 - (count / collection.length));
    }, 0);
  }

  private calculateRarityScore(nft: NFT): number {
    return nft.attributes.reduce((s, a) => s + (a.value / a.max), 0);
  }

  private async getAssetsByCollection(collectionId: string): Promise<HeliusAsset[]> {
    if (collectionId === 'Unknown Collection') return [];
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'coll-' + Date.now(),
          method: 'getAssetsByGroup',
          params: { groupKey: 'collection', groupValue: collectionId, page: 1, limit: 1000 }
        })
      });
      const data = await response.json();
      return data.result?.items || [];
    } catch {
      return [];
    }
  }

  private getWeightedRandomRarity(): Rarity {
    const weights = {
      legendary: 1,
      epic: 50,
      rare: 400,
      uncommon: 700,
      common: 1000
    };

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    const random = Math.random() * totalWeight;

    let cumulative = 0;
    for (const [rarity, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (random < cumulative) return rarity as Rarity;
    }

    return 'common';
  }

  private getErrorNFT(id: string, owner: string): NFT {
    return {
      id, mintAddress: id, name: 'Error loading', collection: 'Unknown',
      image: null, rarity: 'common', type1: 'normal', number: '???',
      description: 'Failed to load', attributes: [], floorPrice: 0,
      lastSale: 0, holderCount: 1, totalSupply: 1, rank: 0,
      evolution: [], abilities: ['Unknown'], owner, isFavorite: false
    };
  }
}

export const heliusService = new HeliusService();