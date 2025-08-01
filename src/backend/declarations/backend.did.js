export const idlFactory = ({ IDL }) => {
  const AddAssetArgs = IDL.Record({
    'asset_address' : IDL.Text,
    'stale_price_threshold' : IDL.Nat64,
    'token_decimals' : IDL.Nat8,
    'symbol' : IDL.Text,
    'price_feed' : IDL.Text,
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  const RawConversionData = IDL.Record({
    'price' : IDL.Text,
    'amount' : IDL.Text,
  });
  const ConversionResult = IDL.Record({
    'raw' : RawConversionData,
    'output' : IDL.Text,
    'price_decimals' : IDL.Nat8,
    'last_updated_time' : IDL.Nat64,
    'input' : IDL.Text,
    'token_decimals' : IDL.Nat8,
    'price' : IDL.Text,
    'symbol' : IDL.Text,
  });
  const Result_1 = IDL.Variant({
    'Ok' : IDL.Vec(ConversionResult),
    'Err' : IDL.Text,
  });
  const AssetInfo = IDL.Record({ 'address' : IDL.Text, 'symbol' : IDL.Text });
  const Result_2 = IDL.Variant({ 'Ok' : IDL.Vec(AssetInfo), 'Err' : IDL.Text });
  const AssetWithPrice = IDL.Record({
    'decimals' : IDL.Nat8,
    'last_updated' : IDL.Text,
    'address' : IDL.Text,
    'raw_price' : IDL.Text,
    'price' : IDL.Text,
    'symbol' : IDL.Text,
  });
  const Result_3 = IDL.Variant({
    'Ok' : IDL.Vec(AssetWithPrice),
    'Err' : IDL.Text,
  });
  const AssetInfoSymbol = IDL.Record({
    'asset_address' : IDL.Text,
    'original_symbol' : IDL.Text,
    'stale_price_threshold' : IDL.Nat64,
    'token_decimals' : IDL.Nat8,
    'price_feed' : IDL.Text,
  });
  const Result_4 = IDL.Variant({ 'Ok' : AssetInfoSymbol, 'Err' : IDL.Text });
  const PriceFeedDetails = IDL.Record({
    'updated_at' : IDL.Nat64,
    'answer' : IDL.Int,
    'round_id' : IDL.Text,
    'answered_in_round' : IDL.Text,
    'started_at' : IDL.Nat64,
  });
  const Result_5 = IDL.Variant({ 'Ok' : PriceFeedDetails, 'Err' : IDL.Text });
  const TokenAmountResult = IDL.Record({
    'raw_amount' : IDL.Text,
    'amount' : IDL.Text,
  });
  const Result_6 = IDL.Variant({ 'Ok' : TokenAmountResult, 'Err' : IDL.Text });
  const TokenPriceResult = IDL.Record({
    'decimals' : IDL.Nat8,
    'raw_price' : IDL.Int,
    'price' : IDL.Text,
  });
  const Result_7 = IDL.Variant({ 'Ok' : TokenPriceResult, 'Err' : IDL.Text });
  const UsdValueResult = IDL.Record({
    'token_amount' : IDL.Text,
    'asset_address' : IDL.Text,
    'usd_value' : IDL.Text,
    'raw_result' : IDL.Text,
  });
  const Result_8 = IDL.Variant({ 'Ok' : UsdValueResult, 'Err' : IDL.Text });
  const RemoveAssetArgs = IDL.Record({ 'asset_address' : IDL.Text });
  const PriceInfo = IDL.Record({
    'decimals' : IDL.Nat8,
    'raw_price' : IDL.Text,
    'formatted_price' : IDL.Text,
  });
  const Result_9 = IDL.Variant({ 'Ok' : PriceInfo, 'Err' : IDL.Text });
  return IDL.Service({
    'add_asset' : IDL.Func([AddAssetArgs], [Result], []),
    'convert_tokens_to_usd' : IDL.Func(
        [IDL.Text, IDL.Vec(IDL.Text)],
        [Result_1],
        [],
      ),
    'convert_usd_to_tokens' : IDL.Func(
        [IDL.Text, IDL.Vec(IDL.Text)],
        [Result_1],
        [],
      ),
    'get_address' : IDL.Func([IDL.Opt(IDL.Principal)], [Result], []),
    'get_all_assets' : IDL.Func([IDL.Text], [Result_2], []),
    'get_all_assets_with_prices' : IDL.Func([IDL.Text], [Result_3], []),
    'get_asset_by_symbol' : IDL.Func([IDL.Text, IDL.Text], [Result_4], []),
    'get_balance' : IDL.Func([IDL.Opt(IDL.Principal)], [Result], []),
    'get_price_feed_details' : IDL.Func([IDL.Text, IDL.Text], [Result_5], []),
    'get_token_amount' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Nat8],
        [Result_6],
        [],
      ),
    'get_token_price' : IDL.Func([IDL.Text, IDL.Text], [Result_7], []),
    'get_token_price_by_symbol' : IDL.Func(
        [IDL.Text, IDL.Text],
        [Result_7],
        [],
      ),
    'get_usd_value' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Nat8],
        [Result_8],
        [],
      ),
    'remove_asset' : IDL.Func([RemoveAssetArgs], [Result], []),
    'safe_get_price' : IDL.Func([IDL.Text, IDL.Text], [Result_9], []),
  });
};
export const init = ({ IDL }) => { return []; };
