use std::{cell::RefCell, collections::HashMap, str::FromStr};
use alloy::{
    network::{EthereumWallet, TransactionBuilder},
    primitives::{Address},
    providers::{Provider, ProviderBuilder},
    signers::{icp::IcpSigner, Signer},
    transports::icp::IcpConfig,
};
use candid::CandidType;
use ic_cdk::{api::caller, update};
use serde::{Deserialize, Serialize};
use crate::utils::helper::{
    auth_guard,
    create_derivation_path,
    get_ecdsa_key_name,
    get_rpc_service,
    AssetPriceRegistry
};
use crate::ASSET_REGISTRY_CONTRACT;


thread_local! {
    static ADDRESS_NONCES: RefCell<HashMap<Address, u64>> = RefCell::new(HashMap::new());
}

#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub struct RemoveAssetArgs {
    pub asset_address: String,
}

#[update]
pub async fn remove_asset(args: RemoveAssetArgs) -> Result<String, String> {
    // auth
    auth_guard()?;
    
    // Setup signer
    let caller_principal = caller();
    let ecdsa_key_name = get_ecdsa_key_name();
    let derivation_path = create_derivation_path(&caller_principal);
    let signer = IcpSigner::new(derivation_path, &ecdsa_key_name, None)
        .await
        .map_err(|e| format!("Failed to create signer: {}", e))?;
    
    let from_address = signer.address();
    
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
    
    // Validate
    if args.asset_address.is_empty() {
        return Err("Asset address cannot be empty".to_string());
    }
    
    // Get nonce
    let maybe_nonce = ADDRESS_NONCES.with_borrow(|nonces| {
        nonces.get(&from_address).map(|nonce| nonce + 1)
    });
    
    let nonce = if let Some(nonce) = maybe_nonce {
        nonce
    } else {
        provider
            .get_transaction_count(from_address)
            .await
            .map_err(|e| format!("Failed to get nonce: {}", e))?
    };
    
    //call contract
    let contract = AssetPriceRegistry::new(ASSET_REGISTRY_CONTRACT, &provider);
    let call_builder = contract.removeAsset(asset_address);
    
    // Get the transaction request
    let mut tx_request = call_builder.into_transaction_request();
    
    // Set required transaction parameters
    tx_request = tx_request
        .with_nonce(nonce)
        .with_gas_limit(200_000) 
        .with_chain_id(11155111); 
    
    // Estimate gas fees
    let gas_price = provider
        .get_gas_price()
        .await
        .map_err(|e| format!("Failed to get gas price: {}", e))?;
    
    tx_request = tx_request
        .with_max_fee_per_gas(gas_price * 2)
        .with_max_priority_fee_per_gas(gas_price / 10); 
    
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
                    Ok(format!("Asset removed successfully. Transaction hash: {:?}", tx_hash))
                }
                None => Err("Could not get transaction.".to_string()),
            }
        }
        Err(e) => Err(format!("Failed to remove asset: {}", e)),
    }
}