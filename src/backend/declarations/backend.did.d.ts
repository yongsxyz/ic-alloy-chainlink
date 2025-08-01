import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AddAssetArgs {
  'asset_address' : string,
  'stale_price_threshold' : bigint,
  'token_decimals' : number,
  'symbol' : string,
  'price_feed' : string,
}
export interface AssetInfo { 'address' : string, 'symbol' : string }
export interface AssetInfoSymbol {
  'asset_address' : string,
  'original_symbol' : string,
  'stale_price_threshold' : bigint,
  'token_decimals' : number,
  'price_feed' : string,
}
export interface AssetWithPrice {
  'decimals' : number,
  'last_updated' : string,
  'address' : string,
  'raw_price' : string,
  'price' : string,
  'symbol' : string,
}
export interface ConversionResult {
  'raw' : RawConversionData,
  'output' : string,
  'price_decimals' : number,
  'last_updated_time' : bigint,
  'input' : string,
  'token_decimals' : number,
  'price' : string,
  'symbol' : string,
}
export interface PriceFeedDetails {
  'updated_at' : bigint,
  'answer' : bigint,
  'round_id' : string,
  'answered_in_round' : string,
  'started_at' : bigint,
}
export interface PriceInfo {
  'decimals' : number,
  'raw_price' : string,
  'formatted_price' : string,
}
export interface RawConversionData { 'price' : string, 'amount' : string }
export interface RemoveAssetArgs { 'asset_address' : string }
export type Result = { 'Ok' : string } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : Array<ConversionResult> } |
  { 'Err' : string };
export type Result_2 = { 'Ok' : Array<AssetInfo> } |
  { 'Err' : string };
export type Result_3 = { 'Ok' : Array<AssetWithPrice> } |
  { 'Err' : string };
export type Result_4 = { 'Ok' : AssetInfoSymbol } |
  { 'Err' : string };
export type Result_5 = { 'Ok' : PriceFeedDetails } |
  { 'Err' : string };
export type Result_6 = { 'Ok' : TokenAmountResult } |
  { 'Err' : string };
export type Result_7 = { 'Ok' : TokenPriceResult } |
  { 'Err' : string };
export type Result_8 = { 'Ok' : UsdValueResult } |
  { 'Err' : string };
export type Result_9 = { 'Ok' : PriceInfo } |
  { 'Err' : string };
export interface TokenAmountResult { 'raw_amount' : string, 'amount' : string }
export interface TokenPriceResult {
  'decimals' : number,
  'raw_price' : bigint,
  'price' : string,
}
export interface UsdValueResult {
  'token_amount' : string,
  'asset_address' : string,
  'usd_value' : string,
  'raw_result' : string,
}
export interface _SERVICE {
  'add_asset' : ActorMethod<[AddAssetArgs], Result>,
  'convert_tokens_to_usd' : ActorMethod<[string, Array<string>], Result_1>,
  'convert_usd_to_tokens' : ActorMethod<[string, Array<string>], Result_1>,
  'get_address' : ActorMethod<[[] | [Principal]], Result>,
  'get_all_assets' : ActorMethod<[string], Result_2>,
  'get_all_assets_with_prices' : ActorMethod<[string], Result_3>,
  'get_asset_by_symbol' : ActorMethod<[string, string], Result_4>,
  'get_balance' : ActorMethod<[[] | [Principal]], Result>,
  'get_price_feed_details' : ActorMethod<[string, string], Result_5>,
  'get_token_amount' : ActorMethod<[string, string, string, number], Result_6>,
  'get_token_price' : ActorMethod<[string, string], Result_7>,
  'get_token_price_by_symbol' : ActorMethod<[string, string], Result_7>,
  'get_usd_value' : ActorMethod<[string, string, string, number], Result_8>,
  'remove_asset' : ActorMethod<[RemoveAssetArgs], Result>,
  'safe_get_price' : ActorMethod<[string, string], Result_9>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
