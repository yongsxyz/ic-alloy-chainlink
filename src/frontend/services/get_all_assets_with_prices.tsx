import { useActor } from "@/actor";
import useHandleAgentError from "@/hooks/useHandleAgentError";

export const useAllAssetWithPrice = () => {
  const { actor: backend } = useActor();
  const { handleAgentError } = useHandleAgentError();

  const getAllAssetsWithPrices = async (address: string) => {
    if (!backend) {
      throw new Error('backend actor not initialized');
    }

    try {
      const result = await backend.get_all_assets_with_prices(address);
      return result;
    } catch (e) {
      handleAgentError(e);
      console.error(e);
      throw e;
    }
  };

  return {
    getAllAssetsWithPrices,
  };
};