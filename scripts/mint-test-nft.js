require('dotenv').config();

const API_KEY = process.env.API_KEY || process.env.HELIUS_API_KEY;
// IMPORTANT: Put your wallet address here!
const WALLET_ADDRESS = 'BxSo6A8Ytpe2a2ri1wQKoE48yiHc1wyozwiHsYhyCNCX';

const POKEMON_DATA = [
    { name: 'Bulbasaur', id: 1, type: 'Grass' },
    { name: 'Charmander', id: 4, type: 'Fire' },
    { name: 'Squirtle', id: 7, type: 'Water' },
    { name: 'Pikachu', id: 25, type: 'Electric' },
    { name: 'Gengar', id: 94, type: 'Ghost' },
    { name: 'Mewtwo', id: 150, type: 'Psychic' },
];

async function mintNFT() {
    if (!API_KEY) {
        console.error('❌ API_KEY not found in .env');
        return;
    }

    const randomPokemon = POKEMON_DATA[Math.floor(Math.random() * POKEMON_DATA.length)];
    const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${randomPokemon.id}.png`;

    // Randomize some stats
    const power = Math.floor(Math.random() * 60) + 40;
    const speed = Math.floor(Math.random() * 60) + 40;

    const url = `https://devnet.helius-rpc.com/?api-key=${API_KEY}`;

    console.log(`🚀 Minting a random NFT: ${randomPokemon.name} on Devnet...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'helius-test',
                method: 'mintCompressedNft',
                params: {
                    name: `Mintlore ${randomPokemon.name}`,
                    symbol: 'MLRT',
                    owner: WALLET_ADDRESS,
                    description: `A randomized ${randomPokemon.type} type test NFT.`,
                    attributes: [
                        { trait_type: 'Species', value: randomPokemon.name },
                        { trait_type: 'Type', value: randomPokemon.type },
                        { trait_type: 'Level', value: power.toString() }
                    ],
                    imageUrl: imageUrl
                    // uri: imageUrl, // Removed to fix 'invalid request params'
                }
            })
        });

        const data = await response.json();
        if (data.result) {
            console.log('✅ NFT Minted Successfully!');
            console.log('Asset ID:', data.result.assetId);
            console.log('Signature:', data.result.signature);
            console.log('\nWait a minute for indexing, then scan your wallet!');
        } else {
            console.error('❌ Minting failed:', data.error);
        }
    } catch (error) {
        console.error('❌ Request failed:', error);
    }
}

mintNFT();
