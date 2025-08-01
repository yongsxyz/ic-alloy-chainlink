const { Web3 } = require('web3');

require('dotenv').config();

const WEB3_PROVIDER = process.env.RPC_URL;
const ownerAddress = process.env.OWNER_ADDRESS;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;


const CONTRACT_ABI = [
    {
        "type": "function",
        "name": "getAllAssets",
        "inputs": [
            { "name": "ownerAddress", "type": "address", "internalType": "address" }
        ],
        "outputs": [
            { "name": "", "type": "address[]", "internalType": "address[]" },
            { "name": "", "type": "string[]", "internalType": "string[]" }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getTokenPrice",
        "inputs": [
            { "name": "ownerAddress", "type": "address", "internalType": "address" },
            { "name": "assetAddress", "type": "address", "internalType": "address" }
        ],
        "outputs": [
            { "name": "price", "type": "int256", "internalType": "int256" },
            { "name": "decimals", "type": "uint8", "internalType": "uint8" }
        ],
        "stateMutability": "view"
    }
];


const web3 = new Web3(WEB3_PROVIDER);
const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

function formatPrice(price, decimals) {
    const priceStr = price.toString().padStart(decimals + 1, '0');
    const integerPart = priceStr.slice(0, -decimals) || '0';
    const fractionalPart = priceStr.slice(-decimals).replace(/0+$/, '');
    
    return fractionalPart.length > 0 
        ? `${integerPart}.${fractionalPart}`
        : integerPart;
}

async function getAllAssets() {
    try {
        console.log('Fetching all supported assets...');
        const result = await contract.methods.getAllAssets(ownerAddress).call();
        const assets = [];

        for (let i = 0; i < result[0].length; i++) {
            const decimals = result[1][i].includes('BTC') ? 8 : 18;
            assets.push({
                address: result[0][i],
                symbol: result[1][i],
                decimals: decimals
            });
        }
        console.log('Successfully fetched assets.');
        return assets;
    } catch (error) {
        console.error('Error getting all assets:', error);
        throw error;
    }
}

async function getTokenPrice(assetAddress) {
    try {
        console.log(`\nFetching token price for asset ${assetAddress}...`);

        const result = await contract.methods.getTokenPrice(ownerAddress, assetAddress).call();
        const price = BigInt(result[0]);
        const decimals = Number(result[1]);

        const formattedPrice = formatPrice(price, decimals);

        const assets = await getAllAssets();
        const targetAsset = assets.find(asset => asset.address.toLowerCase() === assetAddress.toLowerCase());

        console.log(`Harga token ${targetAsset ? targetAsset.symbol : assetAddress}: ${formattedPrice}`);
        return { 
            price: price.toString(), 
            decimals,
            formattedPrice,
            symbol: targetAsset ? targetAsset.symbol : null
        };
    } catch (error) {
        console.error(`Error getting token price for ${assetAddress}:`, error);
        throw error;
    }
}

async function testSpecificConversion() {
    try {
        console.log('\n--- TOKEN PRICE TEST ---');

        const assets = await getAllAssets();
        console.log('List of Assets Found:', assets.map(a => `${a.symbol} (${a.decimals} decimals)`).join(', '));

        const ethAsset = assets.find(a => a.symbol.includes('ETH'));
        const btcAsset = assets.find(a => a.symbol.includes('BTC'));

        if (ethAsset) {
            console.log('\n--- Test: Price ETH ---');
            await getTokenPrice(ethAsset.address);
        } else {
            console.log('ETH asset not found in supported assets.');
        }

        if (btcAsset) {
            console.log('\n--- Test: Price BTC ---');
            await getTokenPrice(btcAsset.address);
        } else {
            console.log('BTC asset not found in supported assets.');
        }

    } catch (error) {
        console.error('Error in specific test:', error);
    }
}

async function example() {
    try {
        console.log('=== GETTING STARTED FULL EXAMPLE ===');

        const assets = await getAllAssets();
        console.log('\nList of Available Assets:');
        assets.forEach(asset => {
            console.log(`- ${asset.symbol} (Address: ${asset.address}, Decimals: ${asset.decimals})`);
        });

        if (assets.length === 0) {
            console.log('No assets were found for this owner. Unable to continue.');
            return;
        }

        console.log('\n--- Get Prices for All Tokens ---');
        for (const asset of assets) {
            await getTokenPrice(asset.address);
        }

        await testSpecificConversion();

        console.log('\n=== COMPLETE EXAMPLE FINISHED ===');

    } catch (error) {
        console.error('An error occurred while executing the example:', error);
    } 
}

module.exports = {
    getAllAssets,
    getTokenPrice,
    testSpecificConversion,
    example
};

if (require.main === module) {
    example();
}