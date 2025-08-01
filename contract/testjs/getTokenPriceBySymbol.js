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
        "name": "getTokenPriceBySymbol",
        "inputs": [
            { "name": "ownerAddress", "type": "address", "internalType": "address" },
            { "name": "symbol", "type": "string", "internalType": "string" }
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

async function getTokenPriceBySymbol(symbol) {
    try {
        console.log(`\nFetching token price for symbol: ${symbol}...`);

        const result = await contract.methods.getTokenPriceBySymbol(ownerAddress, symbol).call();
        const price = BigInt(result[0]);
        const decimals = Number(result[1]);

        const formattedPrice = formatPrice(price, decimals);

        const assets = await getAllAssets();
        const targetAsset = assets.find(asset => asset.symbol.toLowerCase() === symbol.toLowerCase());

        console.log(`Price token ${symbol}: ${formattedPrice}`);
        return { 
            price: price.toString(), 
            decimals,
            formattedPrice,
            symbol: symbol,
            address: targetAsset ? targetAsset.address : null
        };
    } catch (error) {
        console.error(`Error getting token price for symbol ${symbol}:`, error);
        throw error;
    }
}

async function testSpecificConversion() {
    try {
        console.log('\n--- TEST PRICE TOKEN ---');

        const assets = await getAllAssets();
        console.log('List of Assets Found:', assets.map(a => `${a.symbol} (${a.decimals} decimals)`).join(', '));

        // Test by symbol
        console.log('\n--- Test: ETH Price by Symbol ---');
        await getTokenPriceBySymbol('ETHUSD');
        
        console.log('\n--- Test: BTC Price by Symbol ---');
        await getTokenPriceBySymbol('BTCUSD');

        // Test other assets if they exist
        const daiAsset = assets.find(a => a.symbol.includes('DAI'));
        if (daiAsset) {
            console.log('\n--- Test: DAI Price by Symbol ---');
            await getTokenPriceBySymbol(daiAsset.symbol);
        }

    } catch (error) {
        console.error('Error in specific test:', error);
    }
}

async function example() {
    try {
        console.log('=== Test Example ===');

        const assets = await getAllAssets();
        console.log('\nList of Available Assets:');
        assets.forEach(asset => {
            console.log(`- ${asset.symbol} (Address: ${asset.address}, Decimals: ${asset.decimals})`);
        });

        if (assets.length === 0) {
            console.log('No assets were found for this owner. Unable to continue..');
            return;
        }

        console.log('\n--- Get Prices for All Tokens (By Symbol) ---');
        for (const asset of assets) {
            await getTokenPriceBySymbol(asset.symbol);
        }

        await testSpecificConversion();

        console.log('\n=== DONE ===');

    } catch (error) {
        console.error('An error occurred while executing the example:', error);
    } 
}

module.exports = {
    getAllAssets,
    getTokenPriceBySymbol,
    testSpecificConversion,
    example
};

if (require.main === module) {
    example();
}