use crate::utils::helper::{
    auth_guard, create_derivation_path, get_ecdsa_key_name, get_rpc_service, AssetPriceRegistry,
};
use alloy::{
    network::{EthereumWallet, TransactionBuilder},
    primitives::Address,
    providers::{Provider, ProviderBuilder},
    signers::{icp::IcpSigner, Signer},
    transports::icp::IcpConfig,
};
use candid::CandidType;
use ic_cdk::{api::caller, update};
use serde::{Deserialize, Serialize};
use std::{cell::RefCell, collections::HashMap, str::FromStr};

use crate::ASSET_REGISTRY_CONTRACT;

thread_local! {
    static ADDRESS_NONCES: RefCell<HashMap<Address, u64>> = RefCell::new(HashMap::new());
}

#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub struct AddAssetArgs {
    pub asset_address: String,
    pub price_feed: String,
    pub token_decimals: u8,
    pub stale_price_threshold: u64,
    pub symbol: String,
}

#[update]
async fn add_asset(args: AddAssetArgs) -> Result<String, String> {
    // Auth
    auth_guard()?;

    // Setup signer 
    let caller_principal = caller();
    let ecdsa_key_name = get_ecdsa_key_name();
    let derivation_path = create_derivation_path(&caller_principal);
    let signer = IcpSigner::new(derivation_path, &ecdsa_key_name, None)
        .await
        .map_err(|e| format!("Failed to create signer: {}", e))?;

    let from_address: Address = signer.address();

    // Setup provider
    let wallet = EthereumWallet::from(signer);
    let rpc_service = get_rpc_service();
    let config = IcpConfig::new(rpc_service);
    let provider = ProviderBuilder::new()
        .with_gas_estimation()
        .wallet(wallet)
        .on_icp(config);

    // Parse 
    let asset_address = Address::from_str(&args.asset_address)
        .map_err(|e| format!("Invalid asset address: {}", e))?;
    let price_feed = Address::from_str(&args.price_feed)
        .map_err(|e| format!("Invalid price feed address: {}", e))?;

    // Validate
    if args.symbol.is_empty() {
        return Err("Symbol cannot be empty".to_string());
    }
    if args.stale_price_threshold == 0 {
        return Err("Stale price threshold must be greater than 0".to_string());
    }

    // Get nonce 
    let maybe_nonce =
        ADDRESS_NONCES.with_borrow(|nonces| nonces.get(&from_address).map(|nonce| nonce + 1));

    let nonce = if let Some(nonce) = maybe_nonce {
        nonce
    } else {
        provider
            .get_transaction_count(from_address)
            .await
            .unwrap_or(0)
    };

    // Contract Call
    let contract = AssetPriceRegistry::new(ASSET_REGISTRY_CONTRACT, &provider);

    // Transaction call
    let call_builder = contract.addAsset(
        asset_address,
        price_feed,
        args.token_decimals,
        args.stale_price_threshold,
        args.symbol,
    );

    // Get the transaction request 
    let mut tx_request = call_builder.into_transaction_request();

    tx_request = tx_request
        .with_nonce(nonce)
        .with_gas_limit(500_000)
        .with_chain_id(11155111); // Sepolia testnet, adjust as needed

    // Estimate gas fees
    let gas_price = provider
        .get_gas_price()
        .await
        .map_err(|e| format!("Failed to get gas price: {}", e))?;

    // For EIP-1559 transactions, set max_fee_per_gas and max_priority_fee_per_gas
    tx_request = tx_request
        .with_max_fee_per_gas(gas_price * 2) // 2x current gas price as max fee
        .with_max_priority_fee_per_gas(gas_price / 10); // 10% of gas price as priority fee

    // Send the transaction
    match provider.send_transaction(tx_request).await {
        Ok(pending_tx_builder) => {
            let tx_hash = *pending_tx_builder.tx_hash();
            let tx_response = provider.get_transaction_by_hash(tx_hash).await.unwrap();

            match tx_response {
                Some(tx) => {
                    ADDRESS_NONCES.with_borrow_mut(|nonces| {
                        nonces.insert(from_address, tx.nonce);
                    });
                    Ok(format!("Transaction hash: {:?}", tx_hash))
                }
                None => Err("Could not get transaction.".to_string()),
            }
        }
        Err(e) => Err(format!("Failed to add asset: {}", e)),
    }
}
