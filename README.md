<img width="1917" height="940" alt="MEDIA" src="https://github.com/user-attachments/assets/2bcc969d-9ece-47d6-8827-1d6a8c29e1b2" />

# Chainlink Price Feed Integration With IC Alloy

This integration securely reads Chainlink Price Feed data from Ethereum Sepolia and other EVM-compatible smart contracts using canisters deployed on the Internet Computer (ICP).

🔗 Reference Example: [`ic-alloy-basic-wallet`](https://github.com/ic-alloy/ic-alloy-basic-wallet)


[Live Backend](https://a4gq6-oaaaa-aaaab-qaa4q-cai.icp0.io/?id=jmbn7-tiaaa-aaaaa-qbsfa-cai)

<a href="https://icp.ninja/i?s=w2RVV" target="_blank">
  <img src="https://github.com/user-attachments/assets/3fa2fbdf-493a-496f-a8e3-888a51c9efda" 
       alt="Open in ICP Ninja" width="206" height="32" />
</a>

---

## Overview

This demonstrates how to connect the **Internet Computer** with external **EVM-compatible chains** to:

- Query on-chain price feed data (e.g., Chainlink) directly from Solidity contracts  
- Use ICP Canisters with Alloy RPC to interact with Ethereum-compatible networks.
- Read real-time price data from decentralized applications on ICP without relying on off-chain oracles.

---

### 🔗 Cross-Chain Data Access

- Read price data from Chainlink's on-chain sources via EVM.
- Fully decentralized and serverless

### 🧠 Internet Computer Integration

- It is written in **Rust** using the [Alloy ICP Library](https://github.com/ic-alloy/ic-alloy ) 
- Ideal for decentralized finance (DeFi), lending, oracles, and asset management on the Internet Computer  

## 🛠️ Manual Setup

### 1. Deploy the EVM Smart Contract

Deploy a Solidity Contract Chainlink Price Feed Data.

📍 Example Contract Repository:  
👉 [`Detail Here`](https://github.com/yongsxyz/WCHL-Canify-Finance/tree/main/canify-oracle/contract)

---

### 2. Set Up the Internet Computer Environment

Install and configure a local Internet Computer (IC) development environment.

📘 Official Rust CDK Documentation for IC:  
👉 [`https://internetcomputer.org/docs/building-apps/developer-tools/cdks/rust/intro-to-rust`](https://internetcomputer.org/docs/building-apps/developer-tools/cdks/rust/intro-to-rust)

---

### 3. Install Node.js and Dependencies

Install Node.js packages:

```bash
npm install
```

Create a .env.local file to store your Etherscan API key:

```bash
echo "VITE_ETHERSCAN_API_KEY=YOUR_API_KEY" > .env.local
```

🔑 Get your API key here:
👉 https://etherscan.io/apis

## Run the Project
Follow the steps below to run the Alloy Oracle project on the Internet Computer:

```bash 
# 1. Start the local Internet Computer replica
dfx start --background --clean

# 2. Build the Rust canister (ensure cargo is installed)
cargo build

# 3. Generate the Candid interface (.did file)
bash ./did.sh

# 4. Deploy the project local
dfx deploy
```
