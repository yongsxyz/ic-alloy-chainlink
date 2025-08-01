import { useState } from "react";
import { useSafeGetPrice } from "@/services/safe_get_price";
import { Skeleton } from "./ui/skeleton";
import { DollarSign } from "lucide-react";

type PriceInfo = {
  decimals: number;
  raw_price: string;
  formatted_price: string;
};

const SafeGetPrice = () => {
  const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [assetAddress, setAssetAddress] = useState("");
  
  const { safeGetPrice } = useSafeGetPrice();

  const handleFetchPrice = async () => {
    if (!walletAddress || !assetAddress) {
      setError("Please enter both wallet and asset addresses");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await safeGetPrice(walletAddress, assetAddress);
      setPriceInfo(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch price");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="w-8 h-8 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Asset Price Lookup</h2>
      </div>
      
      <div className="space-y-4 mb-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Wallet Address</label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Enter wallet address owner..."
            className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Asset Address</label>
          <input
            type="text"
            value={assetAddress}
            onChange={(e) => setAssetAddress(e.target.value)}
            placeholder="Enter asset address..."
            className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all"
            disabled={loading}
          />
        </div>

        <button
          onClick={handleFetchPrice}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              Loading...
            </>
          ) : (
            <>
              <DollarSign className="w-4 h-4" />
              Get Price
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
        {loading && !priceInfo ? (
          <div className="p-4 border border-border rounded-lg">
            <Skeleton className="h-5 w-1/4 mb-2 bg-muted" />
            <Skeleton className="h-4 w-3/4 bg-muted" />
            <Skeleton className="h-4 w-1/2 mt-2 bg-muted" />
          </div>
        ) : priceInfo ? (
          <div className="p-4 bg-muted/30 border border-border rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-primary">Price Information</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Decimals: {priceInfo.decimals}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">
                  {priceInfo.formatted_price}
                </p>
                <p className="text-sm text-muted-foreground">
                  Raw: {priceInfo.raw_price}
                </p>
              </div>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="p-8 text-center border-2 border-dashed border-muted rounded-lg">
              <p className="text-muted-foreground">
                Enter wallet and asset addresses to fetch price information.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default SafeGetPrice;