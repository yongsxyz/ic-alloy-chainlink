// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "../src/AssetPriceRegistry.sol";


// Mock Chainlink Aggregator
contract MockAggregatorV3 {
    int256 public price;
    uint8 public decimals;
    uint80 public roundId;
    uint256 public updatedAt;
    uint80 public answeredInRound;
    uint256 public startedAt;
    bool public shouldRevert;

    constructor(int256 _price, uint8 _decimals) {
        price = _price;
        decimals = _decimals;
        roundId = 1;
        updatedAt = block.timestamp;
        answeredInRound = 1;
        startedAt = block.timestamp;
        shouldRevert = false;
    }

    function latestRoundData()
        external
        view
        returns (
            uint80 _roundId,
            int256 _price,
            uint256 _startedAt,
            uint256 _updatedAt,
            uint80 _answeredInRound
        )
    {
        require(!shouldRevert, "Mock revert");
        return (roundId, price, startedAt, updatedAt, answeredInRound);
    }

    function setPrice(int256 _price) external {
        price = _price;
        updatedAt = block.timestamp;
    }

    function setUpdatedAt(uint256 _updatedAt) external {
        updatedAt = _updatedAt;
    }

    function setRoundData(
        uint80 _roundId,
        uint80 _answeredInRound,
        uint256 _startedAt
    ) external {
        roundId = _roundId;
        answeredInRound = _answeredInRound;
        startedAt = _startedAt;
    }

    function setShouldRevert(bool _shouldRevert) external {
        shouldRevert = _shouldRevert;
    }
}

contract AssetPriceRegistryCanifyFinanceTest is Test {
    AssetPriceRegistryCanifyFinance public AssetPriceRegistry;
    MockAggregatorV3 public mockPriceFeed1;
    MockAggregatorV3 public mockPriceFeed2;
    MockAggregatorV3 public mockPriceFeed3;

    address public owner1 = address(0x123);
    address public owner2 = address(0x456);
    address public asset1 = address(0x111);
    address public asset2 = address(0x222);
    address public asset3 = address(0x333);

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

    function setUp() public {
        // Deploy mock price feeds
        mockPriceFeed1 = new MockAggregatorV3(100e8, 8); // $100
        mockPriceFeed2 = new MockAggregatorV3(2000e8, 8); // $2000
        mockPriceFeed3 = new MockAggregatorV3(1e18, 18); // $1

        // Deploy AssetPriceRegistry with owner1 as initial owner
        AssetPriceRegistry = new AssetPriceRegistryCanifyFinance(owner1);
    }

    // Test addAsset function
    function test_AddAsset_Success() public {
        vm.prank(owner1);
        vm.expectEmit(true, true, false, true);
        emit AssetAdded(
            owner1,
            asset1,
            "TEST1",
            address(mockPriceFeed1),
            18,
            3600
        );

        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TEST1");

        (address[] memory addresses, string[] memory symbols) = AssetPriceRegistry
            .getAllAssets(owner1);
        bool found = false;
        for (uint i = 0; i < addresses.length; i++) {
            if (
                addresses[i] == asset1 &&
                keccak256(bytes(symbols[i])) == keccak256(bytes("TEST1"))
            ) {
                found = true;
                break;
            }
        }
        assertTrue(found);
    }

    function test_AddAsset_InvalidPriceFeed_ZeroAddress() public {
        vm.prank(owner1);
        vm.expectRevert(AssetManager.InvalidPriceFeed.selector);
        AssetPriceRegistry.addAsset(asset1, address(0), 18, 3600, "TEST");
    }

    function test_AddAsset_InvalidPriceFeed_NotContract() public {
        vm.prank(owner1);
        vm.expectRevert(AssetManager.InvalidPriceFeed.selector);
        AssetPriceRegistry.addAsset(asset1, address(0x999), 18, 3600, "TEST");
    }

    function test_AddAsset_InvalidPriceFeedData_NegativePrice() public {
        MockAggregatorV3 badFeed = new MockAggregatorV3(-100e8, 8);

        vm.prank(owner1);
        vm.expectRevert(AssetManager.InvalidPriceFeedData.selector);
        AssetPriceRegistry.addAsset(asset1, address(badFeed), 18, 3600, "TEST");
    }

    function test_AddAsset_InvalidPriceFeedData_ZeroStartedAt() public {
        MockAggregatorV3 badFeed = new MockAggregatorV3(100e8, 8);
        badFeed.setRoundData(1, 1, 0); // startedAt = 0

        vm.prank(owner1);
        vm.expectRevert(AssetManager.InvalidPriceFeedData.selector);
        AssetPriceRegistry.addAsset(asset1, address(badFeed), 18, 3600, "TEST");
    }

    function test_AddAsset_InvalidPriceFeedData_AnsweredInRoundLower() public {
        MockAggregatorV3 badFeed = new MockAggregatorV3(100e8, 8);
        badFeed.setRoundData(5, 3, block.timestamp); // answeredInRound < roundId

        vm.prank(owner1);
        vm.expectRevert(AssetManager.InvalidPriceFeedData.selector);
        AssetPriceRegistry.addAsset(asset1, address(badFeed), 18, 3600, "TEST");
    }


    function test_AddAsset_SymbolAlreadyExists() public {
        vm.startPrank(owner1);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TEST");

        vm.expectRevert("Symbol already exists for this owner");
        AssetPriceRegistry.addAsset(asset2, address(mockPriceFeed2), 18, 3600, "TEST");
        vm.stopPrank();
    }

    function test_AddAsset_SymbolAlreadyExists_CaseInsensitive() public {
        vm.startPrank(owner1);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "test");

        vm.expectRevert("Symbol already exists for this owner");
        AssetPriceRegistry.addAsset(asset2, address(mockPriceFeed2), 18, 3600, "TEST");
        vm.stopPrank();
    }

    function test_AddAsset_DifferentOwners_SameSymbol() public {
        // Owner1 adds asset with symbol "TEST"
        vm.prank(owner1);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TEST");

        // Owner2 can add asset with same symbol "TEST"
        vm.prank(owner2);
        AssetPriceRegistry.addAsset(asset2, address(mockPriceFeed2), 18, 3600, "TEST");

        (address[] memory addresses1, ) = AssetPriceRegistry.getAllAssets(owner1);
        (address[] memory addresses2, ) = AssetPriceRegistry.getAllAssets(owner2);

        assertTrue(addresses1.length > 0);
        assertTrue(addresses2.length > 0);
    }

    // Test removeAsset function
    function test_RemoveAsset_Success() public {
        vm.startPrank(owner1);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TEST1");

        vm.expectEmit(true, true, false, false);
        emit AssetRemoved(owner1, asset1);

        AssetPriceRegistry.removeAsset(asset1);
        vm.stopPrank();

        (address[] memory addresses, ) = AssetPriceRegistry.getAllAssets(owner1);
        for (uint i = 0; i < addresses.length; i++) {
            assertNotEq(addresses[i], asset1);
        }
    }

    function test_RemoveAsset_NotFound() public {
        vm.prank(owner1);
        vm.expectRevert("Asset not found for this owner");
        AssetPriceRegistry.removeAsset(asset1);
    }

    function test_RemoveAsset_NotOwner() public {
        vm.prank(owner1);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TEST1");

        vm.prank(owner2);
        vm.expectRevert("Asset not found for this owner");
        AssetPriceRegistry.removeAsset(asset1);
    }

    // Test updateSymbol function
    function test_UpdateSymbol_Success() public {
        vm.startPrank(owner1);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "OLD");

        vm.expectEmit(true, true, false, true);
        emit SymbolUpdated(owner1, asset1, "OLD", "NEW");

        AssetPriceRegistry.updateSymbol(asset1, "NEW");
        vm.stopPrank();

        (address[] memory addresses, string[] memory symbols) = AssetPriceRegistry
            .getAllAssets(owner1);
        bool found = false;
        for (uint i = 0; i < addresses.length; i++) {
            if (addresses[i] == asset1) {
                assertEq(symbols[i], "NEW");
                found = true;
                break;
            }
        }
        assertTrue(found);
    }

    function test_UpdateSymbol_EmptySymbol() public {
        vm.startPrank(owner1);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "OLD");

        vm.expectRevert("Symbol cannot be empty");
        AssetPriceRegistry.updateSymbol(asset1, "");
        vm.stopPrank();
    }

    function test_UpdateSymbol_SameSymbol() public {
        vm.startPrank(owner1);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TEST");

        vm.expectRevert("Symbol must be different");
        AssetPriceRegistry.updateSymbol(asset1, "TEST");
        vm.stopPrank();
    }

    function test_UpdateSymbol_SymbolAlreadyExists() public {
        vm.startPrank(owner1);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TEST1");
        AssetPriceRegistry.addAsset(asset2, address(mockPriceFeed2), 18, 3600, "TEST2");

        vm.expectRevert("Symbol already exists for this owner");
        AssetPriceRegistry.updateSymbol(asset1, "TEST2");
        vm.stopPrank();
    }

    function test_UpdateSymbol_AssetNotSupported() public {
        vm.prank(owner1);
        vm.expectRevert("Asset not supported for this owner");
        AssetPriceRegistry.updateSymbol(asset1, "NEW");
    }

    function test_UpdateSymbol_NotOwner() public {
        vm.prank(owner1);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TEST");

        vm.prank(owner2);
        vm.expectRevert("Asset not supported for this owner");
        AssetPriceRegistry.updateSymbol(asset1, "NEW");
    }

    // Test getAssetBySymbol function
    function test_GetAssetBySymbol_Success() public {
        vm.prank(owner1);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TEST");

        (
            address assetAddress,
            string memory originalSymbol,
            AssetManager.PaymentAsset memory asset
        ) = AssetPriceRegistry.getAssetBySymbol(owner1, "TEST");

        assertEq(assetAddress, asset1);
        assertEq(originalSymbol, "TEST");
        assertEq(asset.priceFeed, address(mockPriceFeed1));
        assertEq(asset.tokenDecimals, 18);
        assertEq(asset.stalePriceThresholdInSeconds, 3600);
    }

    function test_GetAssetBySymbol_CaseInsensitive() public {
        vm.prank(owner1);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TeSt");

        (address assetAddress, string memory originalSymbol, ) = AssetPriceRegistry
            .getAssetBySymbol(owner1, "test");

        assertEq(assetAddress, asset1);
        assertEq(originalSymbol, "TeSt");
    }

    function test_GetAssetBySymbol_EmptySymbol() public {
        vm.expectRevert("Empty symbol");
        AssetPriceRegistry.getAssetBySymbol(owner1, "");
    }

    function test_GetAssetBySymbol_NotFound() public {
        vm.expectRevert("Symbol not found for this owner");
        AssetPriceRegistry.getAssetBySymbol(owner1, "NOTFOUND");
    }

    // Test getTokenPrice function
    function test_GetTokenPrice_Success() public {
        vm.prank(owner1);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TEST");

        (int256 price, uint8 decimals) = AssetPriceRegistry.getTokenPrice(owner1, asset1);

        assertEq(price, 100e8);
        assertEq(decimals, 8);
    }

    function test_GetTokenPrice_AssetNotSupported() public {
        vm.expectRevert("Asset not supported for this owner");
        AssetPriceRegistry.getTokenPrice(owner1, asset1);
    }

    // Test getTokenPriceBySymbol function
    function test_GetTokenPriceBySymbol_Success() public {
        vm.prank(owner1);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TEST");

        (int256 price, uint8 decimals) = AssetPriceRegistry.getTokenPriceBySymbol(
            owner1,
            "TEST"
        );

        assertEq(price, 100e8);
        assertEq(decimals, 8);
    }

    function test_GetTokenPriceBySymbol_NotFound() public {
        vm.expectRevert("Symbol not found for this owner");
        AssetPriceRegistry.getTokenPriceBySymbol(owner1, "NOTFOUND");
    }


    // Test getUsdValue function
    function test_GetUsdValue_Success() public {
        vm.prank(owner1);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TEST");

        uint248 usdValue = AssetPriceRegistry.getUsdValue(owner1, asset1, 1e18); // 1 token

        // Price is 100e8, token has 18 decimals, price has 8 decimals
        // Expected: (1e18 * 100e8) / 10^(18+8-18) = 1e18 * 100e8 / 1e8 = 100e18
        assertEq(usdValue, 100e18);
    }

    function test_GetUsdValue_AssetNotSupported() public {
        vm.expectRevert("Asset not supported for this owner");
        AssetPriceRegistry.getUsdValue(owner1, asset1, 1e18);
    }

    // Test getTokenAmount function
    function test_GetTokenAmount_Success() public {
        vm.prank(owner1);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TEST");

        uint248 tokenAmount = AssetPriceRegistry.getTokenAmount(owner1, asset1, 100e18); // $100

        // Price is 100e8, want $100 (100e18)
        // Expected: (100e18 * 10^(18+8-18)) / 100e8 = 100e18 * 1e8 / 100e8 = 1e18
        assertEq(tokenAmount, 1e18);
    }

    function test_GetTokenAmount_AssetNotSupported() public {
        vm.expectRevert("Asset not supported for this owner");
        AssetPriceRegistry.getTokenAmount(owner1, asset1, 100e18);
    }

    // Test getAllAssets function
    function test_GetAllAssets_Empty() public view {
        (address[] memory addresses, string[] memory symbols) = AssetPriceRegistry
            .getAllAssets(owner2);
        assertEq(addresses.length, 0);
        assertEq(symbols.length, 0);
    }

    function test_GetAllAssets_WithAssets() public {
        vm.startPrank(owner2);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TEST1");
        AssetPriceRegistry.addAsset(asset2, address(mockPriceFeed2), 8, 7200, "TEST2");
        vm.stopPrank();

        (address[] memory addresses, string[] memory symbols) = AssetPriceRegistry
            .getAllAssets(owner2);

        assertEq(addresses.length, 2);
        assertEq(symbols.length, 2);

        bool found1 = false;
        bool found2 = false;
        for (uint i = 0; i < addresses.length; i++) {
            if (
                addresses[i] == asset1 &&
                keccak256(bytes(symbols[i])) == keccak256(bytes("TEST1"))
            ) {
                found1 = true;
            }
            if (
                addresses[i] == asset2 &&
                keccak256(bytes(symbols[i])) == keccak256(bytes("TEST2"))
            ) {
                found2 = true;
            }
        }
        assertTrue(found1);
        assertTrue(found2);
    }

    // Test getPriceFeedDetails function
    function test_GetPriceFeedDetails_Success() public {
        vm.prank(owner1);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TEST");

        (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = AssetPriceRegistry.getPriceFeedDetails(owner1, asset1);

        assertEq(roundId, 1);
        assertEq(answer, 100e8);
        assertEq(startedAt, block.timestamp);
        assertEq(updatedAt, block.timestamp);
        assertEq(answeredInRound, 1);
    }

    function test_GetPriceFeedDetails_AssetNotSupported() public {
        vm.expectRevert("Asset not supported for this owner");
        AssetPriceRegistry.getPriceFeedDetails(owner1, asset1);
    }

    // Test getAllAssetsWithPrices function
    function test_GetAllAssetsWithPrices_Success() public {
        vm.startPrank(owner2);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TEST1");
        AssetPriceRegistry.addAsset(asset2, address(mockPriceFeed2), 8, 7200, "TEST2");
        vm.stopPrank();

        (
            address[] memory addresses,
            string[] memory symbols,
            int256[] memory prices,
            uint8[] memory decimals,
            uint256[] memory lastUpdatedTimes
        ) = AssetPriceRegistry.getAllAssetsWithPrices(owner2);

        assertEq(addresses.length, 2);
        assertEq(symbols.length, 2);
        assertEq(prices.length, 2);
        assertEq(decimals.length, 2);
        assertEq(lastUpdatedTimes.length, 2);

        // Check first asset
        assertEq(addresses[0], asset1);
        assertEq(symbols[0], "TEST1");
        assertEq(prices[0], 100e8);
        assertEq(decimals[0], 8);

        // Check second asset
        assertEq(addresses[1], asset2);
        assertEq(symbols[1], "TEST2");
        assertEq(prices[1], 2000e8);
        assertEq(decimals[1], 8);
    }

    function test_GetAllAssetsWithPrices_Empty() public view {
        (
            address[] memory addresses,
            string[] memory symbols,
            int256[] memory prices,
            uint8[] memory decimals,
            uint256[] memory lastUpdatedTimes
        ) = AssetPriceRegistry.getAllAssetsWithPrices(address(0x999));

        assertEq(addresses.length, 0);
        assertEq(symbols.length, 0);
        assertEq(prices.length, 0);
        assertEq(decimals.length, 0);
        assertEq(lastUpdatedTimes.length, 0);
    }

    // Test getAllConvertUsdToToken function
    function test_GetAllConvertUsdToToken_Success() public {
        vm.startPrank(owner2);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TEST1");
        AssetPriceRegistry.addAsset(asset2, address(mockPriceFeed2), 8, 7200, "TEST2");
        vm.stopPrank();

        uint248[] memory usdValues = new uint248[](2);
        usdValues[0] = 100e18; // $100
        usdValues[1] = 2000e18; // $2000

        AssetPriceRegistryCanifyFinance.AssetConversionData memory data = AssetPriceRegistry
            .getAllConvertUsdToToken(owner2, usdValues);

        assertEq(data.addresses.length, 2);
        assertEq(data.symbols.length, 2);
        assertEq(data.amounts.length, 2);

        // For asset1: $100 at $100/token = 1 token (1e18)
        assertEq(data.amounts[0], 1e18);

        // For asset2: $2000 at $2000/token = 1 token (1e8 because 8 decimals)
        assertEq(data.amounts[1], 1e8);
    }

    function test_GetAllConvertUsdToToken_LengthMismatch() public {
        vm.startPrank(owner2);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TEST1");
        vm.stopPrank();

        uint248[] memory usdValues = new uint248[](2); // Wrong length

        vm.expectRevert("Input array length mismatch");
        AssetPriceRegistry.getAllConvertUsdToToken(owner2, usdValues);
    }

    // Test getAllPriceToConvertToUsd function
    function test_GetAllPriceToConvertToUsd_Success() public {
        vm.startPrank(owner2);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TEST1");
        AssetPriceRegistry.addAsset(asset2, address(mockPriceFeed2), 8, 7200, "TEST2");
        vm.stopPrank();

        uint248[] memory tokenAmounts = new uint248[](2);
        tokenAmounts[0] = 1e18; // 1 token
        tokenAmounts[1] = 1e8; // 1 token

        AssetPriceRegistryCanifyFinance.AssetConversionData memory data = AssetPriceRegistry
            .getAllPriceToConvertToUsd(owner2, tokenAmounts);

        assertEq(data.addresses.length, 2);
        assertEq(data.symbols.length, 2);
        assertEq(data.amounts.length, 2);

        // For asset1: 1 token at $100/token = $100 (100e18)
        assertEq(data.amounts[0], 100e18);

        // For asset2: 1 token at $2000/token = $2000 (2000e18)
        assertEq(data.amounts[1], 2000e18);
    }

    function test_GetAllPriceToConvertToUsd_LengthMismatch() public {
        vm.startPrank(owner2);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TEST1");
        vm.stopPrank();

        uint248[] memory tokenAmounts = new uint248[](2); // Wrong length

        vm.expectRevert("Input array length mismatch");
        AssetPriceRegistry.getAllPriceToConvertToUsd(owner2, tokenAmounts);
    }

    // Test Libraries

    // Test AssetManager library functions
    function test_AssetManager_IsContract() public {
        // This tests the isContract function indirectly through addAsset
        vm.prank(owner1);
        vm.expectRevert(AssetManager.InvalidPriceFeed.selector);
        AssetPriceRegistry.addAsset(asset1, address(0x999), 18, 3600, "TEST"); // EOA, not contract
    }

    function test_AssetManager_GetPrice_AssetNotSupported() public {
        // This tests the _getPrice function with zero address
        vm.prank(owner1);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TEST");

        // Now try to call _safeGetPrice externally (it's external for testing)
        (uint256 price, uint8 decimals) = AssetPriceRegistry._safeGetPrice(owner1, asset1);
        assertEq(price, 100e8);
        assertEq(decimals, 8);
    }

    // Test StringUtils library
    function test_StringUtils_ToLower() public {
        // This is tested indirectly through symbol operations
        vm.startPrank(owner1);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TeSt");

        (address assetAddress, , ) = AssetPriceRegistry.getAssetBySymbol(owner1, "test");
        assertEq(assetAddress, asset1);

        (assetAddress, , ) = AssetPriceRegistry.getAssetBySymbol(owner1, "TEST");
        assertEq(assetAddress, asset1);
        vm.stopPrank();
    }

    // Test PriceFeedUtils library
    function test_PriceFeedUtils_GetPriceWithFallback_Success() public {
        vm.prank(owner1);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TEST");

        (uint256 price, uint8 decimals) = AssetPriceRegistry._safeGetPrice(owner1, asset1);

        assertEq(price, 100e8);
        assertEq(decimals, 8);
    }

    function test_PriceFeedUtils_GetUpdatedTimeWithFallback_Success() public {
        vm.prank(owner1);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TEST");

        uint256 updatedAt = PriceFeedUtils._getUpdatedTimeWithFallback(
            address(mockPriceFeed1)
        );
        assertEq(updatedAt, block.timestamp);
    }

    function test_PriceFeedUtils_GetUpdatedTimeWithFallback_ZeroAddress()
        public
    {
        uint256 updatedAt = PriceFeedUtils._getUpdatedTimeWithFallback(
            address(0)
        );
        assertEq(updatedAt, 0);
    }

    function test_PriceFeedUtils_GetUpdatedTimeWithFallback_RevertingFeed()
        public
    {
        MockAggregatorV3 revertingFeed = new MockAggregatorV3(100e8, 8);
        revertingFeed.setShouldRevert(true);

        uint256 updatedAt = PriceFeedUtils._getUpdatedTimeWithFallback(
            address(revertingFeed)
        );
        assertEq(updatedAt, 0);
    }

    // Test ConversionUtils library
    function test_ConversionUtils_SafeConvertToUsd_Success() public {
        uint248 usdValue = ConversionUtils._safeConvertToUsd(
            18, // tokenDecimals
            1e18, // tokenAmount (1 token)
            100e8, // price ($100 with 8 decimals)
            8 // priceDecimals
        );

        // Expected: (1e18 * 100e8) / 1e8 = 100e18
        assertEq(usdValue, 100e18);
    }


    function test_ConversionUtils_SafeConvertToToken_Success() public {
        uint248 tokenAmount = ConversionUtils._safeConvertToToken(
            18, // tokenDecimals
            100e18, // usdValue ($100)
            100e8, // price ($100 with 8 decimals)
            8 // priceDecimals
        );

        // Expected: (100e18 * 1e8) / 100e8 = 1e18
        assertEq(tokenAmount, 1e18);
    }

    function test_ConversionUtils_SafeConvertToToken_ZeroPrice() public {
        uint248 tokenAmount = ConversionUtils._safeConvertToToken(
            18,
            100e18,
            0, // zero price
            8
        );

        assertEq(tokenAmount, 0);
    }



    // Test edge cases for getAllAssetsWithPrices
    function test_GetAllAssetsWithPrices_EmptyOwner() public view {
        (
            address[] memory addresses,
            string[] memory symbols,
            int256[] memory prices,
            uint8[] memory decimals,
            uint256[] memory lastUpdatedTimes
        ) = AssetPriceRegistry.getAllAssetsWithPrices(address(0x999));

        assertEq(addresses.length, 0);
        assertEq(symbols.length, 0);
        assertEq(prices.length, 0);
        assertEq(decimals.length, 0);
        assertEq(lastUpdatedTimes.length, 0);
    }

    // Test edge cases for getAllConvertUsdToToken
    function test_GetAllConvertUsdToToken_EmptyOwner() public {
        uint248[] memory usdValues = new uint248[](0);

        AssetPriceRegistryCanifyFinance.AssetConversionData memory data = AssetPriceRegistry
            .getAllConvertUsdToToken(address(0x999), usdValues);

        assertEq(data.addresses.length, 0);
        assertEq(data.symbols.length, 0);
        assertEq(data.amounts.length, 0);
    }

    // Test edge cases for getAllPriceToConvertToUsd
    function test_GetAllPriceToConvertToUsd_EmptyOwner() public {
        uint248[] memory tokenAmounts = new uint248[](0);

        AssetPriceRegistryCanifyFinance.AssetConversionData memory data = AssetPriceRegistry
            .getAllPriceToConvertToUsd(address(0x999), tokenAmounts);

        assertEq(data.addresses.length, 0);
        assertEq(data.symbols.length, 0);
        assertEq(data.amounts.length, 0);
    }

    // Test helper functions
    function test_GetUniqueAssetCount() public {
        vm.startPrank(owner2);
        AssetPriceRegistry.addAsset(asset1, address(mockPriceFeed1), 18, 3600, "TEST1");
        AssetPriceRegistry.addAsset(asset2, address(mockPriceFeed2), 8, 7200, "TEST2");
        vm.stopPrank();

        (address[] memory addresses, ) = AssetPriceRegistry.getAllAssets(owner2);
        uint uniqueCount = addresses.length;
        assertEq(uniqueCount, 2);
    }

    function test_GetUniqueAssetCount_Empty() public {
        (address[] memory addresses, ) = AssetPriceRegistry.getAllAssets(address(0x999));
        uint uniqueCount = addresses.length;
        assertEq(uniqueCount, 0);
    }




}
