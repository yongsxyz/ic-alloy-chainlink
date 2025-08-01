use crate::utils::helper::{
    format_price, format_token_amount, format_usd_amount, validate_eth_address, get_rpc_service,
    parse_token_amount, AssetPriceRegistry,
};
use crate::ASSET_REGISTRY_CONTRACT;
use alloy::{
    primitives::{address, Uint, I256, U256},
    providers::ProviderBuilder,
    transports::icp::IcpConfig,
};
use candid::{CandidType, Deserialize};
use ic_cdk::update;

// Result structures
#[derive(CandidType, Deserialize)]
pub struct RawConversionData {
    pub amount: String,
    pub price: String,
}

#[derive(CandidType, Deserialize)]
pub struct ConversionResult {
    pub symbol: String,
    pub input: String,
    pub output: String,
    pub price: String,
    pub price_decimals: u8,
    pub token_decimals: u8,
    pub last_updated_time: u64,
    pub raw: RawConversionData,
}

// Conversion functions
#[update]
async fn convert_usd_to_tokens(
    owner_address: String,
    usd_amounts: Vec<String>,
) -> Result<Vec<ConversionResult>, String> {

    let owner_addr = validate_eth_address(&owner_address)?;

    if usd_amounts.len() > 10 {
        return Err("Maximum 10 conversions per call".to_string());
    }

    let parsed_inputs: Result<Vec<(String, f64)>, String> = usd_amounts
        .iter()
        .map(|input| {
            let amount_str = input.trim();
            let parsed_amount = amount_str
                .parse::<f64>()
                .map_err(|_| "Invalid USD amount format".to_string())?;
            Ok((input.clone(), parsed_amount))
        })
        .collect();
    let parsed_inputs = parsed_inputs?;

    let icp_config = IcpConfig::new(get_rpc_service()).set_max_response_size(30_000);
    let provider = ProviderBuilder::new().on_icp(icp_config);
    let contract = AssetPriceRegistry::new(ASSET_REGISTRY_CONTRACT, provider);

    let usd_amounts_raw: Result<Vec<Uint<248, 4>>, String> = parsed_inputs
        .iter()
        .map(|(_, amount)| {
            let raw_value = (amount * 1e18) as u128;
            Ok(Uint::<248, 4>::from(raw_value))
        })
        .collect();
    let usd_amounts_raw = usd_amounts_raw?;

    let result = contract
        .getAllConvertUsdToToken(owner_addr, usd_amounts_raw)
        .call()
        .await
        .map_err(|e| format!("Contract call failed: {}", e))?;

    let mut formatted_results = Vec::new();
    for i in 0..result._0.addresses.len() {
        let token_amount = U256::from(result._0.amounts[i]);
        let price = I256::from(result._0.prices[i]);
        let token_decimals = result._0.tokenDecimals[i];

        formatted_results.push(ConversionResult {
            symbol: result._0.symbols[i].clone(),
            input: parsed_inputs[i].0.clone(),
            output: format_token_amount(token_amount, token_decimals),
            price: format_price(price, result._0.priceDecimals[i]),
            price_decimals: result._0.priceDecimals[i],
            token_decimals,
            last_updated_time: result._0.lastUpdatedTimes[i].to::<u64>(),
            raw: RawConversionData {
                amount: token_amount.to_string(),
                price: price.to_string(),
            },
        });
    }
    Ok(formatted_results)
}

#[update]
async fn convert_tokens_to_usd(
    owner_address: String,
    token_amounts: Vec<String>,
) -> Result<Vec<ConversionResult>, String> {

    let owner_addr = validate_eth_address(&owner_address)?;

    if token_amounts.len() > 10 {
        return Err("Maximum 10 conversions per call".to_string());
    }

    let icp_config = IcpConfig::new(get_rpc_service()).set_max_response_size(30_000);
    let provider = ProviderBuilder::new().on_icp(icp_config);
    let contract = AssetPriceRegistry::new(ASSET_REGISTRY_CONTRACT, provider);

    let dummy_amounts: Vec<Uint<248, 4>> = token_amounts
        .iter()
        .map(|_| Uint::<248, 4>::from(1))
        .collect();

    let decimals_result = contract
        .getAllPriceToConvertToUsd(owner_addr.clone(), dummy_amounts)
        .call()
        .await
        .map_err(|e| format!("Contract call failed: {}", e))?;

    let mut actual_amounts = Vec::new();
    for i in 0..token_amounts.len() {
        let token_decimals = decimals_result._0.tokenDecimals[i];
        let amount = parse_token_amount(&token_amounts[i], token_decimals)?;
        actual_amounts.push(amount);
    }

    let result = contract
        .getAllPriceToConvertToUsd(owner_addr, actual_amounts)
        .call()
        .await
        .map_err(|e| format!("Contract call failed: {}", e))?;

    let mut formatted_results = Vec::new();
    for i in 0..result._0.addresses.len() {
        let usd_value = U256::from(result._0.amounts[i]);
        let price = I256::from(result._0.prices[i]);
        let token_decimals = result._0.tokenDecimals[i];

        formatted_results.push(ConversionResult {
            symbol: result._0.symbols[i].clone(),
            input: token_amounts[i].clone(),
            output: format_usd_amount(usd_value),
            price: format_price(price, result._0.priceDecimals[i]),
            price_decimals: result._0.priceDecimals[i],
            token_decimals,
            last_updated_time: result._0.lastUpdatedTimes[i].to::<u64>(),
            raw: RawConversionData {
                amount: usd_value.to_string(),
                price: price.to_string(),
            },
        });
    }
    Ok(formatted_results)
}
