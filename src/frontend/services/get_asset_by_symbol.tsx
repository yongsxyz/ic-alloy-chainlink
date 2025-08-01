import { useActor } from "@/actor";
import useHandleAgentError from "@/hooks/useHandleAgentError";

export const useGetAssetBySymbol = () => {
    
  const { actor: backend } = useActor();
  const { handleAgentError } = useHandleAgentError();

  const getAssetBySymbol = async (address: string, symbol: string) => {
    if (!backend) {
      throw new Error('backend actor not initialized');
    }

    try {
      const result = await backend.get_asset_by_symbol(address, symbol);
      return result;
    } catch (e) {
      handleAgentError(e);
      console.error(e);
      throw e;
    }
  };

  return {
    getAssetBySymbol,
  };
};