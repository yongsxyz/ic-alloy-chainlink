import { useActor } from "@/actor";
import useHandleAgentError from "@/hooks/useHandleAgentError";

export const useSafeGetPrice = () => {
  const { actor: backend } = useActor();
  const { handleAgentError } = useHandleAgentError();

  const safeGetPrice = async (ownerAddress: string, assetAddress: string) => {
    if (!backend) {
      throw new Error('backend actor not initialized');
    }

    try {
      const result = await backend.safe_get_price(ownerAddress, assetAddress);
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
    safeGetPrice,
  };
};