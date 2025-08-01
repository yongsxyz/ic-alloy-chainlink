const { Web3 } = require('web3');
require('dotenv').config(); 

const privateKey = process.env.PRIVATE_KEY;
const rpcUrl = process.env.RPC_URL;
const contractAddress = process.env.CONTRACT_ADDRESS;

const abiAdd = [
    {
        "type": "function",
        "name": "addAsset",
        "inputs": [
            { "name": "assetAddress", "type": "address" },
            { "name": "priceFeed", "type": "address" },
            { "name": "tokenDecimals", "type": "uint8" },
            { "name": "stalePriceThresholdInSeconds", "type": "uint64" },
            { "name": "symbol", "type": "string" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    }
];

const abiRemove = [
    {
        "type": "function",
        "name": "removeAsset",
        "inputs": [{ "name": "assetAddress", "type": "address" }],
        "outputs": [],
        "stateMutability": "nonpayable"
    }
];

async function addAsset(assetAddress, priceFeed, tokenDecimals, stalePriceThresholdInSeconds, symbol) {
    const web3 = new Web3(rpcUrl);
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;

    const contract = new web3.eth.Contract(abiAdd, contractAddress);

    try {
        const tx = await contract.methods.addAsset(
            assetAddress,
            priceFeed,
            tokenDecimals,
            stalePriceThresholdInSeconds,
            symbol
        ).send({
            from: account.address,
            gas: 300000
        });

        console.log('✅ Asset added successfully. Tx hash:', tx.transactionHash);
    } catch (err) {
        console.error('❌ Failed to add asset:', err.message);
    }
}

async function removeAsset(assetAddress) {
    const web3 = new Web3(rpcUrl);
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;

    const contract = new web3.eth.Contract(abiRemove, contractAddress);

    try {
        const tx = await contract.methods.removeAsset(assetAddress).send({
            from: account.address,
            gas: 300000
        });

        console.log('✅ Asset removed successfully. Tx hash:', tx.transactionHash);
    } catch (err) {
        console.error('❌ Failed to remove asset:', err.message);
    }
}

// Example usage:
// addAsset(
//     '0x0000000000000000000000000000000000000021',
//     '0x1a81afB8146aeFfCFc5E50e8479e826E7D55b910',
//     18,
//     86400,
//     'EURUSD'
// );

// removeAsset('0x0000000000000000000000000000000000000021');
