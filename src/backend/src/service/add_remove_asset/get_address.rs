use alloy::signers::{icp::IcpSigner, Signer};
use candid::Principal;

use crate::utils::helper::{auth_guard, create_derivation_path, get_ecdsa_key_name};

#[ic_cdk::update]
async fn get_address(principal: Option<Principal>) -> Result<String, String> {

    auth_guard()?;

    // If no principal is specified in call, attempt to use caller principal
    let principal: Principal = principal.unwrap_or_else(ic_cdk::caller);

    // Setup signer
    let ecdsa_key_name = get_ecdsa_key_name();
    let derivation_path = create_derivation_path(&principal);
    let signer = IcpSigner::new(derivation_path, &ecdsa_key_name, None)
        .await
        .map_err(|e| e.to_string())?;

    let address = signer.address();
    Ok(address.to_string())
}