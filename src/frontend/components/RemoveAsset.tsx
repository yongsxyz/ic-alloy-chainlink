import { useState } from "react";
import { useRemoveAssetService } from "@/services/remove_asset";
import { Loader2, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

const RemoveAsset = () => {
    const { removeAsset, isFetchingAddress, ethAddress } = useRemoveAssetService();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<{ message: string, details?: string } | null>(null);
    const [success, setSuccess] = useState<{ message: string, txHash?: string } | null>(null);
    const [assetAddress, setAssetAddress] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsSubmitting(true);

        try {
            const result = await removeAsset(assetAddress);
            const txHashMatch = result.match(/Transaction hash: 0x([a-fA-F0-9]{64})/);
            const txHash = txHashMatch ? `0x${txHashMatch[1]}` : null;

            setSuccess({
                message: "Asset successfully removed from the Asse tPrice Registry contract",
                txHash: txHash || undefined
            });

            setAssetAddress("");

        } catch (e) {
            let errorMessage = "Failed to remove asset";
            let errorDetails = "";

            if (e instanceof Error) {
                errorMessage = e.message;
                if (errorMessage.includes("Invalid asset address")) {
                    errorDetails = "Please check the asset contract address format";
                } else if (errorMessage.includes("Asset not found")) {
                    errorDetails = "This asset is not currently in your Asset Price Registry";
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
                <h2 className="text-2xl font-bold text-foreground">Remove Asset</h2>
                {isFetchingAddress && (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                )}
            </div>

            {isFetchingAddress ? (
                <div className="space-y-4">
                    {Array.from({ length: 2 }).map((_, i) => (
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
                                        Please check the input and try again.
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
                                        The asset has been removed from your Asset Price Registry contract.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="asset_address" className="text-sm font-medium text-foreground">
                                Asset Address to Remove
                            </label>
                            <input
                                id="asset_address"
                                name="asset_address"
                                type="text"
                                value={assetAddress}
                                onChange={(e) => setAssetAddress(e.target.value)}
                                placeholder="0x..."
                                required
                                disabled={isSubmitting}
                                className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all disabled:opacity-50"
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting || !assetAddress}
                                className="px-6 py-3 bg-destructive text-destructive-foreground font-medium rounded-lg hover:bg-destructive/90 disabled:bg-muted disabled:text-muted-foreground transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Removing Asset...
                                    </>
                                ) : (
                                    "Remove Asset"
                                )}
                            </button>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
};

export default RemoveAsset;