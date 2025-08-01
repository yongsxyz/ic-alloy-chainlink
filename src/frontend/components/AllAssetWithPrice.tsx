import { useState } from "react";
import { useAllAssetWithPrice } from "@/services/get_all_assets_with_prices";
import { Skeleton } from "./ui/skeleton";
import { ScanSearch } from "lucide-react";

type AssetWithPrice = {
  address: string;
  symbol: string;
  price: string;
  raw_price: string;
  decimals: number;
  last_updated: string;
};

const AllAssetWithPrice = () => {
  const [assets, setAssets] = useState<AssetWithPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState("");
  
  const { getAllAssetsWithPrices } = useAllAssetWithPrice();

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString();
  };

  const handleFetchAssets = async () => {
    if (!walletAddress) {
      setError("Please enter a wallet address");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await getAllAssetsWithPrices(walletAddress);
      if ('Ok' in result) {
        setAssets(result.Ok);
      } else if ('Err' in result) {
        setError(result.Err);
      }
    } catch (e) {
      setError("Failed to fetch assets with prices");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <ScanSearch className="w-8 h-8 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Get All Asset Prices </h2>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="Enter wallet address owner..."
          className="flex-1 px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all"
          disabled={loading}
        />
        <button
          onClick={handleFetchAssets}
          disabled={loading}
          className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              Loading...
            </>
          ) : (
            <>
              <ScanSearch className="w-4 h-4" />
              Fetch Assets
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-destructive/10 border border-destructive rounded-lg text-destructive">
          Error: {error}
        </div>
      )}

      <div className="space-y-4">
        {loading && !assets.length ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 border border-border rounded-lg">
              <Skeleton className="h-5 w-1/4 mb-2 bg-muted" />
              <Skeleton className="h-4 w-3/4 bg-muted" />
              <Skeleton className="h-4 w-1/2 mt-2 bg-muted" />
            </div>
          ))
        ) : assets.length > 0 ? (
          assets.map((asset, index) => (
            <div 
              key={index} 
              className="p-4 bg-muted/30 border border-border rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-primary group-hover:text-primary/90 transition-colors">
                    {asset.symbol}
                  </h3>
                  <p className="text-sm text-muted-foreground break-all mt-1">
                    {asset.address}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">
                    ${parseFloat(asset.price).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {formatTimestamp(asset.last_updated)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Timestamp: {(asset.last_updated)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Raw price: {asset.raw_price} (decimals: {asset.decimals})
              </p>
            </div>
          ))
        ) : (
          !loading && (
            <div className="p-8 text-center border-2 border-dashed border-muted rounded-lg">
              <p className="text-muted-foreground">
                No assets with prices found. Enter a wallet address to search.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AllAssetWithPrice;