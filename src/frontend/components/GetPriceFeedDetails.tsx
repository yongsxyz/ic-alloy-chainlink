import { useState } from "react";
import { useGetPriceFeedDetails } from "@/services/get_price_feed_details";
import { Skeleton } from "./ui/skeleton";
import { BarChart2 } from "lucide-react";

type PriceFeedDetails = {
  updated_at: bigint;
  answer: bigint;
  round_id: string;
  answered_in_round: string;
  started_at: bigint;
};

const GetPriceFeedDetails = () => {
  const [details, setDetails] = useState<PriceFeedDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assetAddress, setAssetAddress] = useState("");
  const [priceFeed, setPriceFeed] = useState("");
  
  const { getPriceFeedDetails } = useGetPriceFeedDetails();

  const handleFetchDetails = async () => {
    if (!assetAddress || !priceFeed) {
      setError("Please enter both asset address and price feed");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await getPriceFeedDetails(assetAddress, priceFeed);
      if ('Ok' in result) {
        setDetails(result.Ok);
      } else if ('Err' in result) {
        setError(result.Err);
      }
    } catch (e) {
      setError("Failed to fetch price feed details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart2 className="w-8 h-8 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Price Feed Details</h2>
      </div>
      
      <div className="flex flex-col gap-3 mb-6">
        <input
          type="text"
          value={assetAddress}
          onChange={(e) => setAssetAddress(e.target.value)}
          placeholder="Enter owner asset address..."
          className="flex-1 px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all"
          disabled={loading}
        />
        <input
          type="text"
          value={priceFeed}
          onChange={(e) => setPriceFeed(e.target.value)}
          placeholder="Enter asset address..."
          className="flex-1 px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all"
          disabled={loading}
        />
        <button
          onClick={handleFetchDetails}
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
              <BarChart2 className="w-4 h-4" />
              Fetch Details
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
        {loading && !details ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 border border-border rounded-lg">
              <Skeleton className="h-5 w-1/4 mb-2 bg-muted" />
              <Skeleton className="h-4 w-3/4 bg-muted" />
            </div>
          ))
        ) : details ? (
          <div className="p-4 bg-muted/30 border border-border rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Answer</h3>
                <p className="text-lg font-medium text-foreground">
                  {details.answer.toString()}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                <p className="text-lg font-medium text-foreground">
                  {Number(details.updated_at)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Round ID</h3>
                <p className="text-lg font-medium text-foreground break-all">
                  {details.round_id}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Started At</h3>
                <p className="text-lg font-medium text-foreground">
                  {Number(details.started_at)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="p-8 text-center border-2 border-dashed border-muted rounded-lg">
              <p className="text-muted-foreground">
                No price feed details available. Enter asset address and price feed to search.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default GetPriceFeedDetails;