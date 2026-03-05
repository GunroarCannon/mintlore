// services/helius.service.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { NFT, Attribute, Rarity, PokemonType, ScanProgress } from '../types';
import { API_KEY, RPC_ENDPOINT } from '@env';

import { cacheService } from './cache.service';
import { colorService } from './color.service';

// Define Helius asset type locally for the DAS API response
interface HeliusAsset {
  id: string;
  content: {
    metadata: {
      name: string;
      symbol: string;
      description: string;
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
  // Use the constant Program ID instead of the broken class import
  private readonly METADATA_PROGRAM_ID = new PublicKey('metaqbxxUf2WpBR1E4CwbcvcrGsn6vGj6yDrsTdQ6tH');

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

      onProgress?.({
        phase: 'FETCHING ASSETS',
        current: 0,
        total: 100,
        percentage: 10
      });

      // Use cached assets unless forceRefresh is true
      let assets: HeliusAsset[];
      const cacheKey = `assets_owner_${walletAddress}`;
      const cached = forceRefresh ? null : cacheService.get<HeliusAsset[]>(cacheKey);

      if (cached) {
        console.log('Returning cached assets for', walletAddress);
        assets = cached;
      } else {
        assets = await this.getAssetsByOwner(walletAddress);
        cacheService.set(cacheKey, assets, 2 * 60 * 1000); // Cache for 2 minutes
      }

      console.log(`Found ${assets.length} assets`);

      onProgress?.({
        phase: 'PROCESSING NFTs',
        current: 0,
        total: assets.length,
        percentage: 30
      });

      // Process assets with concurrency control and progress updates
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

      // Calculate rarity with cached collection data
      const collections = this.groupByCollection(nfts);
      await Promise.all(
        Object.entries(collections).map(([collectionId, collectionNfts]) =>
          this.enrichWithRarity(collectionNfts, collectionId)
        )
      );

      onProgress?.({
        phase: 'COMPLETE',
        current: assets.length,
        total: assets.length,
        percentage: 100
      });

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

      const normalizeUrl = this.normalizeImageUrl(imageUrl);
      const { type1, type2 } = await this.mapToPokemonType(attributes, metadata.name, normalizeUrl);

      const nft: NFT = {
        id: asset.id,
        mintAddress: asset.id,
        name: metadata.name || 'Unnamed NFT',
        collection: collectionId,
        image: normalizeUrl,
        rarity: 'common',
        type1: type1,
        type2: type2,
        number: this.extractNumber(metadata.name),
        description: metadata.description || 'No description available',
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

      // Note: Full on-chain parsing requires a buffer parser. 
      // Helius usually provides the image in content.links.image.
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
    return (rawAttributes || []).map(attr => ({
      trait: attr.trait_type || 'Unknown',
      value: typeof attr.value === 'number' ? attr.value : 50,
      max: 100,
    })).filter(attr => attr.trait !== 'Unknown');
  }

  private extractNumber(name: string): string {
    const match = name.match(/#(\d+)/) || name.match(/(\d+)$/);
    return match ? match[1].padStart(3, '0') : '???';
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

    // 1. Highly specialized traits (Mastery)
    const masteries = attributes
      .filter(a => a.value > 90)
      .map(a => `${a.trait} Mastery`);
    abilities.push(...masteries);

    // 2. Type-specific moves
    const typeMoves = [...(this.MOVE_POOL[type1] || [])];
    if (type2) typeMoves.push(...(this.MOVE_POOL[type2] || []));

    // Deterministic selection based on attributes to keep it consistent
    const seed = attributes.reduce((acc, a) => acc + a.value, 0);
    const shuffled = [...typeMoves].sort((a, b) =>
      (seed % a.length) - (seed % b.length)
    );

    abilities.push(...shuffled);

    // Ensure we always have 3 and they are unique
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

    // 1. Keyword matching
    for (const [key, val] of Object.entries(typeMappings)) {
      if (searchString.includes(key.toLowerCase())) {
        if (type1 === 'normal') type1 = val;
        else if (!type2 && val !== type1) { type2 = val; break; }
      }
    }

    // 2. Color sampling fallback (if still normal or no type2)
    if (type1 === 'normal' && imageUrl) {
      const color = await colorService.getDominantColor(imageUrl);
      type1 = colorService.mapColorToType(color);
    }

    // 3. Randomization fallback (last resort)
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