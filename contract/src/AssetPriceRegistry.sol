// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {AggregatorV3Interface} from "@chainlink/contracts/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./lib/AssetManager.sol";
import "./lib/StringUtils.sol";
import "./lib/PriceFeedUtils.sol";
import "./lib/ConversionUtils.sol";


/**
 * @title AssetPriceRegistry Contract Canify WCHL HACKATHON ICP 
 * @dev Manages a collection of assets with price feeds for multiple owners
 */
contract AssetPriceRegistryCanifyFinance is ReentrancyGuard {
    using AssetManager for AssetManager.PaymentAsset;
    using StringUtils for string;
    using PriceFeedUtils for AssetManager.PaymentAsset;
    using ConversionUtils for uint8;

    // Asset information structure
    struct AssetInfo {
        AssetManager.PaymentAsset assetData; // Price feed and decimals
        string symbol;                       // Asset symbol (e.g., "ETHUSD")
        address owner;                       // Owner who added this asset
    }

    // Storage mappings
    mapping(address => mapping(address => AssetInfo)) private _ownerAssets; // owner => asset => AssetInfo
    mapping(address => mapping(string => address)) private _ownerSymbolToAsset; // owner => symbol => asset
    mapping(address => mapping(string => address))
        private _ownerLowercaseSymbolToAsset; // owner => lowercaseSymbol => asset
    mapping(address => mapping(address => string))
        private _ownerAssetToOriginalSymbol; // owner => asset => symbol
    mapping(address => address[]) private _ownerAssetAddresses; // owner => asset addresses array

   // Events
    event AssetAdded(
        address indexed owner,
        address indexed asset,
        string symbol,
        address priceFeed,
        uint8 decimals,
        uint64 staleThreshold
    );
    event AssetRemoved(address indexed owner, address indexed asset);
    event SymbolUpdated(
        address indexed owner,
        address indexed asset,
        string oldSymbol,
        string newSymbol
    );


    // Modifiers
    modifier onlySupportedAsset(address owner, address asset) {
        require(
            _ownerAssets[owner][asset].assetData.priceFeed != address(0),
            "Asset not supported for this owner"
        );
        _;
    }

    modifier onlyAssetOwner(address owner, address asset) {
        require(
            _ownerAssets[owner][asset].owner == owner,
            "Not the owner of this asset"
        );
        _;
    }

    // Data structures for return values
    struct ReturnData {
        address[] addresses;
        string[] symbols;
        uint248[] usdValues;
        uint248[] tokenAmounts;
        int256[] prices;
        uint8[] priceDecimals;
        uint8[] tokenDecimals;
        uint256[] lastUpdatedTimes;
    }

    struct AssetConversionData {
        address[] addresses;
        string[] symbols;
        uint248[] amounts;
        int256[] prices;
        uint8[] priceDecimals;
        uint8[] tokenDecimals;
        uint256[] lastUpdatedTimes;
    }

    /**
     * @dev Constructor that initializes default assets
     * @param initialOwner Address that will own the default assets
     */
    constructor(address initialOwner) {
        _initializeDefaultAssets(initialOwner);
    }


    /**
     * @dev Internal function to add default assets 
     * @param ownerAddress Owner of the default assets first deploy
     */
    function _initializeDefaultAssets(address ownerAddress) private {
        // Add AUDUSD price feed
        _addAssetInternal(
            ownerAddress,
            address(1),
            0xB0C712f98daE15264c8E26132BCC91C40aD4d5F9,
            18,
            86400,
            "AUDUSD"
        );

        // Add BTCETH price feed
        _addAssetInternal(
            ownerAddress,
            address(2),
            0x5fb1616F78dA7aFC9FF79e0371741a747D2a7F22,
            8,
            86400,
            "BTCETH"
        );

        // Add BTCUSD price feed
        _addAssetInternal(
            ownerAddress,
            address(3),
            0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43,
            8,
            3600,
            "BTCUSD"
        );

        // Add CSPXUSD price feed
        _addAssetInternal(
            ownerAddress,
            address(5),
            0x4b531A318B0e44B549F3b2f824721b3D0d51930A,
            18,
            86400,
            "CSPXUSD"
        );

        // Add CZKUSD price feed
        _addAssetInternal(
            ownerAddress,
            address(6),
            0xC32f0A9D70A34B9E7377C10FDAd88512596f61EA,
            18,
            86400,
            "CZKUSD"
        );

        // Add DAIUSD price feed
        _addAssetInternal(
            ownerAddress,
            address(7),
            0x14866185B1962B63C3Ea9E03Bc1da838bab34C19,
            18,
            86400,
            "DAIUSD"
        );

        // Add ETHUSD price feed
        _addAssetInternal(
            ownerAddress,
            address(8),
            0x694AA1769357215DE4FAC081bf1f309aDC325306,
            18,
            3600,
            "ETHUSD"
        );
    }

    /**
     * @dev Internal helper to add an asset
     * @param ownerAddress Owner adding the asset
     * @param assetAddress Address representing the asset
     * @param priceFeed Chainlink price feed address
     * @param tokenDecimals Decimals for the token
     * @param stalePriceThresholdInSeconds Max age for price data
     * @param symbol Asset symbol
     */
    function _addAssetInternal(
        address ownerAddress,
        address assetAddress,
        address priceFeed,
        uint8 tokenDecimals,
        uint64 stalePriceThresholdInSeconds,
        string memory symbol
    ) private {
        string memory lowerSymbol = symbol._toLower();
        
        // Check symbol isn't already registered to a different asset
        require(
            _ownerLowercaseSymbolToAsset[ownerAddress][lowerSymbol] ==
                address(0) ||
                _ownerLowercaseSymbolToAsset[ownerAddress][lowerSymbol] ==
                assetAddress,
            "Symbol already registered for different asset"
        );

        // Add to asset list if new
        if (
            _ownerAssets[ownerAddress][assetAddress].assetData.priceFeed ==
            address(0)
        ) {
            _ownerAssetAddresses[ownerAddress].push(assetAddress);
        }

        // Store asset data
        _ownerAssets[ownerAddress][assetAddress] = AssetInfo({
            assetData: AssetManager.PaymentAsset(
                priceFeed,
                tokenDecimals,
                stalePriceThresholdInSeconds
            ),
            symbol: symbol,
            owner: ownerAddress
        });

        // Update symbol mappings
        _ownerLowercaseSymbolToAsset[ownerAddress][lowerSymbol] = assetAddress;
        _ownerAssetToOriginalSymbol[ownerAddress][assetAddress] = symbol;
    }

    /**
     * @dev Adds a new asset for the caller
     * @param assetAddress Address representing the asset
     * @param priceFeed Chainlink price feed address
     * @param tokenDecimals Decimals for the token
     * @param stalePriceThresholdInSeconds Max age for price data
     * @param symbol Asset symbol
     */
    function addAsset(
        address assetAddress,
        address priceFeed,
        uint8 tokenDecimals,
        uint64 stalePriceThresholdInSeconds,
        string memory symbol
    ) external nonReentrant {
        address assetOwner = msg.sender;
        string memory lowerSymbol = symbol._toLower();
        
        // Check symbol isn't already used
        require(
            _ownerLowercaseSymbolToAsset[assetOwner][lowerSymbol] == address(0),
            "Symbol already exists for this owner"
        );

        // Create new asset config
        AssetManager.PaymentAsset memory newAsset = AssetManager.PaymentAsset({
            priceFeed: priceFeed,
            tokenDecimals: tokenDecimals,
            stalePriceThresholdInSeconds: stalePriceThresholdInSeconds
        });

        // Validate the price feed
        AssetManager._validatePriceFeed(newAsset);

        // Store asset data
        _ownerAssets[assetOwner][assetAddress] = AssetInfo({
            assetData: newAsset,
            symbol: symbol,
            owner: assetOwner
        });

        // Update symbol mappings
        _ownerSymbolToAsset[assetOwner][symbol] = assetAddress;
        _ownerLowercaseSymbolToAsset[assetOwner][lowerSymbol] = assetAddress;
        _ownerAssetToOriginalSymbol[assetOwner][assetAddress] = symbol;
        _ownerAssetAddresses[assetOwner].push(assetAddress);

        // Emit event
        emit AssetAdded(
            assetOwner,
            assetAddress,
            symbol,
            priceFeed,
            tokenDecimals,
            stalePriceThresholdInSeconds
        );
    }


    /**
     * @dev Removes an asset from the caller's list
     * @param assetAddress Address of the asset to remove
     */
    function removeAsset(address assetAddress) external {
        address assetOwner = msg.sender;
        
        // Check asset exists
        require(
            _ownerAssets[assetOwner][assetAddress].assetData.priceFeed !=
                address(0),
            "Asset not found for this owner"
        );
        
        // Check caller owns the asset
        require(
            _ownerAssets[assetOwner][assetAddress].owner == assetOwner,
            "Not the owner of this asset"
        );

        // Get symbol info
        string memory symbol = _ownerAssets[assetOwner][assetAddress].symbol;
        string memory lowerSymbol = symbol._toLower();

        // Clean up mappings
        delete _ownerSymbolToAsset[assetOwner][symbol];
        delete _ownerLowercaseSymbolToAsset[assetOwner][lowerSymbol];
        delete _ownerAssetToOriginalSymbol[assetOwner][assetAddress];
        delete _ownerAssets[assetOwner][assetAddress];

        // Remove from addresses array
        address[] storage assetAddresses = _ownerAssetAddresses[assetOwner];
        for (uint256 i = 0; i < assetAddresses.length; i++) {
            if (assetAddresses[i] == assetAddress) {
                // Swap with last element and pop
                assetAddresses[i] = assetAddresses[assetAddresses.length - 1];
                assetAddresses.pop();
                break;
            }
        }

        // Emit event
        emit AssetRemoved(assetOwner, assetAddress);
    }

    /**
     * @dev Updates an asset's symbol
     * @param assetAddress Address of the asset
     * @param newSymbol New symbol to use
     */
    function updateSymbol(
        address assetAddress,
        string memory newSymbol
    )
        external
        onlySupportedAsset(msg.sender, assetAddress)
        onlyAssetOwner(msg.sender, assetAddress)
    {
        address assetOwner = msg.sender;
        
        // Validate new symbol
        require(bytes(newSymbol).length > 0, "Symbol cannot be empty");
        require(
            keccak256(bytes(newSymbol)) !=
                keccak256(bytes(_ownerAssets[assetOwner][assetAddress].symbol)),
            "Symbol must be different"
        );
        require(
            _ownerSymbolToAsset[assetOwner][newSymbol] == address(0),
            "Symbol already exists for this owner"
        );

        // Get old symbol info
        string memory oldSymbol = _ownerAssets[assetOwner][assetAddress].symbol;
        string memory oldLowerSymbol = oldSymbol._toLower();
        string memory newLowerSymbol = newSymbol._toLower();

        // Clean up old symbol mappings
        delete _ownerSymbolToAsset[assetOwner][oldSymbol];
        delete _ownerLowercaseSymbolToAsset[assetOwner][oldLowerSymbol];

        // Update to new symbol
        _ownerAssets[assetOwner][assetAddress].symbol = newSymbol;
        _ownerSymbolToAsset[assetOwner][newSymbol] = assetAddress;
        _ownerLowercaseSymbolToAsset[assetOwner][newLowerSymbol] = assetAddress;
        _ownerAssetToOriginalSymbol[assetOwner][assetAddress] = newSymbol;

        // Emit event
        emit SymbolUpdated(assetOwner, assetAddress, oldSymbol, newSymbol);
    }

    /**
     * @dev Gets asset details by symbol
     * @param ownerAddress Owner's address
     * @param symbol Asset symbol to look up
     * @return assetAddress Address of the asset
     * @return originalSymbol Original symbol (case-sensitive)
     * @return asset Asset configuration data
     */
    function getAssetBySymbol(
        address ownerAddress,
        string memory symbol
    )
        external
        view
        returns (
            address assetAddress,
            string memory originalSymbol,
            AssetManager.PaymentAsset memory asset
        )
    {
        require(bytes(symbol).length > 0, "Empty symbol");

        // Look up by lowercase symbol
        string memory lowerSymbol = symbol._toLower();
        assetAddress = _ownerLowercaseSymbolToAsset[ownerAddress][lowerSymbol];

        require(assetAddress != address(0), "Symbol not found for this owner");

        // Get original symbol and asset data
        originalSymbol = _ownerAssetToOriginalSymbol[ownerAddress][
            assetAddress
        ];
        asset = _ownerAssets[ownerAddress][assetAddress].assetData;

        // Double-check symbol mapping
        require(
            keccak256(bytes(originalSymbol._toLower())) ==
                keccak256(bytes(lowerSymbol)),
            "Symbol mapping corrupted"
        );
    }

    /**
     * @dev Gets current price for an asset
     * @param ownerAddress Owner's address
     * @param assetAddress Asset address
     * @return price Current price
     * @return decimals Price decimals
     */
    function getTokenPrice(
        address ownerAddress,
        address assetAddress
    )
        external
        view
        onlySupportedAsset(ownerAddress, assetAddress)
        returns (int256 price, uint8 decimals)
    {
        // Try to get price safely
        try this._safeGetPrice(ownerAddress, assetAddress) returns (
            uint256 safePrice,
            uint8 priceDecimals
        ) {
            return (int256(safePrice), priceDecimals);
        } catch {
            // Return zeros if error
            return (0, 0);
        }
    }

    /**
     * @dev Gets current price by symbol
     * @param ownerAddress Owner's address
     * @param symbol Asset symbol
     * @return price Current price
     * @return decimals Price decimals
     */
    function getTokenPriceBySymbol(
        address ownerAddress,
        string memory symbol
    ) external view returns (int256 price, uint8 decimals) {
        // Look up asset address
        string memory lowerSymbol = symbol._toLower();
        address assetAddress = _ownerLowercaseSymbolToAsset[ownerAddress][
            lowerSymbol
        ];
        require(assetAddress != address(0), "Symbol not found for this owner");

        // Try to get price safely
        try this._safeGetPrice(ownerAddress, assetAddress) returns (
            uint256 safePrice,
            uint8 priceDecimals
        ) {
            return (int256(safePrice), priceDecimals);
        } catch {
            // Return zeros if error
            return (0, 0);
        }
    }

    /**
     * @dev Internal function to safely get price (external for try/catch)
     * @param ownerAddress Owner's address
     * @param assetAddress Asset address
     * @return Safe price and decimals
     */
    function _safeGetPrice(
        address ownerAddress,
        address assetAddress
    ) external view returns (uint256, uint8) {
        // Must be external for try/catch to work
        return _ownerAssets[ownerAddress][assetAddress].assetData._getPrice();
    }


    /**
     * @dev Converts token amount to USD value
     * @param ownerAddress Owner's address
     * @param assetAddress Asset address
     * @param tokenAmount Amount of tokens
     * @return USD value
     */
    function getUsdValue(
        address ownerAddress,
        address assetAddress,
        uint248 tokenAmount
    )
        external
        view
        onlySupportedAsset(ownerAddress, assetAddress)
        returns (uint248)
    {
        // Try to get price and convert
        try this._safeGetPrice(ownerAddress, assetAddress) returns (
            uint256 safePrice,
            uint8 priceDecimals
        ) {
            return
                _ownerAssets[ownerAddress][assetAddress]
                    .assetData
                    .tokenDecimals
                    ._safeConvertToUsd(tokenAmount, safePrice, priceDecimals);
        } catch {
            // Return zero if error
            return 0;
        }
    }

    /**
     * @dev Converts USD value to token amount
     * @param ownerAddress Owner's address
     * @param assetAddress Asset address
     * @param usdValue USD value
     * @return Token amount
     */
    function getTokenAmount(
        address ownerAddress,
        address assetAddress,
        uint248 usdValue
    )
        external
        view
        onlySupportedAsset(ownerAddress, assetAddress)
        returns (uint248)
    {
        // Try to get price and convert
        try this._safeGetPrice(ownerAddress, assetAddress) returns (
            uint256 safePrice,
            uint8 priceDecimals
        ) {
            return
                _ownerAssets[ownerAddress][assetAddress]
                    .assetData
                    .tokenDecimals
                    ._safeConvertToToken(usdValue, safePrice, priceDecimals);
        } catch {
            // Return zero if error
            return 0;
        }
    }


    /**
     * @dev Gets all assets for an owner
     * @param ownerAddress Owner's address
     * @return Array of asset addresses
     * @return Array of asset symbols
     */
    function getAllAssets(
        address ownerAddress
    ) external view returns (address[] memory, string[] memory) {
        address[] memory assetAddresses = _ownerAssetAddresses[ownerAddress];
        uint uniqueCount = 0;
        address[] memory uniqueAddresses = new address[](assetAddresses.length);

        // Find unique assets
        for (uint i = 0; i < assetAddresses.length; i++) {
            bool exists = false;
            for (uint j = 0; j < uniqueCount; j++) {
                if (uniqueAddresses[j] == assetAddresses[i]) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                uniqueAddresses[uniqueCount] = assetAddresses[i];
                uniqueCount++;
            }
        }

        // Prepare return arrays
        address[] memory resultAddresses = new address[](uniqueCount);
        string[] memory resultSymbols = new string[](uniqueCount);

        // Populate return arrays
        for (uint i = 0; i < uniqueCount; i++) {
            resultAddresses[i] = uniqueAddresses[i];
            resultSymbols[i] = _ownerAssetToOriginalSymbol[ownerAddress][
                uniqueAddresses[i]
            ];
        }

        return (resultAddresses, resultSymbols);
    }


    /**
     * @dev Gets detailed price feed info
     * @param ownerAddress Owner's address
     * @param assetAddress Asset address
     * @return roundId Current round ID
     * @return answer Current price
     * @return startedAt Round start time
     * @return updatedAt Last update time
     * @return answeredInRound Round ID when answer was computed
     */
    function getPriceFeedDetails(
        address ownerAddress,
        address assetAddress
    )
        external
        view
        onlySupportedAsset(ownerAddress, assetAddress)
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {

        AssetManager.PaymentAsset memory asset = _ownerAssets[ownerAddress][assetAddress].assetData;

        AssetManager._validatePriceFeed(asset);
        
        // Get price feed contract
        AggregatorV3Interface priceFeed = AggregatorV3Interface(asset.priceFeed);
        return priceFeed.latestRoundData();
    }

    /**
     * @dev Gets all assets with current prices
     * @param ownerAddress Owner's address
     * @return addresses Asset addresses
     * @return symbols Asset symbols
     * @return prices Current prices
     * @return decimals Price decimals
     * @return lastUpdatedTimes Last update timestamps
     */
    function getAllAssetsWithPrices(
        address ownerAddress
    )
        external
        view
        returns (
            address[] memory addresses,
            string[] memory symbols,
            int256[] memory prices,
            uint8[] memory decimals,
            uint256[] memory lastUpdatedTimes
        )
    {
        address[] memory assetAddresses = _ownerAssetAddresses[ownerAddress];

        // Find unique assets
        uint uniqueCount = 0;
        address[] memory uniqueAddresses = new address[](assetAddresses.length);

        for (uint i = 0; i < assetAddresses.length; i++) {
            bool exists = false;
            for (uint j = 0; j < uniqueCount; j++) {
                if (uniqueAddresses[j] == assetAddresses[i]) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                uniqueAddresses[uniqueCount] = assetAddresses[i];
                uniqueCount++;
            }
        }

        // Initialize return arrays
        addresses = new address[](uniqueCount);
        symbols = new string[](uniqueCount);
        prices = new int256[](uniqueCount);
        decimals = new uint8[](uniqueCount);
        lastUpdatedTimes = new uint256[](uniqueCount);

        // Populate return arrays
        for (uint i = 0; i < uniqueCount; i++) {
            address assetAddress = uniqueAddresses[i];
            AssetInfo storage assetInfo = _ownerAssets[ownerAddress][
                assetAddress
            ];

            addresses[i] = assetAddress;
            symbols[i] = assetInfo.symbol;

            // Get price with fallback
            (prices[i], decimals[i]) = assetInfo
                .assetData
                ._getPriceWithFallback(assetInfo.assetData.priceFeed);

            // Get last updated time
            lastUpdatedTimes[i] = PriceFeedUtils._getUpdatedTimeWithFallback(
                assetInfo.assetData.priceFeed
            );
        }
    }

    /**
     * @dev Converts USD values to equivalent token amounts for all supported assets
     * @param ownerAddress Address of the asset owner
     * @param usdValues Array of USD amounts to convert (1:1 mapping to assets)
     * @return data Contains converted amounts and asset details including:
     *         - addresses: Asset contract addresses
     *         - symbols: Asset symbols
     *         - amounts: Converted token amounts
     *         - prices: Current asset prices
     *         - priceDecimals: Price feed decimals
     *         - tokenDecimals: Token decimals
     *         - lastUpdatedTimes: When prices were last updated
     */
    function getAllConvertUsdToToken(
        address ownerAddress,
        uint248[] memory usdValues
    ) external view returns (AssetConversionData memory data) {
        address[] memory assetAddresses = _ownerAssetAddresses[ownerAddress];
        require(
            usdValues.length == assetAddresses.length,
            "Input array length mismatch"
        );

        uint uniqueCount = _getUniqueAssetCount(ownerAddress);

        // Initialize return structure
        data = AssetConversionData({
            addresses: new address[](uniqueCount),
            symbols: new string[](uniqueCount),
            amounts: new uint248[](uniqueCount),
            prices: new int256[](uniqueCount),
            priceDecimals: new uint8[](uniqueCount),
            tokenDecimals: new uint8[](uniqueCount),
            lastUpdatedTimes: new uint256[](uniqueCount)
        });

        // Process each asset
        for (uint i = 0; i < uniqueCount; i++) {
            address assetAddress = assetAddresses[i];
            AssetInfo storage assetInfo = _ownerAssets[ownerAddress][
                assetAddress
            ];

            // Set basic info
            data.addresses[i] = assetAddress;
            data.symbols[i] = assetInfo.symbol;
            data.tokenDecimals[i] = assetInfo.assetData.tokenDecimals;

            // Get price with fallback
            (data.prices[i], data.priceDecimals[i]) = assetInfo
                .assetData
                ._getPriceWithFallback(assetInfo.assetData.priceFeed);

            // Convert USD to tokens
            data.amounts[i] = assetInfo
                .assetData
                .tokenDecimals
                ._safeConvertToToken(
                    usdValues[i],
                    uint256(data.prices[i]),
                    data.priceDecimals[i]
                );

            // Get last updated time
            data.lastUpdatedTimes[i] = PriceFeedUtils
                ._getUpdatedTimeWithFallback(assetInfo.assetData.priceFeed);
        }
    }

    

    /**
     * @dev Converts token amounts to USD values for all assets
     * @param ownerAddress Owner's address
     * @param tokenAmounts Array of token amounts to convert
     * @return data Structure containing conversion results with addresses, symbols, amounts, prices, etc.
     */
    function getAllPriceToConvertToUsd(
        address ownerAddress,
        uint248[] memory tokenAmounts
    ) external view returns (AssetConversionData memory data) {
        address[] memory assetAddresses = _ownerAssetAddresses[ownerAddress];
        require(
            tokenAmounts.length == assetAddresses.length,
            "Input array length mismatch"
        );

        uint uniqueCount = _getUniqueAssetCount(ownerAddress);

        // Initialize all arrays
        data = AssetConversionData({
            addresses: new address[](uniqueCount),
            symbols: new string[](uniqueCount),
            amounts: new uint248[](uniqueCount),
            prices: new int256[](uniqueCount),
            priceDecimals: new uint8[](uniqueCount),
            tokenDecimals: new uint8[](uniqueCount),
            lastUpdatedTimes: new uint256[](uniqueCount)
        });

        for (uint i = 0; i < uniqueCount; i++) {
            address assetAddress = assetAddresses[i];
            AssetInfo storage assetInfo = _ownerAssets[ownerAddress][
                assetAddress
            ];

            // Set basic info
            data.addresses[i] = assetAddress;
            data.symbols[i] = assetInfo.symbol;
            data.tokenDecimals[i] = assetInfo.assetData.tokenDecimals;

            // Get price data
            (data.prices[i], data.priceDecimals[i]) = assetInfo
                .assetData
                ._getPriceWithFallback(assetInfo.assetData.priceFeed);

            // Calculate USD value
            data.amounts[i] = assetInfo
                .assetData
                .tokenDecimals
                ._safeConvertToUsd(
                    tokenAmounts[i],
                    uint256(data.prices[i]),
                    data.priceDecimals[i]
                );

            // Get last updated time
            data.lastUpdatedTimes[i] = PriceFeedUtils
                ._getUpdatedTimeWithFallback(assetInfo.assetData.priceFeed);
        }
    }

    /**
     * @dev Helper to count unique assets for an owner
     * @param ownerAddress Owner's address
     * @return Count of unique assets
     */
    function _getUniqueAssetCount(
        address ownerAddress
    ) internal view returns (uint) {
        address[] memory assetAddresses = _ownerAssetAddresses[ownerAddress];
        uint uniqueCount = 0;

        for (uint i = 0; i < assetAddresses.length; i++) {
            bool exists = false;
            for (uint j = 0; j < uniqueCount; j++) {
                if (assetAddresses[j] == assetAddresses[i]) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                uniqueCount++;
            }
        }

        return uniqueCount;
    }

   
}
