import Login from './components/login';
import { useInternetIdentity } from 'ic-use-internet-identity';
import Wallet from './components/wallet';
import { Toaster } from './components/ui/toaster';

/////SERVICES
import AssetList from './components/AssetList';
import AddAsset from './components/AddAsset';
import RemoveAsset from './components/RemoveAsset';
import ConvertToken from './components/ConvertToken';
import AllAssetWithPrice from './components/AllAssetWithPrice';
import GetAssetBySymbol from './components/getAssetBySymbol';
import GetPriceFeedDetails from './components/GetPriceFeedDetails';
import GetTokenAmount from './components/getTokenAmount';
import GetTokenPrice from './components/getTokenPrice';
import GetTokenPriceBySymbol from './components/GetTokenPriceBySymbol';
import GetUsdValue from './components/getUsdValue';
import SafeGetPrice from './components/SafeGetPrice';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import {
  Plus,
  RefreshCw,
  Search,
  List,
  DollarSign,
  ArrowRightLeft,
  X,
  Shield
} from 'lucide-react';

function AppInner() {
  const { identity } = useInternetIdentity();

  if (!identity) {
    return <Login />;
  }

  return (
    <div className="p-2 sm:p-4">
      <Wallet />
      <Tabs defaultValue="add_asset" className="w-full">
        <TabsList className="grid grid-cols-4 sm:grid-cols-7 h-auto p-1 sm:p-2 gap-1 bg-gray-800 dark:bg-gray-800 rounded-lg overflow-x-auto">
          <TabsTrigger value="add_asset" className="flex flex-col items-center gap-1 p-1 sm:p-2">
            <Plus size={20} className="sm:size-6" />
            <span className="hidden sm:inline text-xs sm:text-sm font-medium">Add Asset</span>
          </TabsTrigger>
          <TabsTrigger value="convert_tokens" className="flex flex-col items-center gap-1 p-1 sm:p-2">
            <ArrowRightLeft size={20} className="sm:size-6" />
            <span className="hidden sm:inline text-xs sm:text-sm font-medium">All Token Converter </span>
          </TabsTrigger>
          <TabsTrigger value="get_all_assets" className="flex flex-col items-center gap-1 p-1 sm:p-2">
            <List size={20} className="sm:size-6" />
            <span className="hidden sm:inline text-xs sm:text-sm font-medium">All Assets</span>
          </TabsTrigger>
          <TabsTrigger value="get_all_assets_with_prices" className="flex flex-col items-center gap-1 p-1 sm:p-2">
            <DollarSign size={20} className="sm:size-6" />
            <span className="hidden sm:inline text-xs sm:text-sm font-medium">Assets with Prices</span>
          </TabsTrigger>
          <TabsTrigger value="get_asset_by_symbol" className="flex flex-col items-center gap-1 p-1 sm:p-2">
            <Search size={20} className="sm:size-6" />
            <span className="hidden sm:inline text-xs sm:text-sm font-medium">Asset by Symbol</span>
          </TabsTrigger>
          <TabsTrigger value="get_price_feed_details" className="flex flex-col items-center gap-1 p-1 sm:p-2">
            <RefreshCw size={20} className="sm:size-6" />
            <span className="hidden sm:inline text-xs sm:text-sm font-medium">Price Feed</span>
          </TabsTrigger>
          <TabsTrigger value="get_token_amount" className="flex flex-col items-center gap-1 p-1 sm:p-2">
            <DollarSign size={20} className="sm:size-6" />
            <span className="hidden sm:inline text-xs sm:text-sm font-medium">Token Amount</span>
          </TabsTrigger>
          <TabsTrigger value="get_token_price" className="flex flex-col items-center gap-1 p-1 sm:p-2">
            <DollarSign size={20} className="sm:size-6" />
            <span className="hidden sm:inline text-xs sm:text-sm font-medium">Token Price</span>
          </TabsTrigger>
          <TabsTrigger value="get_token_price_by_symbol" className="flex flex-col items-center gap-1 p-1 sm:p-2">
            <Search size={20} className="sm:size-6" />
            <span className="hidden sm:inline text-xs sm:text-sm font-medium">Price by Symbol</span>
          </TabsTrigger>
          <TabsTrigger value="get_usd_value" className="flex flex-col items-center gap-1 p-1 sm:p-2">
            <DollarSign size={20} className="sm:size-6" />
            <span className="hidden sm:inline text-xs sm:text-sm font-medium">USD Value</span>
          </TabsTrigger>
          <TabsTrigger value="remove_asset" className="flex flex-col items-center gap-1 p-1 sm:p-2">
            <X size={20} className="sm:size-6" />
            <span className="hidden sm:inline text-xs sm:text-sm font-medium">Remove Asset</span>
          </TabsTrigger>
          <TabsTrigger value="safe_get_price" className="flex flex-col items-center gap-1 p-1 sm:p-2">
            <Shield size={20} className="sm:size-6" />
            <span className="hidden sm:inline text-xs sm:text-sm font-medium">Safe Get Price</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add_asset">
          < div className="mt-4">
            <AddAsset />
          </div>
        </TabsContent>

        <TabsContent value="get_all_assets">
          <div className="mt-4">
            <AssetList />
          </div>
        </TabsContent>

        <TabsContent value="get_all_assets_with_prices">
          <div className="mt-4">
            <AllAssetWithPrice />
          </div>
        </TabsContent>

        <TabsContent value="remove_asset">
          <div className="mt-4">
            <RemoveAsset />
          </div>
        </TabsContent>

        <TabsContent value="convert_tokens">
          <div className="mt-4">
            <ConvertToken />
          </div>
        </TabsContent>

        <TabsContent value="get_asset_by_symbol">
          <div className="mt-4">
            <GetAssetBySymbol />
          </div>
        </TabsContent>

        <TabsContent value="get_price_feed_details">
          <div className="mt-4">
            <GetPriceFeedDetails />
          </div>
        </TabsContent>

        <TabsContent value="get_token_amount">
          <div className="mt-4">
            <GetTokenAmount />
          </div>
        </TabsContent>

        <TabsContent value="get_token_price">
          <div className="mt-4">
            <GetTokenPrice />
          </div>
        </TabsContent>

        <TabsContent value="get_token_price_by_symbol">
          <div className="mt-4">
            <GetTokenPriceBySymbol />
          </div>
        </TabsContent>
        <TabsContent value="get_usd_value">
          <div className="mt-4">
            <GetUsdValue />
          </div>
        </TabsContent>
        <TabsContent value="safe_get_price">
          <div className="mt-4">
            <SafeGetPrice />
          </div>
        </TabsContent>


      </Tabs>

    </div>
  );
}

export default function App() {
  return (
    <main>
      <AppInner />
      <Toaster />
    </main>
  );
}