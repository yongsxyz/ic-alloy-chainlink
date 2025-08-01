import { useActor } from "@/actor";
import useHandleAgentError from "@/hooks/useHandleAgentError";

export const useGetUsdValue = () => {
  const { actor: backend } = useActor();
  const { handleAgentError } = useHandleAgentError();

  const getUsdValue = async (
    ownerAddress: string,
    assetAddress: string,
    tokenAmount: string,
    tokenDecimals: number
  ) => {
    if (!backend) {
      throw new Error('backend actor not initialized');
    }

    try {
      const result = await backend.get_usd_value(
        ownerAddress,
        assetAddress,
        tokenAmount,
        tokenDecimals
      );
      
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
    getUsdValue,
  };
};