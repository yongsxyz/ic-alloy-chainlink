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
        "name": "getTokenAmount",
        "inputs": [
            { "name": "ownerAddress", "type": "address" },
            {"name": "assetAddress", "type": "address"},
            { "name": "usdValue", "type": "uint248" }
        ],
        "outputs": [{"name": "", "type": "uint248"}],
        "stateMutability": "view"
    }
];

const web3 = new Web3(WEB3_PROVIDER);
const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

// --- Helper ---
function toBigIntWithDecimals(value, decimals) {
    const valueStr = value.toString();
    const [integerPart, fractionalPart = ''] = valueStr.split('.');
    const paddedFractionalPart = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(integerPart + paddedFractionalPart);
}

function formatWithDecimals(value, decimals) {
    const valueBigInt = BigInt(value);
    const divisor = BigInt(10) ** BigInt(decimals);

    const integerPart = valueBigInt / divisor;
    const fractionalPart = valueBigInt % divisor;

    if (fractionalPart === BigInt(0)) {
        return integerPart.toString();
    }

    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    const trimmedFractionalStr = fractionalStr.replace(/0+$/, '');
    return `${integerPart}.${trimmedFractionalStr}`;
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


async function getTokenAmount(assetAddress, usdValue) {
    try {
        console.log(`\nFetching token amount for ${usdValue} USD of asset ${assetAddress}...`);

        const usdValueWei = toBigIntWithDecimals(usdValue, 18);

        const tokenAmountRaw = await contract.methods.getTokenAmount(ownerAddress, assetAddress, usdValueWei).call();

        const assets = await getAllAssets();
        const targetAsset = assets.find(asset => asset.address.toLowerCase() === assetAddress.toLowerCase());
        const tokenDecimals = targetAsset ? targetAsset.decimals : 18; 

        const formattedTokenAmount = formatWithDecimals(tokenAmountRaw, tokenDecimals);

        console.log(`${usdValue} untuk ${targetAsset ? targetAsset.symbol : assetAddress} setara dengan ${formattedTokenAmount} token.`);
        return formattedTokenAmount;
    } catch (error) {
        console.error(`Error getting token amount for ${assetAddress}:`, error);
        throw error;
    }
}

async function testSpecificConversion() {
    try {
        console.log('\n--- SPECIFIC CONVERSION TEST ---');

        const assets = await getAllAssets();
        console.log('List of Assets Found:', assets.map(a => `${a.symbol} (${a.decimals} decimals)`).join(', '));

        const btcAsset = assets.find(a => a.symbol.includes('BTC'));

        if (btcAsset) {
            console.log('\n--- Test: $100 ETH to BTC  ---');
            await getTokenAmount(btcAsset.address, 100);

        } else {
            console.log('BTC asset not found in supported assets.');
        }



    } catch (error) {
        console.error('Error in specific test:', error);
    }
}

async function example() {
    try {
        console.log('=== GETTING STARTED WITH A COMPLETE CONVERSION EXAMPLE ===');

        const assets = await getAllAssets();
        console.log('\nDaftar Aset Tersedia:');
        assets.forEach(asset => {
            console.log(`- ${asset.symbol} (Alamat: ${asset.address}, Decimals: ${asset.decimals})`);
        });

        if (assets.length === 0) {
            console.log('No assets were found for this owner. Unable to proceed with conversion.');
            return;
        }

        console.log('\n--- Convert $1000 USD to Individual Tokens (via getTokenAmount) ---');
        for (const asset of assets) {
            await getTokenAmount(asset.address, 0.00001);
        }

        await testSpecificConversion();

        console.log('\n=== COMPLETE EXAMPLE FINISHED ===');

    } catch (error) {
        console.error('An error occurred while executing the example:', error);
    } 
}

module.exports = {
    getAllAssets,
    getTokenAmount,
    testSpecificConversion,
    example
};

if (require.main === module) {
    example();
}