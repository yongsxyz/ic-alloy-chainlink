use std::str::FromStr;
use alloy::{
    primitives::{I256, U256, Uint, Address, utils::format_units},
    sol,
    transports::icp::{RpcApi, RpcService},
};
use candid::Principal;
use serde_bytes::ByteBuf;

sol! {
    #[sol(rpc)]
    interface AssetPriceRegistry {
        struct AssetConversionData {
            address[] addresses;
            string[] symbols;
            uint248[] amounts;
            int256[] prices;
            uint8[] priceDecimals;
            uint8[] tokenDecimals;
            uint256[] lastUpdatedTimes;
        }
        struct Asset {
            address priceFeed;
            uint8 tokenDecimals;
            uint64 stalePriceThresholdInSeconds;
        }

        function getAllPriceToConvertToUsd(address ownerAddress, uint248[] memory tokenAmounts) external view returns (AssetConversionData memory);
        function getAllConvertUsdToToken(address ownerAddress, uint248[] memory usdValues) external view returns (AssetConversionData memory);
        function getAllAssetsWithPrices(address ownerAddress) external view returns (
            address[] memory addresses,
            string[] memory symbols,
            int256[] memory prices,
            uint8[] memory decimals,
            uint256[] memory lastUpdatedTimes
        );

        function getAllAssets(address ownerAddress) external view returns (address[] memory, string[] memory);
        
        function getAssetBySymbol(
            address ownerAddress,
            string memory symbol
        ) external view returns (
            address assetAddress,
            string memory originalSymbol,
            Asset memory asset
        );

        function getPriceFeedDetails(
            address ownerAddress,
            address assetAddress
        ) external view returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );

        function getTokenAmount(
            address ownerAddress,
            address assetAddress,
            uint248 usdValue
        ) external view returns (uint248);

        function getTokenPriceBySymbol(
            address ownerAddress,
            string memory symbol
        ) external view returns (
            int256 price,
            uint8 decimals
        );

        function getTokenPrice(
            address ownerAddress,
            address assetAddress
        ) external view returns (
            int256 price,
            uint8 decimals
        );
        function getUsdValue(
            address ownerAddress,
            address assetAddress,
            uint248 tokenAmount
        ) external view returns (uint248);

        function _safeGetPrice(address ownerAddress, address assetAddress) external view returns (uint256, uint8);

        function addAsset(
            address assetAddress,
            address priceFeed,
            uint8 tokenDecimals,
            uint64 stalePriceThresholdInSeconds,
            string memory symbol
        ) external;

        function removeAsset(
            address assetAddress
        ) external;
    }
}

// Modify this function to determine which EVM network canister connects to
pub fn get_rpc_service() -> RpcService {
    // RpcService::EthSepolia(EthSepoliaService::Alchemy)
    // RpcService::EthMainnet(EthMainnetService::Alchemy)
    // RpcService::BaseMainnet(L2MainnetService::Alchemy)
    // RpcService::OptimismMainnet(L2MainnetService::Alchemy)
    // RpcService::ArbitrumOne(L2MainnetService::Alchemy)
    RpcService::Custom(RpcApi {
        url: "https://ic-alloy-evm-rpc-proxy.kristofer-977.workers.dev/eth-sepolia".to_string(),
        headers: None,
    })
}


pub fn auth_guard() -> Result<(), String> {
    match ic_cdk::caller() {
        caller if caller == Principal::anonymous() => {
            Err("Calls with the anonymous principal are not allowed.".to_string())
        }
        _ => Ok(()),
    }
}


pub fn create_derivation_path(principal: &Principal) -> Vec<Vec<u8>> {
    const SCHEMA_V1: u8 = 1;
    [
        ByteBuf::from(vec![SCHEMA_V1]),
        ByteBuf::from(principal.as_slice().to_vec()),
    ]
    .iter()
    .map(|x| x.to_vec())
    .collect()
}


pub fn get_ecdsa_key_name() -> String {
    let network = option_env!("DFX_NETWORK").unwrap_or("ic");
    
    match network {
        "local" => "dfx_test_key".to_string(),
        "ic" | "playground" => "key_1".to_string(),
        _ => "key_1".to_string() // Fallback Playground 
    }
}


// pub fn get_ecdsa_key_name() -> String {
//     #[allow(clippy::option_env_unwrap)]
//     let dfx_network = option_env!("DFX_NETWORK").unwrap();
//     match dfx_network {
//         "local" => "dfx_test_key".to_string(),
//         "ic" => "key_1".to_string(),
//         _ => panic!("Unsupported network."),
//     }
// }


// Fungsi untuk validasi dan normalisasi address
pub fn validate_and_normalize_address(address_str: &str) -> Result<Address, String> {
    // Remove whitespace
    let trimmed = address_str.trim();
    
    // Check if empty
    if trimmed.is_empty() {
        return Err("Address cannot be empty".to_string());
    }
    
    // Check basic format
    if !trimmed.starts_with("0x") {
        return Err("Address must start with '0x'".to_string());
    }
    
    // Check length (0x + 40 hex characters = 42 total)
    if trimmed.len() != 42 {
        return Err(format!("Address must be 42 characters long, got {}", trimmed.len()));
    }
    
    // Check if all characters after 0x are hex
    let hex_part = &trimmed[2..];
    if !hex_part.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err("Address contains invalid hex characters".to_string());
    }
    
    // Try to parse with alloy (this will validate checksum)
    match Address::from_str(trimmed) {
        Ok(addr) => Ok(addr),
        Err(e) => {
            if e.to_string().contains("checksum") {
                let lowercase_addr = format!("0x{}", hex_part.to_lowercase());
                match Address::from_str(&lowercase_addr) {
                    Ok(addr) => {
                        println!("Warning: Address checksum invalid, using normalized address: {}", addr);
                        Ok(addr)
                    }
                    Err(_) => Err(format!("Invalid address format: {}", e))
                }
            } else {
                Err(format!("Invalid address: {}", e))
            }
        }
    }
}

pub fn get_correct_address(address_str: &str) -> Result<String, String> {
    let normalized = validate_and_normalize_address(address_str)?;
    Ok(format!("{:?}", normalized))
}

pub fn validate_eth_address(address: &str) -> Result<Address, String> {
    match Address::from_str(address) {
        Ok(addr) => Ok(addr),
        Err(e) => {
            let error_str = e.to_string();
            if error_str.contains("checksum") {
                match get_correct_address(address) {
                    Ok(correct) => Err(format!("Invalid checksum. Use: {}", correct)),
                    Err(_) => Err(format!("Invalid address: {}", error_str)),
                }
            } else {
                Err(format!("Invalid Ethereum address: {}", error_str))
            }
        }
    }
}


pub fn format_token_amount(value: U256, decimals: u8) -> String {
    let value_str = value.to_string();
    let len = value_str.len();
    
    if decimals == 0 {
        return value_str;
    }

    if len <= decimals as usize {
        let zeros_needed = decimals as usize - len;
        format!("0.{}{}", "0".repeat(zeros_needed), value_str)
    } else {
        let split_pos = len - decimals as usize;
        let integer_part = &value_str[..split_pos];
        let fractional_part = &value_str[split_pos..];
        
        let trimmed_fractional = fractional_part.trim_end_matches('0');
        if trimmed_fractional.is_empty() {
            integer_part.to_string()
        } else {
            format!("{}.{}", integer_part, trimmed_fractional)
        }
    }
}

pub fn format_usd_amount(value: U256) -> String {
    let value_str = value.to_string();
    let len = value_str.len();
    
    if len <= 18 {
        let zeros_needed = 18 - len;
        let padded_value = if zeros_needed > 0 {
            format!("{}{}", "0".repeat(zeros_needed), value_str)
        } else {
            value_str
        };
        
        let integer_part = "0";
        let decimal_part = &padded_value;
        let trimmed_decimal = decimal_part.trim_end_matches('0');
        
        if trimmed_decimal.is_empty() {
            integer_part.to_string()
        } else {
            format!("{}.{}", integer_part, trimmed_decimal)
        }
    } else {
        let split_pos = len - 18;
        let integer_part = &value_str[..split_pos];
        let decimal_part = &value_str[split_pos..];
        let trimmed_decimal = decimal_part.trim_end_matches('0');
        
        if trimmed_decimal.is_empty() {
            integer_part.to_string()
        } else {
            format!("{}.{}", integer_part, trimmed_decimal)
        }
    }
}

pub fn format_price(raw_price: I256, decimals: u8) -> String {
    if decimals == 0 {
        return raw_price.to_string();
    }

    let is_negative = raw_price.is_negative();
    let abs_price = if is_negative {
        raw_price.checked_neg().unwrap_or(I256::ZERO)
    } else {
        raw_price
    };

    let price_str = abs_price.to_string();
    let len = price_str.len();
    let decimal_pos = len.saturating_sub(decimals as usize);

    if decimal_pos == 0 {
        let zeros_needed = decimals as usize - len;
        let integer_part = "0".to_string();
        let decimal_part = "0".repeat(zeros_needed) + &price_str;
        let formatted = format!("{}{}.{}", if is_negative { "-" } else { "" }, integer_part, decimal_part);
        let trimmed = formatted.trim_end_matches('0').trim_end_matches('.');
        if trimmed.is_empty() || trimmed == "-" { "0".to_string() } else { trimmed.to_string() }
    } else {
        let integer_part = &price_str[..decimal_pos];
        let decimal_part = &price_str[decimal_pos..];
        let formatted = format!("{}{}.{}", if is_negative { "-" } else { "" }, integer_part, decimal_part);
        let trimmed = formatted.trim_end_matches('0').trim_end_matches('.');
        if trimmed.is_empty() || trimmed == "-" { "0".to_string() } else { trimmed.to_string() }
    }
}

pub fn parse_token_amount(amount: &str, decimals: u8) -> Result<Uint<248, 4>, String> {
    let parts: Vec<&str> = amount.split('.').collect();
    match parts.len() {
        1 => {
            let integer = Uint::<248, 4>::from_str(parts[0])
                .map_err(|e| format!("Invalid amount: {}", e))?;
            integer.checked_mul(Uint::<248, 4>::from(10).pow(Uint::from(decimals)))
                .ok_or("Overflow in multiplication".to_string())
        },
        2 => {
            let integer = Uint::<248, 4>::from_str(parts[0])
                .map_err(|e| format!("Invalid integer part: {}", e))?
                .checked_mul(Uint::<248, 4>::from(10).pow(Uint::from(decimals)))
                .ok_or("Overflow in multiplication".to_string())?;
            
            let fractional_str = if parts[1].len() > decimals as usize {
                &parts[1][..decimals as usize]
            } else {
                parts[1]
            };
            
            let fractional = Uint::<248, 4>::from_str(fractional_str)
                .map_err(|e| format!("Invalid fractional part: {}", e))?
                .checked_mul(Uint::<248, 4>::from(10).pow(Uint::from(decimals - fractional_str.len() as u8)))
                .ok_or("Overflow in fractional part".to_string())?;
            
            integer.checked_add(fractional)
                .ok_or("Overflow in addition".to_string())
        },
        _ => Err("Invalid amount format".to_string()),
    }
}


pub fn format_token_price(price: I256, decimals: u8) -> (String, String) {
    let (price_abs, is_negative) = if price < I256::ZERO {
        (U256::from((-price).into_raw()), true)
    } else {
        (U256::from(price.into_raw()), false)
    };
    
    let formatted_price = format_units(price_abs, decimals)
        .unwrap_or_else(|_| price_abs.to_string());
    let signed_price = if is_negative {
        format!("-{}", formatted_price)
    } else {
        formatted_price
    };

    (signed_price, price.to_string())
}


/// Format amount with decimals, trimming trailing zeros
pub fn format_with_decimals(value: Uint<248, 4>, decimals: u8) -> String {
    let value_str = value.to_string();
    let len = value_str.len();
    
    if decimals == 0 {
        return value_str;
    }

    if len <= decimals as usize {
        let zeros_needed = decimals as usize - len;
        format!("0.{}{}", "0".repeat(zeros_needed), value_str)
    } else {
        let split_pos = len - decimals as usize;
        let integer_part = &value_str[..split_pos];
        let fractional_part = &value_str[split_pos..];
        
        let trimmed_fractional = fractional_part.trim_end_matches('0');
        if trimmed_fractional.is_empty() {
            integer_part.to_string()
        } else {
            format!("{}.{}", integer_part, trimmed_fractional)
        }
    }
}

/// Parse USD value string into raw amount with 18 decimals
pub fn parse_usd_value(usd_value: &str) -> Result<Uint<248, 4>, String> {
    let parts: Vec<&str> = usd_value.split('.').collect();
    match parts.len() {
        1 => {
            Uint::<248, 4>::from_str(parts[0])
                .map_err(|e| format!("Invalid USD value: {}", e))?
                .checked_mul(Uint::<248, 4>::from(10).pow(Uint::from(18)))
                .ok_or("Overflow in multiplication".to_string())
        },
        2 => {
            let integer_part = Uint::<248, 4>::from_str(parts[0])
                .map_err(|e| format!("Invalid integer part: {}", e))?
                .checked_mul(Uint::<248, 4>::from(10).pow(Uint::from(18)))
                .ok_or("Overflow in multiplication".to_string())?;
            
            let fractional_part = if parts[1].len() > 18 {
                Uint::<248, 4>::from_str(&parts[1][..18])
                    .map_err(|e| format!("Invalid fractional part: {}", e))?
            } else {
                let padded = format!("{:0<18}", parts[1]);
                Uint::<248, 4>::from_str(&padded)
                    .map_err(|e| format!("Invalid fractional part: {}", e))?
            };
            
            integer_part.checked_add(fractional_part)
                .ok_or("Overflow in addition".to_string())
        },
        _ => Err("Invalid USD value format".to_string()),
    }
}


pub fn format_price_raw(raw_price: i128, decimals: u8) -> String {
    if decimals == 0 {
        return raw_price.to_string();
    }

    let is_negative = raw_price < 0;
    let abs_price = if is_negative {
        -raw_price
    } else {
        raw_price
    };

    let price_str = abs_price.to_string();
    let len = price_str.len();
    let decimal_pos = len.saturating_sub(decimals as usize);

    if decimal_pos == 0 {
        let zeros_needed = decimals as usize - len;
        let integer_part = "0".to_string();
        let decimal_part = "0".repeat(zeros_needed) + &price_str;
        format!("{}{}.{}", if is_negative { "-" } else { "" }, integer_part, decimal_part)
    } else {
        let integer_part = &price_str[..decimal_pos];
        let decimal_part = &price_str[decimal_pos..];
        format!("{}{}.{}", if is_negative { "-" } else { "" }, integer_part, decimal_part)
    }
}
