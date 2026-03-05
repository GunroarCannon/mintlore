require('dotenv').config();

const API_KEY = process.env.API_KEY || process.env.HELIUS_API_KEY;
// The wallet address you used for minting
const WALLET_ADDRESS = 'BxSo6A8Ytpe2a2ri1wQKoE48yiHc1wyozwiHsYhyCNCX';

async function checkWallet() {
    if (!API_KEY) {
        console.error('❌ API_KEY not found in .env');
        return;
    }

    // Check DEVNET first as that is where you minted
    const url = `https://devnet.helius-rpc.com/?api-key=${API_KEY}`;

    console.log(`🔍 Checking Devnet assets for: ${WALLET_ADDRESS}...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'helius-test',
                method: 'getAssetsByOwner',
                params: {
                    ownerAddress: WALLET_ADDRESS,
                    page: 1,
                    limit: 100,
                    displayOptions: {
                        showFungible: false
                    }
                }
            })
        });

        const data = await response.json();
        if (data.result && data.result.items) {
            console.log(`✅ Found ${data.result.items.length} assets!`);
            data.result.items.forEach((item, index) => {
                console.log(`\n[${index + 1}] Name: ${item.content.metadata.name}`);
                console.log(`    ID: ${item.id}`);
                console.log(`    Compression: ${item.compression.compressed ? 'YES' : 'NO'}`);
            });
        } else {
            console.log('❓ No assets found on Devnet. Error:', data.error || 'Unknown error');
        }
    } catch (error) {
        console.error('❌ Request failed:', error);
    }
}

checkWallet();
