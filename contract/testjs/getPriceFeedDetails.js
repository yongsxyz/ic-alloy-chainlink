const { Web3 } = require('web3');
require('dotenv').config();

const WEB3_PROVIDER = process.env.RPC_URL;
const ownerAddress = process.env.OWNER_ADDRESS;
const contractAddress = process.env.CONTRACT_ADDRESS;

const web3 = new Web3(WEB3_PROVIDER);
const assetAddress = '';

const abi = [
    {
        "type": "function",
        "name": "getPriceFeedDetails",
        "inputs": [
            {
                "name": "ownerAddress",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "assetAddress",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "roundId",
                "type": "uint80",
                "internalType": "uint80"
            },
            {
                "name": "answer",
                "type": "int256",
                "internalType": "int256"
            },
            {
                "name": "startedAt",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "updatedAt",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "answeredInRound",
                "type": "uint80",
                "internalType": "uint80"
            }
        ],
        "stateMutability": "view"
    }
];

const contract = new web3.eth.Contract(abi, contractAddress);

async function getPriceFeed() {
    try {
        const result = await contract.methods.getPriceFeedDetails(ownerAddress, assetAddress).call();
        console.log('Price Feed Details:', {
            roundId: result.roundId,
            answer: result.answer,
            startedAt: result.startedAt,
            updatedAt: result.updatedAt,
            answeredInRound: result.answeredInRound
        });
        return result;
    } catch (error) {
        console.error('Error fetching price feed details:', error);
        throw error;
    }
}

// Call the function
getPriceFeed();