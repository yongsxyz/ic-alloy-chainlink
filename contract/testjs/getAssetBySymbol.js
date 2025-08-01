const { Web3 } = require('web3');
require('dotenv').config();

const WEB3_PROVIDER = process.env.RPC_URL;
const ownerAddress = process.env.OWNER_ADDRESS;
const contractAddress = process.env.CONTRACT_ADDRESS;

const web3 = new Web3(WEB3_PROVIDER);

const tokenSymbol = 'btcusd';

const abi = [
    {
        "type": "function",
        "name": "getAssetBySymbol",
        "inputs": [
            {"name": "ownerAddress", "type": "address"},
            {"name": "symbol", "type": "string"}
        ],
        "outputs": [
            {"name": "assetAddress", "type": "address"},
            {"name": "originalSymbol", "type": "string"},
            {
                "name": "asset", 
                "type": "tuple",
                "components": [
                    {"name": "priceFeed", "type": "address"},
                    {"name": "tokenDecimals", "type": "uint8"},
                    {"name": "stalePriceThresholdInSeconds", "type": "uint64"}
                ]
            }
        ],
        "stateMutability": "view"
    },
   
];

const contract = new web3.eth.Contract(abi, contractAddress);

async function getAssetBySymbol() {
    try {
        const result = await contract.methods.getAssetBySymbol(ownerAddress, tokenSymbol).call();
        
        console.log('=====================');
        console.log('Asset Details for Symbol:', tokenSymbol);
        console.log('Asset Address:', result.assetAddress);
        console.log('Original Symbol:', result.originalSymbol);
        console.log('Price Feed:', result.asset.priceFeed);
        console.log('Token Decimals:', result.asset.tokenDecimals);
        console.log('Stale Price Threshold (seconds):', result.asset.stalePriceThresholdInSeconds);
        console.log('=====================');
        
        return result;
    } catch (error) {
        console.error('❌ Error fetching asset by symbol:', error.message);
        throw error;
    }
}

(async () => {
    try {
        await getAssetBySymbol();
    } catch (error) {
        console.error('Script failed:', error);
    }
})();