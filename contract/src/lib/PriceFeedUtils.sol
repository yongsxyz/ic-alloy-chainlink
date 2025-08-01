// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;


import {AggregatorV3Interface} from "@chainlink/contracts/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "./AssetManager.sol";


/**
 * @title Price Feed Utilities Library
 * @dev Helper functions for working with price feeds
 */
library PriceFeedUtils {
    /**
     * @dev Gets price with fallback to zero if issues occur
     * @param asset Asset configuration
     * @param priceFeedAddress Price feed address
     * @return price Current price (or 0 if error)
     * @return decimals Price decimals (or token decimals if error)
     */
    function _getPriceWithFallback(
        AssetManager.PaymentAsset storage asset,
        address priceFeedAddress
    ) internal view returns (int256 price, uint8 decimals) {
        // Return zeros if no price feed
        if (priceFeedAddress == address(0)) {
            return (0, asset.tokenDecimals);
        }

        // Try to get price data
        try AggregatorV3Interface(priceFeedAddress).latestRoundData() returns (
            uint80 roundId,
            int256 answer,
            uint256 /*startedAt*/,
            uint256 updatedAt,
            uint80 answeredInRound
        ) {
            // Basic validation checks
            if (answer <= 0 || answeredInRound < roundId) {
                return (0, 0);
            }

            // Check for stale data
            if (
                updatedAt + asset.stalePriceThresholdInSeconds < block.timestamp
            ) {
                return (0, 0);
            }

            // Return valid data
            return (answer, AggregatorV3Interface(priceFeedAddress).decimals());
        } catch {
            // Fallback to zeros if any error occurs
            return (0, asset.tokenDecimals);
        }
    }

    /**
     * @dev Gets last updated time with fallback to zero
     * @param priceFeedAddress Price feed address
     * @return Last updated timestamp (or 0 if error)
     */
    function _getUpdatedTimeWithFallback(
        address priceFeedAddress
    ) internal view returns (uint256) {
        // Return zero if no price feed
        if (priceFeedAddress == address(0)) {
            return 0;
        }

        // Try to get timestamp
        try AggregatorV3Interface(priceFeedAddress).latestRoundData() returns (
            uint80 /*roundId*/,
            int256 /*answer*/,
            uint256 /*startedAt*/,
            uint256 timestamp,
            uint80 /*answeredInRound*/
        ) {
            return timestamp;
        } catch {
            // Fallback to zero if any error occurs
            return 0;
        }
    }
}
