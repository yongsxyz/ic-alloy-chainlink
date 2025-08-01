import { useActor } from "@/actor";
import useHandleAgentError from "@/hooks/useHandleAgentError";
import useEthAddress from "@/hooks/useEthAddress";
import { useQueryClient } from "@tanstack/react-query";

export const useAddAssetService = () => {
  const { actor: backend } = useActor();
  const { handleAgentError } = useHandleAgentError();
  const { data: ethAddress, isPending: isFetchingAddress } = useEthAddress();
  const queryClient = useQueryClient();

  const addAsset = async (
    asset_address: string,
    stale_price_threshold: bigint,
    token_decimals: number,
    symbol: string,
    price_feed: string
  ) => {
    if (!backend) {
      throw new Error('Backend actor not initialized');
    }

    if (isFetchingAddress) {
      throw new Error('Waiting for Ethereum address to be loaded');
    }

    if (!ethAddress) {
      throw new Error('Ethereum address is required');
    }

    try {
      const args = {
        asset_address,
        stale_price_threshold,
        token_decimals,
        symbol,
        price_feed
      };
      
      const result = await backend.add_asset(args);
      if ('Ok' in result) {
        queryClient.invalidateQueries({
          queryKey: ['assets', ethAddress]
        });
        return result.Ok;
      } else if ('Err' in result) {
        throw new Error(result.Err);
      }
      
      throw new Error('Unexpected response from backend');
    } catch (e) {
      handleAgentError(e);
      console.error('Failed to add asset:', e);
      throw e;
    }
  };

  return {
    addAsset,
    isFetchingAddress,
    ethAddress
  };
};