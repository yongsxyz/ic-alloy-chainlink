use alloy::{
    providers::ProviderBuilder,
    transports::icp::IcpConfig,
};
use candid::{CandidType, Deserialize};
use ic_cdk::{update};

use crate::utils::helper::{get_rpc_service, validate_eth_address, format_price_raw, AssetPriceRegistry};
use crate::ASSET_REGISTRY_CONTRACT;

#[derive(CandidType, Deserialize, Clone)]
pub struct TokenPriceResult {
    pub price: String,
    pub decimals: u8,
    pub raw_price: i128,
}

#[update]
async fn get_token_price(owner_address: String, asset_address: String) -> Result<TokenPriceResult, String> {

    let owner_addr = validate_eth_address(&owner_address)?;
    let asset_addr = validate_eth_address(&asset_address)?;

    let provider = ProviderBuilder::new().on_icp(IcpConfig::new(get_rpc_service()).set_max_response_size(30_000));

    let contract = AssetPriceRegistry::new(ASSET_REGISTRY_CONTRACT, provider);
    
    let result = contract.getTokenPrice(owner_addr, asset_addr)
        .call()
        .await
        .map_err(|e| format!("Contract call failed: {}", e))?;
    
    // Convert i256 to i128 with bounds checking
    let raw_price: i128 = result.price.try_into()
        .map_err(|_| "price value out of range for i128")?;
    
    let formatted_price = format_price_raw(raw_price, result.decimals);
    
    Ok(TokenPriceResult {
        price: formatted_price,
        decimals: result.decimals,
        raw_price,
    })
}