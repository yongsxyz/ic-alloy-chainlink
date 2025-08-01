
use alloy::{
    providers::ProviderBuilder,
    transports::icp::IcpConfig,
};

use candid::{CandidType, Deserialize};

use crate::utils::helper::{format_token_price, get_rpc_service, validate_eth_address, AssetPriceRegistry};
use crate::ASSET_REGISTRY_CONTRACT;


// Structs
#[derive(CandidType, Deserialize, Clone)]
pub struct AssetWithPrice {
    pub address: String,
    pub symbol: String,
    pub price: String,
    pub raw_price: String, 
    pub decimals: u8,
    pub last_updated: String,
}

#[ic_cdk::update]
async fn get_all_assets_with_prices(owner_wallet: String) -> Result<Vec<AssetWithPrice>, String> {

    let owner_address = validate_eth_address(&owner_wallet)?;

    let provider = ProviderBuilder::new().on_icp(IcpConfig::new(get_rpc_service()).set_max_response_size(30_000));

    let contract = AssetPriceRegistry::new(ASSET_REGISTRY_CONTRACT, provider);
    
    let result = contract
        .getAllAssetsWithPrices(owner_address)
        .call()
        .await
        .map_err(|e| format!("Contract call failed: {}", e))?;

    if result.addresses.is_empty() {
        return Err(format!("No assets found for: {}", owner_wallet));
    }

    // Transform to Vec<AssetWithPrice>
    let assets: Vec<AssetWithPrice> = result.addresses.iter()
        .enumerate()
        .map(|(i, &address)| {
            let (price, raw_price) = format_token_price(result.prices[i], result.decimals[i]);

            AssetWithPrice {
                address: format!("{:?}", address),
                symbol: result.symbols[i].clone(),
                price,
                raw_price,
                decimals: result.decimals[i],
                last_updated: format!("{:?}", result.lastUpdatedTimes[i]),
            }
        })
        .collect();

    Ok(assets)
}