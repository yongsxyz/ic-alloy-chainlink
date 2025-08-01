const { Web3 } = require('web3');

require('dotenv').config(); 

const ownerAddress = process.env.OWNER_ADDRESS;
const WEB3_PROVIDER = process.env.RPC_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// ABI
const CONTRACT_ABI = [
    {
        "type": "function",
        "name": "getAllPriceToConvertToUsd",
        "inputs": [
            {
                "name": "ownerAddress",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "tokenAmounts",
                "type": "uint248[]",
                "internalType": "uint248[]"
            }
        ],
        "outputs": [
            {
                "name": "data",
                "type": "tuple",
                "internalType": "struct AssetPriceRegistry.AssetConversionData",
                "components": [
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
                        "name": "amounts",
                        "type": "uint248[]",
                        "internalType": "uint248[]"
                    },
                    {
                        "name": "prices",
                        "type": "int256[]",
                        "internalType": "int256[]"
                    },
                    {
                        "name": "priceDecimals",
                        "type": "uint8[]",
                        "internalType": "uint8[]"
                    },
                    {
                        "name": "tokenDecimals",
                        "type": "uint8[]",
                        "internalType": "uint8[]"
                    },
                    {
                        "name": "lastUpdatedTimes",
                        "type": "uint256[]",
                        "internalType": "uint256[]"
                    }
                ]
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getAllConvertUsdToToken",
        "inputs": [
            {
                "name": "ownerAddress",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "usdValues",
                "type": "uint248[]",
                "internalType": "uint248[]"
            }
        ],
        "outputs": [
            {
                "name": "data",
                "type": "tuple",
                "internalType": "struct AssetPriceRegistry.AssetConversionData",
                "components": [
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
                        "name": "amounts",
                        "type": "uint248[]",
                        "internalType": "uint248[]"
                    },
                    {
                        "name": "prices",
                        "type": "int256[]",
                        "internalType": "int256[]"
                    },
                    {
                        "name": "priceDecimals",
                        "type": "uint8[]",
                        "internalType": "uint8[]"
                    },
                    {
                        "name": "tokenDecimals",
                        "type": "uint8[]",
                        "internalType": "uint8[]"
                    },
                    {
                        "name": "lastUpdatedTimes",
                        "type": "uint256[]",
                        "internalType": "uint256[]"
                    }
                ]
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getAllAssets",
        "inputs": [
            {
                "name": "ownerAddress",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "address[]",
                "internalType": "address[]"
            },
            {
                "name": "",
                "type": "string[]",
                "internalType": "string[]"
            }
        ],
        "stateMutability": "view"
    },
];

const web3 = new Web3(WEB3_PROVIDER);
const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

async function getAllAssets() {
    try {
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

        return assets;
    } catch (error) {
        console.error('Error getting all assets:', error);
        throw error;
    }
}

// Helper function 
function formatWithDecimals(value, decimals) {
    const valueStr = value.toString().padStart(decimals + 1, '0');
    const integerPart = valueStr.slice(0, -decimals) || '0';
    const fractionalPart = valueStr.slice(-decimals).replace(/0+$/, '');
    return fractionalPart ? `${integerPart}.${fractionalPart}` : integerPart;
}

// Helper function 
function toBigIntWithDecimals(value, decimals) {
    const valueStr = value.toString();
    const [integerPart, fractionalPart = ''] = valueStr.split('.');
    const paddedFractionalPart = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(integerPart + paddedFractionalPart);
}

async function convertUsdToTokens(usdAmounts, assets) {
    try {
        const usdAmountsWei = usdAmounts.map(amount => {
            return toBigIntWithDecimals(amount, 18);
        });

        console.log('USD Amounts (Wei):', usdAmountsWei.map(x => x.toString()));

        const result = await contract.methods.getAllConvertUsdToToken(ownerAddress,usdAmountsWei).call();

        const formattedResults = [];
        for (let i = 0; i < result[0].length; i++) {
            const tokenDecimals = assets[i]?.decimals || 18;
            const priceDecimals = Number(result[4][i]); // priceDecimals
            const tokenAmount = BigInt(result[2][i]);

            // Format price
            const price = Number(result[3][i]) / (10 ** priceDecimals);

            formattedResults.push({
                symbol: result[1][i],
                usdInput: usdAmounts[i],
                tokenAmount: formatWithDecimals(tokenAmount, tokenDecimals),
                price: price.toFixed(8),
                raw: {
                    tokenAmount: tokenAmount.toString(),
                    price: result[3][i].toString(),
                    priceDecimals: priceDecimals,
                    tokenDecimals: tokenDecimals
                }
            });
        }

        return formattedResults;
    } catch (error) {
        console.error('Error converting USD to tokens:', error);
        throw error;
    }
}


async function convertTokensToUsd(tokenAmounts, assets) {
    try {
        const tokenAmountsWei = tokenAmounts.map((amount, index) => {
            const decimals = assets[index]?.decimals || 18;
            return toBigIntWithDecimals(amount, decimals);
        });

        console.log('Token Amounts (Wei):', tokenAmountsWei.map(x => x.toString()));

        const result = await contract.methods.getAllPriceToConvertToUsd(ownerAddress, tokenAmountsWei).call();

        const formattedResults = [];
        for (let i = 0; i < result[0].length; i++) {
            const priceDecimals = Number(result[4][i]); // priceDecimals
            const usdValue = BigInt(result[2][i]);

            // Format price
            const price = Number(result[3][i]) / (10 ** priceDecimals);

            formattedResults.push({
                symbol: result[1][i],
                tokenInput: tokenAmounts[i],
                usdValue: formatWithDecimals(usdValue, 18),
                price: price.toFixed(8),
                raw: {
                    usdValue: usdValue.toString(),
                    price: result[3][i].toString(),
                    priceDecimals: priceDecimals
                }
            });
        }

        return formattedResults;
    } catch (error) {
        console.error('Error converting tokens to USD:', error);
        throw error;
    }
}

async function testSpecificConversion() {
    try {
        console.log('=== SPECIFIC CONVERSION TEST ===');

        const assets = await getAllAssets();
        console.log('Asset List:', assets.map(a => `${a.symbol} (${a.decimals} decimals)`));

        // Test 1: $100 to BTC
        console.log('\n--- Test 1: $100 to BTC ---');
        const btcIndex = assets.findIndex(a => a.symbol.includes('BTC'));
        if (btcIndex !== -1) {
            const usdAmounts = new Array(assets.length).fill(0);
            usdAmounts[btcIndex] = 100;

            const result = await convertUsdToTokens(usdAmounts, assets);
            const btcResult = result[btcIndex];

            console.log(`$${btcResult.usdInput} → ${btcResult.tokenAmount} ${btcResult.symbol}`);
            console.log(`Harga BTC: $${btcResult.price}`);
            console.log(`Raw data:`, btcResult.raw);
        }

        // Test 2: 1 BTC to USD
        console.log('\n--- Test 2: 1 BTC to USD ---');
        if (btcIndex !== -1) {
            const tokenAmounts = new Array(assets.length).fill(0);
            tokenAmounts[btcIndex] = 1;

            const result = await convertTokensToUsd(tokenAmounts, assets);
            const btcResult = result[btcIndex];

            console.log(`${btcResult.tokenInput} ${btcResult.symbol} → $${btcResult.usdValue}`);
            console.log(`Harga BTC: $${btcResult.price}`);
            console.log(`Raw data:`, btcResult.raw);
        }

    } catch (error) {
        console.error('Error in specific test:', error);
    }
}


async function example() {
    try {
        console.log('=== CONVERSION EXAMPLE ===');

        // Get all assets first
        const assets = await getAllAssets();
        console.log('List of Available Assets:', assets.map(a => `${a.symbol} (${a.decimals} decimals)`));

        // Example 1: $100 → Token (for each asset)
        console.log('\n1. Convert $100 to each token:');
        const usdAmounts = new Array(assets.length).fill(1000);
        const usdToTokenResults = await convertUsdToTokens(usdAmounts, assets);

        usdToTokenResults.forEach(result => {
            console.log(`$${result.usdInput} → ${result.tokenAmount} ${result.symbol} (Harga: $${result.price})`);
        });

        // Example 2: 1 Token → USD (for each asset)
        console.log('\n2. Convert 1 token of each asset to USD:');
        const tokenAmounts = new Array(assets.length).fill(5);
        const tokenToUsdResults = await convertTokensToUsd(tokenAmounts, assets);

        tokenToUsdResults.forEach(result => {
            console.log(`${result.tokenInput} ${result.symbol} → $${result.usdValue} (Harga: $${result.price})`);
        });

        // Test specific conversions
        await testSpecificConversion();

    } catch (error) {
        console.error('Error in example:', error);
    }
}

module.exports = {
    getAllAssets,
    convertUsdToTokens,
    convertTokensToUsd,
    testSpecificConversion,
    example
};

if (require.main === module) {
    example();
}