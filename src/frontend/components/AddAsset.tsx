import { useState } from "react";
import { useAddAssetService } from "@/services/add_asset";
import { Loader2, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

const AddAsset = () => {
    const { addAsset, isFetchingAddress, ethAddress } = useAddAssetService();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<{ message: string, details?: string } | null>(null);
    const [success, setSuccess] = useState<{ message: string, txHash?: string } | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        asset_address: "",
        stale_price_threshold: "",
        token_decimals: "",
        symbol: "",
        price_feed: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsSubmitting(true);

        try {
            const result = await addAsset(
                formData.asset_address,
                BigInt(formData.stale_price_threshold),
                Number(formData.token_decimals),
                formData.symbol,
                formData.price_feed
            );
            const txHashMatch = result.match(/Transaction hash: 0x([a-fA-F0-9]{64})/);
            const txHash = txHashMatch ? `0x${txHashMatch[1]}` : null;

            setSuccess({
                message: "Asset successfully added to the Asset Price Registry contract",
                txHash: txHash || undefined
            });

            setFormData({
                asset_address: "",
                stale_price_threshold: "",
                token_decimals: "",
                symbol: "",
                price_feed: ""
            });

        } catch (e) {
            let errorMessage = "Failed to add asset";
            let errorDetails = "";

            if (e instanceof Error) {
                errorMessage = e.message;
                if (errorMessage.includes("Invalid asset address")) {
                    errorDetails = "Please check the asset contract address format";
                } else if (errorMessage.includes("Invalid price feed address")) {
                    errorDetails = "Please check the price feed contract address format";
                } else if (errorMessage.includes("Symbol cannot be empty")) {
                    errorDetails = "Token symbol is required";
                } else if (errorMessage.includes("Stale price threshold must be greater than 0")) {
                    errorDetails = "Threshold must be a positive number";
                } else if (errorMessage.includes("Failed to get nonce") ||
                    errorMessage.includes("Failed to create signer")) {
                    errorDetails = "Wallet connection issue - please try again";
                }
            }

            setError({
                message: errorMessage,
                details: errorDetails
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold text-foreground">Add New Asset</h2>
                {isFetchingAddress && (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                )}
            </div>

            {isFetchingAddress ? (
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="p-4 border border-border rounded-lg">
                            <Skeleton className="h-5 w-1/4 mb-2 bg-muted" />
                            <Skeleton className="h-10 w-full bg-muted" />
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {ethAddress && (
                        <div className="mb-6 p-4 bg-muted/30 border border-border rounded-lg">
                            <p className="text-sm text-muted-foreground">Wallet Address:</p>
                            <p className="text-sm font-medium text-foreground break-all">{ethAddress}</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 mb-6 bg-destructive/10 border border-destructive rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 mt-0.5 text-destructive flex-shrink-0" />
                                <div>
                                    <p className="text-destructive font-medium">{error.message}</p>
                                    {error.details && (
                                        <p className="text-sm text-muted-foreground mt-1">{error.details}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Please check the inputs and try again.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="p-4 mb-6 bg-green-500/10 border border-green-500 rounded-lg">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 mt-0.5 text-green-500 flex-shrink-0" />
                                <div>
                                    <p className="text-green-500 font-medium">{success.message}</p>
                                    {success.txHash && (
                                        <div className="mt-2">
                                            <p className="text-sm text-foreground">
                                                Transaction:
                                                <a
                                                    href={`https://sepolia.etherscan.io/tx/${success.txHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="ml-2 inline-flex items-center text-primary hover:underline"
                                                >
                                                    View on Etherscan <ExternalLink className="w-3 h-3 ml-1" />
                                                </a>
                                            </p>
                                        </div>
                                    )}
                                    <p className="text-sm text-muted-foreground mt-2">
                                        The asset is now available in your Asset Price Registry contract.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">


                        <div className="space-y-2">
                            <label htmlFor="asset_address" className="text-sm font-medium text-foreground">
                                Asset Contract Address
                            </label>
                            <input
                                id="asset_address"
                                name="asset_address"
                                type="text"
                                value={formData.asset_address}
                                onChange={handleChange}
                                placeholder="0x..."
                                required
                                disabled={isSubmitting}
                                className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all disabled:opacity-50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="symbol" className="text-sm font-medium text-foreground">
                                Token Symbol
                            </label>
                            <input
                                id="symbol"
                                name="symbol"
                                type="text"
                                value={formData.symbol}
                                onChange={handleChange}
                                placeholder="ETH, USDC, etc."
                                required
                                disabled={isSubmitting}
                                className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all disabled:opacity-50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="price_feed" className="text-sm font-medium text-foreground">
                                Price Feed Address
                            </label>
                            <input
                                id="price_feed"
                                name="price_feed"
                                type="text"
                                value={formData.price_feed}
                                onChange={handleChange}
                                placeholder="0x..."
                                required
                                disabled={isSubmitting}
                                className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all disabled:opacity-50"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="token_decimals" className="text-sm font-medium text-foreground">
                                    Token Decimals
                                </label>
                                <input
                                    id="token_decimals"
                                    name="token_decimals"
                                    type="number"
                                    min="0"
                                    value={formData.token_decimals}
                                    onChange={handleChange}
                                    required
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all disabled:opacity-50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="stale_price_threshold" className="text-sm font-medium text-foreground">
                                    Stale Price Threshold (seconds)
                                </label>
                                <input
                                    id="stale_price_threshold"
                                    name="stale_price_threshold"
                                    type="number"
                                    min="1"
                                    value={formData.stale_price_threshold}
                                    onChange={handleChange}
                                    required
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all disabled:opacity-50"
                                />
                            </div>
                        </div>



                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Adding Asset...
                                    </>
                                ) : (
                                    "Add Asset"
                                )}
                            </button>
                        </div>
                    </form>
                </>
            )}


            {/* Example Box */}
            <div className="mt-8 p-4 bg-muted/30 border border-border rounded-lg">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold">Example Configuration for BTC/USD</h3>
                    <a
                        href="https://docs.chain.link/data-feeds/price-feeds/addresses?page=1&testnetPage=1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm flex items-center text-primary hover:underline"
                    >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Chainlink Price Feeds
                    </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Asset Contract:</p>
                        <p className="text-sm font-mono break-all">0x0000000000000000000000000000000000000001</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Price Feed (Sepolia):</p>
                        <p className="text-sm font-mono break-all">0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Symbol:</p>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-mono">BTC/USD</p>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">Aggregator v3</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Heartbeat:</p>
                        <p className="text-sm">1 hour</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Decimals:</p>
                        <p className="text-sm">8</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Recommended Threshold:</p>
                        <p className="text-sm">3600 seconds (matches heartbeat)</p>
                    </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                        <strong>Note:</strong> This example uses testnet (Sepolia) addresses. For production, use mainnet addresses from the Chainlink documentation.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        The stale price threshold should typically match or exceed the feed's heartbeat period.
                    </p>
                </div>
            </div>

        </div>
    );
};

export default AddAsset;