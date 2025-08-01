// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {AggregatorV3Interface} from "@chainlink/contracts/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title Asset Management Library
 * @dev Handles core functionality for managing payment assets and price feeds
 */
library AssetManager {
    
    // Custom error definitions
    error InvalidPriceFeed();              
    error InvalidPriceFeedData();          
    error StalePriceFeedData();             
    error AssetNotSupported();          

    // Constants
    address public constant ZERO_ADDRESS = address(0);  // Zero address constant

    // Asset configuration structure
    struct PaymentAsset {
        address priceFeed;                   // Chainlink price feed address
        uint8 tokenDecimals;                // Decimals for the token
        uint64 stalePriceThresholdInSeconds; // Max age for price data
    }

    /**
     * @dev Checks if an address is a contract
     * @param addr Address to check
     * @return result True if it's a contract
     */
    function isContract(address addr) internal view returns (bool result) {
        assembly {
            result := gt(extcodesize(addr), 0)
        }
    }

    /**
     * @dev Validates a price feed's configuration and data
     * @param paymentAsset Asset configuration to validate
     */
    function _validatePriceFeed(
        PaymentAsset memory paymentAsset
    ) internal view {
        // Check price feed address is valid
        if (
            paymentAsset.priceFeed == ZERO_ADDRESS ||
            !isContract(paymentAsset.priceFeed)
        ) {
            revert InvalidPriceFeed();
        }

        // Get latest price data
        (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = AggregatorV3Interface(paymentAsset.priceFeed).latestRoundData();

        // Validate price data
        if (answer <= 0 || startedAt == 0 || answeredInRound < roundId) {
            revert InvalidPriceFeedData();
        }

        // Check if data is stale
        if (
            updatedAt + paymentAsset.stalePriceThresholdInSeconds <
            block.timestamp
        ) {
            revert StalePriceFeedData();
        }
    }

    /**
     * @dev Gets the current price from a price feed
     * @param paymentAsset Asset configuration
     * @return safePrice Current price as uint256
     * @return priceFeedDecimals Decimals for the price
     */
    function _getPrice(
        PaymentAsset storage paymentAsset
    ) internal view returns (uint256 safePrice, uint8 priceFeedDecimals) {
        // Check asset is supported
        if (paymentAsset.priceFeed == ZERO_ADDRESS) {
            revert AssetNotSupported();
        }

        // Get price feed contract
        AggregatorV3Interface priceFeedContract = AggregatorV3Interface(
            paymentAsset.priceFeed
        );

        // Fetch latest price data
        (
            uint80 roundId,
            int256 price,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeedContract.latestRoundData();

        // Validate price data
        if (price <= 0 || startedAt == 0 || answeredInRound < roundId) {
            revert InvalidPriceFeedData();
        }

        // Check for stale data
        if (
            block.timestamp >
            updatedAt + paymentAsset.stalePriceThresholdInSeconds
        ) {
            revert StalePriceFeedData();
        }

        // Return safe values
        safePrice = uint256(price);
        priceFeedDecimals = priceFeedContract.decimals();
    }
}
