// test/helius.test.ts
import { heliusService } from '../services/helius.service';

async function testScan() {
  // Use a known wallet with NFTs (e.g., a popular collection wallet)
  const testWallet = 'ATokenAddressWithNFTsHere';
  
  try {
    console.log('Testing wallet scan...');
    const nfts = await heliusService.scanWallet(testWallet);
    
    console.log(`✅ Found ${nfts.length} NFTs`);
    console.log('Sample NFT:', nfts[0]);
    
    // Test a specific NFT
    if (nfts.length > 0) {
      console.log('Testing image fetch...');
      const imageUrl = await heliusService.fetchNFTImage(nfts[0].mintAddress);
      console.log('Image URL:', imageUrl);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testScan();