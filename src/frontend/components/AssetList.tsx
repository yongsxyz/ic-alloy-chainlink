import { useState } from "react";
import { useAssetService } from "@/services/get_all_asset";
import { Skeleton } from "./ui/skeleton";
import { ScanSearch } from "lucide-react";

type AssetInfo = {
  address: string;
  symbol: string;
};

const AssetList = () => {
  const [assets, setAssets] = useState<AssetInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState("");
  
  const { getAllAssets } = useAssetService();

  const handleFetchAssets = async () => {
    if (!walletAddress) {
      setError("Please enter a wallet address");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await getAllAssets(walletAddress);
      if ('Ok' in result) {
        setAssets(result.Ok);
      } else if ('Err' in result) {
        setError(result.Err);
      }
    } catch (e) {
      setError("Failed to fetch assets");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <ScanSearch className="w-8 h-8 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">All Asset</h2>
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
            </div>
          ))
        ) : assets.length > 0 ? (
          assets.map((asset, index) => (
            <div 
              key={index} 
              className="p-4 bg-muted/30 border border-border rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <h3 className="font-medium text-primary group-hover:text-primary/90 transition-colors">
                {asset.symbol}
              </h3>
              <p className="text-sm text-muted-foreground break-all mt-1">
                {asset.address}
              </p>
            </div>
          ))
        ) : (
          !loading && (
            <div className="p-8 text-center border-2 border-dashed border-muted rounded-lg">
              <p className="text-muted-foreground">
                No assets found. Enter a wallet address to search.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AssetList;