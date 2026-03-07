import AsyncStorage from '@react-native-async-storage/async-storage';
import { DiscoveredEntry, NFT, DiscoverySource } from '../types';

const DISCOVERY_STORAGE_KEY = 'mintlore-discovery-log';

export const discoveryStorage = {
    /**
     * Get all discovered NFT entries from storage
     */
    async getAllDiscovered(): Promise<DiscoveredEntry[]> {
        try {
            const data = await AsyncStorage.getItem(DISCOVERY_STORAGE_KEY);
            if (!data) return [];
            return JSON.parse(data);
        } catch (error) {
            console.error('[DiscoveryStorage] Failed to read discovery log:', error);
            return [];
        }
    },

    /**
     * Save a list of NFTs to the discovery log, deduping by mintAddress.
     */
    async saveDiscovered(nfts: NFT[], source: DiscoverySource): Promise<void> {
        try {
            const existing = await this.getAllDiscovered();
            const now = Date.now();

            const newEntries = nfts.map(nft => ({
                nft,
                discoveredAt: now,
                source,
            }));

            // Combine and deduplicate by mintAddress, keeping the earliest discovery if already exists
            const combined = [...existing];

            newEntries.forEach(newEntry => {
                const index = combined.findIndex(e => e.nft.mintAddress === newEntry.nft.mintAddress);
                if (index === -1) {
                    combined.push(newEntry);
                } else {
                    // Update the NFT data (could have changed) but keep original discovery date?
                    // Actually, let's update everything but keep the oldest date.
                    const oldDate = combined[index].discoveredAt;
                    combined[index] = {
                        ...newEntry,
                        discoveredAt: oldDate,
                    };
                }
            });

            // Sort by discovery date descending (newest first)
            combined.sort((a, b) => b.discoveredAt - a.discoveredAt);

            await AsyncStorage.setItem(DISCOVERY_STORAGE_KEY, JSON.stringify(combined));
            console.log(`[DiscoveryStorage] Saved ${nfts.length} NFTs to log. Total: ${combined.length}`);
        } catch (error) {
            console.error('[DiscoveryStorage] Failed to save to discovery log:', error);
        }
    },

    /**
     * Toggle favorite status in storage
     */
    async toggleFavorite(mintAddress: string): Promise<void> {
        try {
            const existing = await this.getAllDiscovered();
            const index = existing.findIndex(e => e.nft.mintAddress === mintAddress);
            if (index !== -1) {
                existing[index].nft.isFavorite = !existing[index].nft.isFavorite;
                await AsyncStorage.setItem(DISCOVERY_STORAGE_KEY, JSON.stringify(existing));
            }
        } catch (error) {
            console.error('[DiscoveryStorage] Failed to toggle favorite:', error);
        }
    },

    /**
     * Clear all discovery data
     */
    async clearAll(): Promise<void> {
        try {
            await AsyncStorage.removeItem(DISCOVERY_STORAGE_KEY);
        } catch (error) {
            console.error('[DiscoveryStorage] Failed to clear discovery log:', error);
        }
    }
};
