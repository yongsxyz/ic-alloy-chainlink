import { useActor } from "@/actor";
import useHandleAgentError from "@/hooks/useHandleAgentError";

export const useGetTokenAmount = () => {
  const { actor: backend } = useActor();
  const { handleAgentError } = useHandleAgentError();

  const getTokenAmount = async (
    owneraddress: string,
    assetAddress: string,
    amount: string,
    decimals: number
  ) => {
    if (!backend) {
      throw new Error('backend actor not initialized');
    }

    try {
      const result = await backend.get_token_amount(
        owneraddress,
        assetAddress,
        amount,
        decimals
      );
      return result;
    } catch (e) {
      handleAgentError(e);
      console.error(e);
      throw e;
    }
  };

  return {
    getTokenAmount,
  };
};