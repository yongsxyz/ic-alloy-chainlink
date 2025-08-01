const { Web3 } = require('web3');

require('dotenv').config();

const WEB3_PROVIDER = process.env.RPC_URL;
const ownerAddress = process.env.OWNER_ADDRESS;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const CONTRACT_ABI = [
    {
        "type": "function",
        "name": "getUsdValue",
        "inputs": [
            { "name": "ownerAddress", "type": "address", "internalType": "address" },
            { "name": "assetAddress", "type": "address", "internalType": "address" },
            { "name": "tokenAmount", "type": "uint248", "internalType": "uint248" }
        ],
        "outputs": [
            { "name": "", "type": "uint248", "internalType": "uint248" }
        ],
        "stateMutability": "view"
    },
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
    }
];

const web3 = new Web3(WEB3_PROVIDER);
const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

// --- Helper Functions ---
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

async function getUsdValue(assetAddress, tokenAmount) {
    try {
        console.log(`\nFetching USD value for ${tokenAmount} tokens of asset ${assetAddress}...`);

        // Get asset decimals to format the input correctly
        const assets = await getAllAssets();
        const targetAsset = assets.find(asset => asset.address.toLowerCase() === assetAddress.toLowerCase());
        
        if (!targetAsset) {
            throw new Error(`Asset with address ${assetAddress} not found`);
        }

        // Convert token amount to raw value (considering decimals)
        const tokenAmountRaw = toBigIntWithDecimals(tokenAmount, targetAsset.decimals);

        // Call the contract
        const usdValueRaw = await contract.methods.getUsdValue(
            ownerAddress,
            assetAddress,
            tokenAmountRaw
        ).call();

        // Format the USD value (assuming 18 decimals for USD values)
        const formattedUsdValue = formatWithDecimals(usdValueRaw, 18);

        console.log(`${tokenAmount} ${targetAsset.symbol} tokens are equivalent to ( ${formattedUsdValue} ) `);
        return formattedUsdValue;
    } catch (error) {
        console.error(`Error getting USD value for ${assetAddress}:`, error);
        throw error;
    }
}

async function exampleUsage() {
    try {
        const assets = await getAllAssets();
        console.log('\nList of Available Assets:');
        assets.forEach(asset => {
            console.log(`- ${asset.symbol} (Address: ${asset.address}, Decimals: ${asset.decimals})`);
        });

        if (assets.length === 0) {
            console.log('No assets found.');
            return;
        }

        console.log('\nCalculate USD value for all assets:');
        for (const asset of assets) {
            await getUsdValue(asset.address, '1');
        }

    } catch (error) {
        console.error('Error in example usage:', error);
    }
}

exampleUsage();