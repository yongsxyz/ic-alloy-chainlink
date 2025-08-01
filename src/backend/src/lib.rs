mod service;
mod utils;

use service::get_all_assets::{AssetInfo};
use service::get_all_assets_with_prices::{AssetWithPrice};
use service::convert_tokens::{ConversionResult};
use service::safe_get_price::{PriceInfo};
use service::get_asset_by_symbol::{AssetInfoSymbol};
use service::get_price_feed_details::{PriceFeedDetails};
use service::get_token_price::{TokenPriceResult};
use service::get_token_amount::{TokenAmountResult};
use service::get_token_price_by_symbol::{TokenPriceResultSymbol};
use service::get_usd_value::{UsdValueResult};
use service::add_remove_asset::add_asset::{AddAssetArgs};
use service::add_remove_asset::remove_asset::{RemoveAssetArgs};

use candid::{ Principal};
use ic_cdk::export_candid;
use alloy::primitives::{address, Address};

pub const ASSET_REGISTRY_CONTRACT: Address = address!("e1006413d1ae924056a602D5266e86dd2570Ad68");



export_candid!();