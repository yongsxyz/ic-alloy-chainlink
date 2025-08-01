import { useState } from "react";
import { useGetAssetBySymbol } from "@/services/get_asset_by_symbol";
import { Skeleton } from "./ui/skeleton";
import { Search } from "lucide-react";

type AssetInfoSymbol = {
  asset_address: string;
  original_symbol: string;
  stale_price_threshold: bigint;
  token_decimals: number;
  price_feed: string;
};

const GetAssetBySymbol = () => {
  const [asset, setAsset] = useState<AssetInfoSymbol | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [symbol, setSymbol] = useState("");

  const { getAssetBySymbol } = useGetAssetBySymbol();

  const handleFetchAsset = async () => {
    if (!walletAddress || !symbol) {
      setError("Please enter both wallet address and symbol");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await getAssetBySymbol(walletAddress, symbol);
      if ('Ok' in result) {
        setAsset(result.Ok);
      } else if ('Err' in result) {
        setError(result.Err);
      }
    } catch (e) {
      setError("Failed to fetch asset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Search className="w-8 h-8 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Find Asset by Symbol</h2>
      </div>
      
      <div className="space-y-3 mb-6">
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="Enter asset address..."
          className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all"
          disabled={loading}
        />
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="Enter symbol"
          className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all"
          disabled={loading}
        />
        <button
          onClick={handleFetchAsset}
          disabled={loading}
          className="w-full px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Find Asset
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
        {loading && !asset ? (
          <div className="p-4 border border-border rounded-lg">
            <Skeleton className="h-5 w-1/4 mb-2 bg-muted" />
            <Skeleton className="h-4 w-3/4 mb-2 bg-muted" />
            <Skeleton className="h-4 w-1/2 bg-muted" />
          </div>
        ) : asset ? (
          <div className="p-4 bg-muted/30 border border-border rounded-lg">
            <h3 className="font-medium text-primary mb-2">
              {asset.original_symbol}
            </h3>
            <p className="text-sm text-muted-foreground break-all mb-1">
              <span className="font-medium">Address:</span> {asset.asset_address}
            </p>
            <p className="text-sm text-muted-foreground mb-1">
              <span className="font-medium">Decimals:</span> {asset.token_decimals.toString()}
            </p>
            <p className="text-sm text-muted-foreground mb-1">
              <span className="font-medium">Stale Price Threshold:</span> {asset.stale_price_threshold.toString()}
            </p>
            <p className="text-sm text-muted-foreground break-all">
              <span className="font-medium">Price Feed:</span> {asset.price_feed}
            </p>
          </div>
        ) : (
          !loading && (
            <div className="p-8 text-center border-2 border-dashed border-muted rounded-lg">
              <p className="text-muted-foreground">
                Enter a wallet address and symbol to search for an asset.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default GetAssetBySymbol;