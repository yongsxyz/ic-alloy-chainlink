use alloy::{
    providers::ProviderBuilder,
    transports::icp::IcpConfig,
};
use candid::{CandidType, Deserialize};
use ic_cdk::{update};

use crate::utils::helper::{get_rpc_service, validate_eth_address, AssetPriceRegistry};
use crate::ASSET_REGISTRY_CONTRACT;


#[derive(CandidType, Deserialize, Clone)]
pub struct PriceFeedDetails {
    pub round_id: String, 
    pub answer: i128,
    pub started_at: u64,
    pub updated_at: u64,
    pub answered_in_round: String,  
}

#[update]
async fn get_price_feed_details(owner_address: String, asset_address: String) -> Result<PriceFeedDetails, String> {

    let owner_addr = validate_eth_address(&owner_address)?;
    let asset_addr = validate_eth_address(&asset_address)?;

    let provider = ProviderBuilder::new().on_icp(IcpConfig::new(get_rpc_service()).set_max_response_size(30_000));

    let contract = AssetPriceRegistry::new(ASSET_REGISTRY_CONTRACT, provider);

    let result = contract.getPriceFeedDetails(owner_addr, asset_addr)
        .call()
        .await
        .map_err(|e| format!("Contract call failed: {}", e))?;
    
    // Convert U256 to u64, handling potential overflow
    let started_at = result.startedAt.try_into()
        .map_err(|_| "startedAt value too large for u64")?;
    let updated_at = result.updatedAt.try_into()
        .map_err(|_| "updatedAt value too large for u64")?;
    
    // Convert Uint<80, 2> (uint80) to String to handle large values
    let round_id = result.roundId.to_string();
    let answered_in_round = result.answeredInRound.to_string();
    
    // Convert I256 to i128 - using into() with bounds checking
    let answer: i128 = result.answer.try_into()
        .map_err(|_| "answer value out of range for i128")?;
    
    Ok(PriceFeedDetails {
        round_id,
        answer,
        started_at,
        updated_at,
        answered_in_round,
    })
}