const { Web3 } = require('web3');
require('dotenv').config();

const WEB3_PROVIDER = process.env.RPC_URL;
const ownerAddress = process.env.OWNER_ADDRESS;
const contractAddress = process.env.CONTRACT_ADDRESS;

const web3 = new Web3(WEB3_PROVIDER);

const assetAddress = ''; // Replace with your actual asset address EG. 0x0000000000000000000000000000000000000001

const abi = [
    {
        "type": "function",
        "name": "_safeGetPrice",
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
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "",
                "type": "uint8",
                "internalType": "uint8"
            }
        ],
        "stateMutability": "view"
    }
];

const contract = new web3.eth.Contract(abi, contractAddress);

async function getPrice() {
    try {
        const result = await contract.methods._safeGetPrice(ownerAddress, assetAddress).call();
        const rawPrice = result[0];
        const decimals = Number(result[1]); 
        const formattedPrice = Number(rawPrice) / (10 ** decimals);
        
        console.log('=====================');
        console.log('Asset Address:', assetAddress);
        console.log('Raw Price:', rawPrice.toString());
        console.log('Decimals:', decimals);
        console.log('Formatted Price:', formattedPrice);
        console.log('Formatted (8 decimals):', formattedPrice.toFixed(8));
        console.log('=====================');
        
        return { rawPrice, decimals, formattedPrice };
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

getPrice()
   