import { useActor } from "@/actor";
import useHandleAgentError from "@/hooks/useHandleAgentError";

export const useGetTokenPriceBySymbol = () => {
  const { actor: backend } = useActor();
  const { handleAgentError } = useHandleAgentError();

  const getTokenPriceBySymbol = async (ownerAddress: string, symbol: string) => {
    if (!backend) {
      throw new Error('backend actor not initialized');
    }

    try {
      const result = await backend.get_token_price_by_symbol(ownerAddress, symbol);
      if ("Err" in result) {
        throw new Error(result.Err);
      }
      return result.Ok;
    } catch (e) {
      handleAgentError(e);
      console.error(e);
      throw e;
    }
  };

  return {
    getTokenPriceBySymbol,
  };
};