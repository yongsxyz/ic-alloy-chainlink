import { useState } from "react";
import { useConversionService } from "@/services/convert_tokens";
import { Skeleton } from "./ui/skeleton";
import { ArrowRightLeft, Wallet } from "lucide-react";

type RawConversionData = {
    price: string;
    amount: string;
};

type ConversionResult = {
    raw: RawConversionData;
    output: string;
    price_decimals: number;
    last_updated_time: number;
    input: string;
    token_decimals: number;
    price: string;
    symbol: string;
};


const TokenConverter = () => {
    const [tokenAmount, setTokenAmount] = useState("");
    const [assetAddress, setAssetAddress] = useState("");
    const [results, setResults] = useState<ConversionResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [conversionType, setConversionType] = useState<"tokenToUSD" | "usdToToken">("tokenToUSD");

    const { convertTokensToUSD, convertUSDToTokens } = useConversionService();

    const convertBackendTimestamp = (timestamp: number | bigint): number => {
        const ts = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;

        if (ts < 10000000000) {
            return ts * 1000;
        } else if (ts > 1000000000000) {
            return ts / 1000000;
        }

        return ts;
    };


    const handleConvert = async () => {
        
        if (!tokenAmount || !assetAddress) {
            setError("Please enter both amount and asset address");
            return;
        }

        const amount = Number(tokenAmount);
        if (isNaN(amount)) {
            setError("Please enter a valid number");
            return;
        }

        if (amount <= 0) {
            setError("Amount must be greater than zero");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let result;
            if (conversionType === "tokenToUSD") {
                result = await convertTokensToUSD(assetAddress, tokenAmount);
            } else {
                result = await convertUSDToTokens(assetAddress, tokenAmount);
            }

            if ('Err' in result) {
                throw new Error(result.Err);
            }

            const conversionResults = result.Ok.map(res => ({
                ...res,
                last_updated_time: convertBackendTimestamp(res.last_updated_time),
                output: formatOutput(res.output, res.token_decimals),
                price: formatPrice(res.price, res.price_decimals)
            }));

            setResults(conversionResults);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to perform conversion");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    const formatOutput = (value: string, decimals: number) => {
        const num = parseFloat(value);
        return num.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: decimals
        });
    };

    const formatPrice = (price: string, decimals: number) => {
        const num = parseFloat(price);
        return num.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: decimals
        });
    };

    const clearResults = () => {
        setResults([]);
        setError(null);
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="flex items-center gap-3 mb-6">
                <ArrowRightLeft className="w-8 h-8 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Token Converter</h2>
            </div>

            <div className="flex gap-3 mb-4">
                <button
                    onClick={() => {
                        setConversionType("tokenToUSD");
                        clearResults();
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${conversionType === "tokenToUSD"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                >
                    Token → USD
                </button>
                <button
                    onClick={() => {
                        setConversionType("usdToToken");
                        clearResults();
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${conversionType === "usdToToken"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                >
                    USD → Token
                </button>
            </div>

            <div className="flex flex-col gap-4 mb-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                        {conversionType === "tokenToUSD" ? "Token Amount" : "USD Amount"}
                    </label>
                    <input
                        type="text"
                        value={tokenAmount}
                        onChange={(e) => {
                            setTokenAmount(e.target.value);
                            clearResults();
                        }}
                        placeholder={conversionType === "tokenToUSD" ? "Enter amount..." : "Enter amount..."}
                        className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all"
                        disabled={loading}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Asset Address Owner</label>
                    <div className="relative">
                        <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={assetAddress}
                            onChange={(e) => {
                                setAssetAddress(e.target.value);
                                clearResults();
                            }}
                            placeholder="Enter asset address Owner..."
                            className="w-full pl-10 pr-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all"
                            disabled={loading}
                        />
                    </div>
                </div>

                <button
                    onClick={handleConvert}
                    disabled={loading || !tokenAmount || !assetAddress}
                    className="mt-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-all flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                            Converting...
                        </>
                    ) : (
                        <>
                            <ArrowRightLeft className="w-4 h-4" />
                            Convert
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="p-4 mb-6 bg-destructive/10 border border-destructive rounded-lg text-destructive">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                {loading && !results.length ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-4 border border-border rounded-lg">
                                <Skeleton className="h-5 w-1/4 mb-2 bg-muted" />
                                <Skeleton className="h-4 w-3/4 bg-muted" />
                            </div>
                        ))}
                    </div>
                ) : results.length > 0 ? (
                    results.map((result, index) => (
                        <div
                            key={index}
                            className="p-4 bg-muted/30 border border-border rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-medium text-primary group-hover:text-primary/90 transition-colors">
                                        {result.symbol}
                                    </h3>
                                    <p className="text-sm text-muted-foreground break-all mt-1">
                                        {assetAddress}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">
                                        {conversionType === "tokenToUSD" ? (
                                            <>{result.input} = {result.output}</>
                                        ) : (
                                            <>{result.input} = {result.output}</>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                <div className="text-muted-foreground">
                                    Raw price: <span className="text-foreground">{result.raw.price}</span>
                                </div>
                                <div className="text-muted-foreground">
                                    Price decimals: <span className="text-foreground">{result.price_decimals}</span>
                                </div>
                                <div className="text-muted-foreground">
                                    Raw amount: <span className="text-foreground">{result.raw.amount}</span>
                                </div>
                                <div className="text-muted-foreground">
                                    Token decimals: <span className="text-foreground">{result.token_decimals}</span>
                                </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                                Last updated: {new Date(result.last_updated_time).toLocaleString()} || Timestamp: {result.last_updated_time}
                            </div>
                        </div>
                    ))
                ) : (
                    !loading && (
                        <div className="p-8 text-center border-2 border-dashed border-muted rounded-lg">
                            <p className="text-muted-foreground">
                                {conversionType === "tokenToUSD"
                                    ? "Enter token amount and asset address to convert to USD"
                                    : "Enter USD amount and asset address to convert to tokens"}
                            </p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default TokenConverter;