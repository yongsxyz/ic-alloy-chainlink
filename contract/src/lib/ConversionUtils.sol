// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title Conversion Utilities Library
 * @dev Handles conversions between tokens and USD values
 */
library ConversionUtils {
    /**
     * @dev Converts token amount to USD value safely
     * @param tokenDecimals Token decimals
     * @param tokenAmount Amount of tokens
     * @param safePrice Current price
     * @param priceDecimals Price decimals
     * @return USD value (capped at uint248 max)
     */
    function _safeConvertToUsd(
        uint8 tokenDecimals,
        uint248 tokenAmount,
        uint256 safePrice,
        uint8 priceDecimals
    ) internal pure returns (uint248) {
        // Can't convert if price is zero
        if (safePrice == 0) return 0;

        uint256 value;
        
        // Handle different decimal scenarios
        if (tokenDecimals + priceDecimals >= 18) {
            // More decimals than needed - divide
            uint256 denominator = 10 ** (tokenDecimals + priceDecimals - 18);
            value = (tokenAmount * safePrice) / denominator;
        } else {
            // Fewer decimals than needed - multiply
            uint256 multiplier = 10 ** (18 - tokenDecimals - priceDecimals);
            value = tokenAmount * safePrice * multiplier;
        }

        // Cap value at uint248 max
        return value > type(uint248).max ? type(uint248).max : uint248(value);
    }

    /**
     * @dev Converts USD value to token amount safely
     * @param tokenDecimals Token decimals
     * @param usdValue USD value
     * @param safePrice Current price
     * @param priceDecimals Price decimals
     * @return Token amount (capped at uint248 max)
     */
    function _safeConvertToToken(
        uint8 tokenDecimals,
        uint248 usdValue,
        uint256 safePrice,
        uint8 priceDecimals
    ) internal pure returns (uint248) {
        // Can't convert if price is zero
        if (safePrice == 0) return 0;

        uint256 tokenAmount;
        
        // Handle different decimal scenarios
        if (tokenDecimals + priceDecimals >= 18) {
            // More decimals than needed - multiply
            uint256 multiplier = 10 ** (tokenDecimals + priceDecimals - 18);
            tokenAmount = (usdValue * multiplier) / safePrice;
        } else {
            // Fewer decimals than needed - divide
            uint256 denominator = safePrice *
                10 ** (18 - tokenDecimals - priceDecimals);
            tokenAmount = usdValue / denominator;
        }

        // Cap amount at uint248 max
        return
            tokenAmount > type(uint248).max
                ? type(uint248).max
                : uint248(tokenAmount);
    }
}
