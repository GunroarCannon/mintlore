# Mintlore

A mobile-first NFT explorer and scanner built on Solana. Mintlore transforms the experience of viewing digital assets into a nostalgic, Pokedex-inspired adventure — scan any wallet, no funded account required, and watch your collection come alive.

---

<img width="261" height="545" alt="Screenshot 2026-03-08 112113" src="https://github.com/user-attachments/assets/e18eb228-6e76-4d42-a577-acdf944c5a82" />


## What It Is

Mintlore is a React Native app that lets anyone explore Solana NFT wallets through a premium, game-inspired interface. It is designed to make the Solana ecosystem more accessible: you do not need your own wallet, you do not need SOL, and you do not need any prior Web3 knowledge. Just paste a wallet address, scan a QR code, and discover.

It is the kind of app you hand someone when you want to show them what Web3 actually feels like.

---

## Features

<img width="1024" height="1024" alt="mintlore-icon_old" src="https://github.com/user-attachments/assets/75f921fb-a68b-4155-be4a-7dd69a5970a1" />

- Wallet scanner powered by the Helius DAS API
- QR code scanning for instant wallet lookup or Mintlore-to-Mintlore NFT sharing
- Pokedex-style NFT display with type assignment, rarity ranking, and ability derivation
- Real-time floor prices via Magic Eden (no API key required)
- Dark-themed, 3D-styled UI with smooth animations
- Curated retro soundtrack with in-app audio controls
- No wallet connection required to browse any public wallet
- MWA (Mobile Wallet Adapter) support for connecting your own wallet
- Offline-resilient caching layer for fast repeat scans

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo |
| Blockchain | Solana (via Helius DAS API) |
| NFT Data | Helius `getAssetsByOwner`, `getAsset` |
| Market Data | Magic Eden v2 REST API |
| Audio | expo-av |
| QR Scanning | expo-camera (CameraView) |
| QR Sharing | react-native-qrcode-svg + js-base64 |
| Wallet Adapter | Mobile Wallet Adapter (MWA) |
| Color Analysis | Custom dominant color service |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- Android device or emulator (primary target)
- A Helius API key and RPC endpoint

### Installation

```bash
git clone https://github.com/yourhandle/mintlore.git
cd mintlore
npm install
```

### Environment

Create a `.env` file in the root:

```
API_KEY=your_helius_api_key
RPC_ENDPOINT=https://mainnet.helius-rpc.com/?api-key=your_helius_api_key
```

### Running

```bash
npx expo start
```

For Android (recommended):
```bash
npx expo run:android
```

---

## How It Works

### Scanning

1. Enter any Solana wallet address or scan a QR code
2. Mintlore calls the Helius DAS `getAssetsByOwner` endpoint
3. Each NFT is processed: image normalized, type derived from metadata keywords and dominant color analysis, rarity calculated from supply data
4. Floor prices are fetched from Magic Eden using the collection symbol
5. Results are cached for 2 minutes to keep repeat scans fast

### Type Assignment

NFTs are assigned Pokedex-style types (fire, water, electric, etc.) using a three-step system:

1. Keyword matching against NFT name and trait names
2. Dominant color sampling from the NFT image
3. Weighted random fallback

### Rarity

Rarity is calculated from on-chain supply data where available (print max supply). Collections with no supply data fall back to a weighted random distribution skewed heavily toward common.

### QR Sharing

Users can share their discovered NFTs via a compact QR code format (`mintlore://share/...`). Data is base64-encoded and paginated at 10 NFTs per code to stay within QR size limits. Another user can scan this code to import the collection into their own discovery log.

---

## Project Status

Mintlore is a work in progress, submitted as part of a Solana Mobile Hackathon. Core scanning, display, and QR sharing features are functional. Known areas still being refined:

- Metadata normalization across inconsistent collection schemas
- QR scanner reliability edge cases
- Floor price coverage for obscure or unlisted collections
- Rarity ranking accuracy for collections without full on-chain supply data

---

## Architecture Notes

- All blockchain interaction goes through Helius RPC — no direct web3.js RPC calls for NFT data
- Magic Eden floor price calls are skipped on localhost (CORS) and on symbols containing special characters
- The audio system (`audioService`) manages a looping scan sound and a retro music track with track cycling support
- Color analysis runs client-side via a custom `colorService` that samples the dominant hue from NFT images to inform type assignment

---

## Roadmap

- Collection filtering and search
- Trait explorer and rarity deep-dive per NFT
- Social sharing to native share sheet
- Persistent favorites across sessions
- AI-enhanced NFT lore generation via metadata

---

## Acknowledgments

Built on Solana using Helius infrastructure. Market data provided by Magic Eden. Audio and visual design by the Mintlore team.
![WhatsApp Image 2026-03-08 at 14 58 17](https://github.com/user-attachments/assets/34c13ff6-434a-4ff8-b014-a567765c48a2)

---

## License

MIT
