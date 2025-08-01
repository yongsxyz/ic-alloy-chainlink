use alloy::{
    primitives::{U256 },
    providers::ProviderBuilder,
    transports::icp::IcpConfig,
};
use candid::{CandidType, Deserialize};
use ic_cdk::update;
use crate::utils::helper::{get_rpc_service, validate_eth_address, format_usd_amount, parse_token_amount, AssetPriceRegistry};
use crate::ASSET_REGISTRY_CONTRACT;

#[derive(CandidType, Deserialize)]
pub struct UsdValueResult {
    pub usd_value: String,
    pub raw_result: String,
    pub asset_address: String,
    pub token_amount: String,
}

#[update]
async fn get_usd_value(
    owner_address: String,
    asset_address: String,
    token_amount: String,
    decimals: u8, 
) -> Result<UsdValueResult, String> {

    let owner_addr = validate_eth_address(&owner_address)?;
    let asset_addr = validate_eth_address(&asset_address)?;

    // Parse token amount with custom decimals
    let parsed_amount = parse_token_amount(&token_amount, decimals)?;

    // Setup provider and contract
    let icp_config = IcpConfig::new(get_rpc_service()).set_max_response_size(30_000);
    let provider = ProviderBuilder::new().on_icp(icp_config);
    let contract = AssetPriceRegistry::new(ASSET_REGISTRY_CONTRACT, provider);

    // Call the contract function
    let usd_value = contract.getUsdValue(owner_addr, asset_addr, parsed_amount)
        .call()
        .await
        .map_err(|e| format!("Contract call failed: {}", e))?
        ._0; // Access the inner value of the return tuple

    // Convert from Uint<248, 4> to U256
    let usd_value_u256 = U256::from_limbs(usd_value.into_limbs());

    // Format the result
    Ok(UsdValueResult {
        usd_value: format_usd_amount(usd_value_u256),
        raw_result: usd_value_u256.to_string(),
        asset_address,
        token_amount,
    })
}