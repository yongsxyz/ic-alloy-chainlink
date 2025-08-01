import { useActor } from "@/actor";
import useHandleAgentError from "@/hooks/useHandleAgentError";

export const useGetPriceFeedDetails = () => {
  const { actor: backend } = useActor();
  const { handleAgentError } = useHandleAgentError();

  const getPriceFeedDetails = async (assetAddress: string, priceFeed: string) => {
    if (!backend) {
      throw new Error('backend actor not initialized');
    }

    try {
      const result = await backend.get_price_feed_details(assetAddress, priceFeed);
      return result;
    } catch (e) {
      handleAgentError(e);
      console.error(e);
      throw e;
    }
  };

  return {
    getPriceFeedDetails,
  };
};