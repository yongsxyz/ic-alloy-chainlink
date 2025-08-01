import { useState } from "react";
import { useGetTokenPrice } from "@/services/get_token_price";
import { Skeleton } from "./ui/skeleton";
import { Calculator } from "lucide-react";

type TokenPriceResult = {
  decimals: number;
  raw_price: bigint;
  price: string;
};

const GetTokenPrice = () => {
  const [result, setResult] = useState<TokenPriceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ownerAddress, setOwnerAddress] = useState("");
  const [assetAddress, setAssetAddress] = useState("");
  
  const { getTokenPrice } = useGetTokenPrice();

  const handleCalculate = async () => {
    if (!ownerAddress || !assetAddress) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await getTokenPrice(ownerAddress, assetAddress);
      
      setResult(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to calculate token price");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-8 h-8 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Token Price</h2>
      </div>
      
      <div className="space-y-4 mb-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Owner Address</label>
          <input
            type="text"
            value={ownerAddress}
            onChange={(e) => setOwnerAddress(e.target.value)}
            placeholder="Enter owner's wallet address..."
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
          {loading && <Skeleton className="w-full h-4 rounded-lg" />}
        </div>

        <button
          onClick={handleCalculate}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              Calculating...
            </>
          ) : (
            <>
              <Calculator className="w-4 h-4" />
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

      {result && (
        <div className="p-6 bg-muted/30 border border-border rounded-lg space-y-3">
          <h3 className="font-medium text-lg text-primary">Result</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Decimals</p>
              <p className="font-medium text-foreground break-all">{result.decimals}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Raw Price</p>
              <p className="font-medium text-foreground break-all">{result.raw_price.toString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Formatted Price</p>
              <p className="font-medium text-foreground break-all">{result.price}</p>
            </div>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="p-8 text-center border-2 border-dashed border-muted rounded-lg">
          <p className="text-muted-foreground">
            Enter token details to get the price.
          </p>
        </div>
      )}
    </div>
  );
};

export default GetTokenPrice;