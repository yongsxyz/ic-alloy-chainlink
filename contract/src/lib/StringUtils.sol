// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title String Utilities Library
 * @dev Helper functions for string manipulation
 */
library StringUtils {
    /**
     * @dev Converts a string to lowercase
     * @param _str Input string
     * @return Lowercase version of input
     */
    function _toLower(
        string memory _str
    ) internal pure returns (string memory) {
        bytes memory bStr = bytes(_str);
        bytes memory bLower = new bytes(bStr.length);
        for (uint i = 0; i < bStr.length; i++) {
            // Check if uppercase letter (A-Z)
            if (uint8(bStr[i]) >= 65 && uint8(bStr[i]) <= 90) {
                // Convert to lowercase by adding 32
                bLower[i] = bytes1(uint8(bStr[i]) + 32);
            } else {
                bLower[i] = bStr[i];
            }
        }
        return string(bLower);
    }
}