import { useState } from "react";
import { useGetUsdValue } from "@/services/get_usd_value";
import { Skeleton } from "./ui/skeleton";
import { Calculator } from "lucide-react";

type UsdValueResult = {
    token_amount: string;
    asset_address: string;
    usd_value: string;
    raw_result: string;
};

const GetUsdValue = () => {
    const [result, setResult] = useState<UsdValueResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ownerAddress, setOwnerAddress] = useState("");
    const [assetAddress, setAssetAddress] = useState("");
    const [tokenAmount, setTokenAmount] = useState("");
    const [decimals, setDecimals] = useState("");

    const { getUsdValue } = useGetUsdValue();

    const handleCalculate = async () => {
        if (!ownerAddress || !assetAddress || !tokenAmount) {
            setError("Please fill all required fields");
            return;
        }

        setLoading(true);
        setError(null);


        try {
            const numericDecimals = Number(decimals) || 18;
            const response = await getUsdValue(
                ownerAddress,
                assetAddress,
                tokenAmount,
                numericDecimals
            );
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
                <h2 className="text-2xl font-bold text-foreground">USD Value</h2>
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Token Amount</label>
                        <input
                            type="text"
                            value={tokenAmount}
                            onChange={(e) => setTokenAmount(e.target.value)}
                            placeholder="Enter token amount..."
                            className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Decimals</label>
                        <input
                            type="number"
                            value={decimals}
                            onChange={(e) => setDecimals(e.target.value)}
                            placeholder="Token decimals"
                            className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all"
                            disabled={loading}
                        />
                    </div>
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
                            Calculate USD Value
                        </>
                    )}
                </button>
            </div>

            {loading && (
                <div className="p-6 bg-muted/30 border border-border rounded-lg space-y-3">
                    <h3 className="font-medium text-lg text-primary">Result</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Token Amount</p>
                            <Skeleton className="h-6 w-full" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">USD Value</p>
                            <Skeleton className="h-6 w-full" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Asset Address</p>
                            <Skeleton className="h-6 w-full" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Raw Result</p>
                            <Skeleton className="h-6 w-full" />
                        </div>
                    </div>
                </div>
            )}

            {result && !loading && (
                <div className="p-6 bg-muted/30 border border-border rounded-lg space-y-3">
                    <h3 className="font-medium text-lg text-primary">Result</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Token Amount</p>
                            <p className="font-medium text-foreground break-all">{result.token_amount}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">USD Value</p>
                            <p className="font-medium text-foreground break-all">${result.usd_value}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Asset Address</p>
                            <p className="font-medium text-foreground break-all">{result.asset_address}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Raw Result</p>
                            <p className="font-medium text-foreground break-all">{result.raw_result}</p>
                        </div>
                    </div>
                </div>
            )}

            {error && !loading && (
                <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive">
                    {error}
                </div>
            )}

            {!result && !loading && !error && (
                <div className="p-8 text-center border-2 border-dashed border-muted rounded-lg">
                    <p className="text-muted-foreground">
                        Enter token details to calculate the USD value.
                    </p>
                </div>
            )}
        </div>
    );
};

export default GetUsdValue;