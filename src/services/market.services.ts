// services/marketplace.service.ts
export interface MarketData {
  floorPrice: number;
  listedCount: number;
  volume24h: number;
}

class MarketplaceService {
  private magicEdenApi = 'https://api-mainnet.magiceden.dev/v2';
  private tensorApi = 'https://api.tensor.so/graphql';

  async getCollectionFloor(collectionSymbol: string): Promise<number> {
    try {
      // Try Magic Eden first
      const meResponse = await fetch(`${this.magicEdenApi}/collections/${collectionSymbol}/stats`);
      if (meResponse.ok) {
        const data = await meResponse.json();
        return data.floorPrice || 0;
      }

      // Fallback to Tensor
      const tensorResponse = await fetch(this.tensorApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query CollectionStats($slug: String!) {
              collection(slug: $slug) {
                stats {
                  floorPrice
                }
              }
            }
          `,
          variables: { slug: collectionSymbol }
        })
      });

      if (tensorResponse.ok) {
        const data = await tensorResponse.json();
        return data.data?.collection?.stats?.floorPrice || 0;
      }

      return 0;
    } catch (error) {
      console.error('Error fetching floor price:', error);
      return 0;
    }
  }

  // Extract collection symbol from name or address
  extractCollectionSymbol(collectionName: string): string {
    return collectionName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}

export const marketplaceService = new MarketplaceService();