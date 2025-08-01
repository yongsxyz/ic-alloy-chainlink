use alloy::{
    providers::ProviderBuilder,
    transports::icp::IcpConfig,
};
use ic_cdk::update;
use candid::{CandidType, Deserialize};
use crate::utils::helper::{AssetPriceRegistry, validate_eth_address, get_rpc_service};
use crate::ASSET_REGISTRY_CONTRACT;

#[derive(CandidType, Deserialize, Clone)]
pub struct PriceInfo {
    pub raw_price: String,
    pub decimals: u8,
    pub formatted_price: String, 
}

#[update]
async fn safe_get_price(owner_address: String, asset_address: String) -> Result<PriceInfo, String> {
    
    let owner_addr = validate_eth_address(&owner_address)?;
    let asset_addr = validate_eth_address(&asset_address)?;

    // Set up provider 
    let provider = ProviderBuilder::new().on_icp(IcpConfig::new(get_rpc_service()));
    let contract = AssetPriceRegistry::new(
        ASSET_REGISTRY_CONTRACT, 
        provider
    );

    // Call contract
    let result = contract._safeGetPrice(owner_addr, asset_addr)
        .call()
        .await
        .map_err(|e| format!("Contract call failed: {}", e))?;
    
    let raw_price = result._0;  
    let decimals = result._1;  
    
    let formatted_price = {
        let raw_str = raw_price.to_string();
        if decimals == 0 {
            raw_str
        } else {
            let len = raw_str.len();
            if len > decimals as usize {
                let split_pos = len - decimals as usize;
                format!("{}.{}", &raw_str[..split_pos], &raw_str[split_pos..])
            } else {
                format!("0.{}", "0".repeat(decimals as usize - len) + &raw_str)
            }
        }
    };
    
    Ok(PriceInfo {
        raw_price: raw_price.to_string(),
        decimals,
        formatted_price,
    })
}