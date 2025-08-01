use alloy::{
    providers::ProviderBuilder,
    transports::icp::IcpConfig,
};
use candid::{CandidType, Deserialize};
use ic_cdk::{update};

use crate::utils::helper::{get_rpc_service, validate_eth_address, AssetPriceRegistry};
use crate::ASSET_REGISTRY_CONTRACT;

// Structs
#[derive(CandidType, Deserialize, Clone)]
pub struct AssetInfo {
    pub address: String,
    pub symbol: String,
}

#[update]
async fn get_all_assets(owner_address: String) -> Result<Vec<AssetInfo>, String> {

    let owner_addr = validate_eth_address(&owner_address)?;

    let provider = ProviderBuilder::new().on_icp(IcpConfig::new(get_rpc_service()).set_max_response_size(30_000));

    let contract = AssetPriceRegistry::new(ASSET_REGISTRY_CONTRACT, provider);

    
    let result = contract.getAllAssets(owner_addr).call().await.map_err(|e| format!("Contract call failed: {}", e))?;
    
    let mut assets = Vec::new();
    for i in 0..result._0.len() {
        assets.push(AssetInfo {
            address: format!("{:?}", result._0[i]),
            symbol: result._1[i].clone(),
        });
    }
    Ok(assets)
}
