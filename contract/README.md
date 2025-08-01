# Asset Price Registry Contract Price Feed Chainlink

A robust Asset Price Registry supporting multiple owners and assets that uses Chainlink price feeds.

## Table of Contents

- [Contract Overview](#contract-overview)
- [Key Features](#key-features)
- [Installation & Deployment](#installation--deployment)
- [API Reference](#api-reference)
- [Default Assets](#default-assets)
- [Security](#security)
- [Best Practices](#best-practices)

---

## Contract Overview

This contract manages a collection of assets with Chainlink price feeds for multiple owners. It provides the following functionality:

- Add/remove assets
- Update asset symbols
- Get current prices
- Convert between token amounts and USD values
- Manage asset information for different owners

---

## Key Features

### Asset Management

- Add/remove assets with custom symbols  
- Update asset information  
- Owner-specific asset configurations  

### Price Feed Integration

- Automatic validation of Chainlink price feeds  
- **Configurable stale data thresholds (heartbeat)** per asset to define how long price data is considered valid  
- Allows you to set a custom `staleThreshold` in seconds during asset registration or update.
- Protects against using outdated or frozen price feeds  
- Fallback mechanisms for failed price lookups   

### Conversion Tools

- Accurate token ↔ USD conversions  
- Handles different decimal precisions  
- Bulk conversion operations  

---

## Installation & Deployment

### Installation Requirements

- [Foundry](https://book.getfoundry.sh/)
- Node.js
- Alchemy/Infura RPC endpoint
- Etherscan API key (for contract verification)

### Install & Test Commands

```bash
# Install dependencies
forge install
```

### Run tests

```bash
forge test
```

### Deployment Commands

```bash
# Deploy to Sepolia
forge create src/AssetPriceRegistry.sol:AssetPriceRegistryCanifyFinance\
  --rpc-url https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY \
  --private-key YOUR_PRIVATE_KEY \
  --broadcast \
  --constructor-args YOUR_WALLET_ADDRESS

# Verify on Etherscan
forge verify-contract DEPLOYED_CONTRACT_ADDRESS \
  src/AssetPriceRegistry.sol:AssetPriceRegistryCanifyFinance \
  --chain-id 11155111 \
  --etherscan-api-key YOUR_ETHERSCAN_KEY \
  --verifier etherscan \
  --constructor-args 0000000000000000000000009b64bf8e260c3a40149650b61c3d02cab6d2a643
```

## Live Deployment

The `AssetPriceRegistryCanifyFinance` contract is deployed on the Sepolia Ethereum Testnet:

🔗 [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0xe1006413d1ae924056a602D5266e86dd2570Ad68)

- **Network**: Sepolia Testnet  
- **Contract Address**: `0xe1006413d1ae924056a602D5266e86dd2570Ad68`  


## API Reference

### Core Functions

| Function | Description |
|---------|-------------|
| `addAsset(address asset, address priceFeed, uint8 decimals, uint64 staleThreshold, string symbol)` | Register new asset with price feed |
| `removeAsset(address asset)` | Remove asset from owner's list |
| `updateSymbol(address asset, string newSymbol)` | Update asset's display symbol |

### Price Lookup

| Function | Returns | Description |
|----------|---------|-------------|
| `getTokenPrice(address owner, address token)` | `(int256, uint8)` | Get price by asset address |
| `getTokenPriceBySymbol(address owner, string symbol)` | `(int256, uint8)` | Get price by symbol |

### Conversion

| Function | Returns | Description |
|----------|---------|-------------|
| `getUsdValue(address owner, address token, uint248 amount)` | `uint248` | Convert tokens to USD |
| `getTokenAmount(address owner, address token, uint248 usdAmount)` | `uint248` | Convert USD to tokens |

### Bulk Operations

| Function | Returns | Description |
|----------|---------|-------------|
| `getAllAssets(address owner)` | `(address[], string[])` | List of all owner assets |
| `getAllAssetsWithPrices(address owner)` | *Multiple arrays* | List of assets with price data |

---

## Default Assets

For a full list of Chainlink price feed addresses, see:  
🔗 [Chainlink Price Feeds Address Reference](https://docs.chain.link/data-feeds/price-feeds/addresses?page=1&testnetPage=1)

| Symbol   | Price Feed Address   | Decimals |
|----------|----------------------|----------|
| AUDUSD   | `0xB0C712f9...`       | 18       |
| BTCETH   | `0x5fb1616F...`       | 8        |
| BTCUSD   | `0x1b44F351...`       | 8        |
| CSPXUSD  | `0x4b531A31...`       | 18       |
| CZKUSD   | `0xC32f0A9D...`       | 18       |
| DAIUSD   | `0x14866185...`       | 18       |
| ETHUSD   | `0x694AA176...`       | 18       |

---

## Security

- ✅ **Price feed validation**
- ✅ **Reentrancy protection**
- ✅ **Input sanitization**
- ✅ **Ownership checks**

---

## Best Practices

- Use latest Chainlink feed interfaces  
- Set appropriate stale data thresholds  
- Verify all constructor arguments before deployment  
