use alloy::{
    providers::ProviderBuilder,
    transports::icp::IcpConfig,
};
use candid::{CandidType, Deserialize};
use ic_cdk::{update};

use crate::utils::helper::{get_rpc_service, validate_eth_address , AssetPriceRegistry};
use crate::ASSET_REGISTRY_CONTRACT;

// Struct asset information
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct AssetInfoSymbol {
    pub asset_address: String,
    pub original_symbol: String,
    pub price_feed: String,
    pub token_decimals: u8,
    pub stale_price_threshold: u64,
}

#[update]
async fn get_asset_by_symbol(owner_address: String, token_symbol: String) -> Result<AssetInfoSymbol, String> {

    let owner_addr = validate_eth_address(&owner_address)?;

    // Set up the provider
    let provider = ProviderBuilder::new().on_icp(IcpConfig::new(get_rpc_service()).set_max_response_size(30_000));
    // Create contract instance
    let contract: AssetPriceRegistry::AssetPriceRegistryInstance<alloy::transports::icp::IcpTransport, alloy::providers::RootProvider<alloy::transports::icp::IcpTransport>> = AssetPriceRegistry::new(
        ASSET_REGISTRY_CONTRACT, 
        provider
    );
    
    // Call the contract function
    let result = contract.getAssetBySymbol(owner_addr, token_symbol.clone())
        .call()
        .await
        .map_err(|e| format!("Contract call failed: {}", e))?;
    
    // Convert the result to our AssetInfoSymbol struct
    Ok(AssetInfoSymbol {
        asset_address: format!("{:?}", result.assetAddress),
        original_symbol: result.originalSymbol,
        price_feed: format!("{:?}", result.asset.priceFeed),
        token_decimals: result.asset.tokenDecimals,
        stale_price_threshold: result.asset.stalePriceThresholdInSeconds,
    })
}