use alloy::{
    providers::ProviderBuilder,
    transports::icp::IcpConfig,
};
use candid::{CandidType, Deserialize};
use ic_cdk::update;
use crate::ASSET_REGISTRY_CONTRACT;

use crate::utils::helper::{validate_eth_address, get_rpc_service, parse_usd_value, format_with_decimals, AssetPriceRegistry};

#[derive(CandidType, Deserialize, Clone)]
pub struct TokenAmountResult {
    pub amount: String,
    pub raw_amount: String,
}



#[update]
async fn get_token_amount(
    owner_address: String,
    asset_address: String,
    usd_value: String,
    decimals: u8,
) -> Result<TokenAmountResult, String> {

    let owner_addr = validate_eth_address(&owner_address)?;
    let asset_addr = validate_eth_address(&asset_address)?;
    
    let provider = ProviderBuilder::new().on_icp(IcpConfig::new(get_rpc_service()).set_max_response_size(30_000));

    let contract = AssetPriceRegistry::new(ASSET_REGISTRY_CONTRACT, provider);
    
    let usd_val = parse_usd_value(&usd_value)?;
    
    let result = contract.getTokenAmount(owner_addr, asset_addr, usd_val)
        .call()
        .await
        .map_err(|e| format!("Contract call failed: {}", e))?;
    
    let amount_value = result._0;
    
    Ok(TokenAmountResult {
        amount: format_with_decimals(amount_value, decimals), 
        raw_amount: amount_value.to_string(),
    })
}