const { Web3 } = require('web3');

require('dotenv').config();

const WEB3_PROVIDER = process.env.RPC_URL;
const ownerAddress = process.env.OWNER_ADDRESS;
const contractAddress = process.env.CONTRACT_ADDRESS;

const web3 = new Web3(WEB3_PROVIDER);

const abi = [
    {
        "type": "function",
        "name": "getAllAssetsWithPrices",
        "inputs": [
            {
                "name": "ownerAddress",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "addresses",
                "type": "address[]",
                "internalType": "address[]"
            },
            {
                "name": "symbols",
                "type": "string[]",
                "internalType": "string[]"
            },
            {
                "name": "prices",
                "type": "int256[]",
                "internalType": "int256[]"
            },
            {
                "name": "decimals",
                "type": "uint8[]",
                "internalType": "uint8[]"
            },
            {
                "name": "lastUpdatedTimes",
                "type": "uint256[]",
                "internalType": "uint256[]"
            }
        ],
        "stateMutability": "view"
    }
];

function timeAgo(timestamp) {
    const seconds = Math.floor((new Date() - timestamp) / 1000);
    if (seconds >= 31536000) return `${Math.floor(seconds / 31536000)} year(s) ago`;
    if (seconds >= 2592000) return `${Math.floor(seconds / 2592000)} month(s) ago`;
    if (seconds >= 86400) return `${Math.floor(seconds / 86400)} day(s) ago`;
    if (seconds >= 3600) return `${Math.floor(seconds / 3600)} hour(s) ago`;
    if (seconds >= 60) return `${Math.floor(seconds / 60)} minute(s) ago`;
    return `${seconds} second(s) ago`;
}

const contract = new web3.eth.Contract(abi, contractAddress);

async function fetchAndPrintAssets() {

    try {
        const result = await contract.methods.getAllAssetsWithPrices(ownerAddress).call();
        console.clear();
        console.log(`Assets for owner: ${ownerAddress}`);
        console.log("=".repeat(60));
        result.addresses.forEach((address, index) => {
            const priceStr = result.prices[index].toString();
            const timestamp = Number(result.lastUpdatedTimes[index]) * 1000;
            const date = new Date(timestamp);

            console.log(`- Symbol: ${result.symbols[index]}`);
            console.log(`- Price: ${priceStr}`);
            console.log(`- Last Updated: ${date.toLocaleString()}`);
            console.log(`- Time Ago: ${timeAgo(timestamp)}`);
            console.log("-".repeat(40));
        });
    } catch (error) {
        console.error("Error fetching prices:", error);
    }
}

fetchAndPrintAssets();