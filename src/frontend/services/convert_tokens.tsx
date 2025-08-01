import { useActor } from "@/actor";
import useHandleAgentError from "@/hooks/useHandleAgentError";
import { useAssetService } from "./get_all_asset";

export const useConversionService = () => {
  const { actor: backend } = useActor();
  const { handleAgentError } = useHandleAgentError();
  const { getAllAssets } = useAssetService();

  const convertTokensToUSD = async (address: string, tokenAmount: string) => {
    if (!backend) {
      throw new Error('Backend actor not initialized');
    }

    try {
      const assetsResult = await getAllAssets(address);
      
      if ('Err' in assetsResult) {
        throw new Error(assetsResult.Err);
      }
      
      const assets = assetsResult.Ok;
      if (!assets || assets.length === 0) {
        throw new Error('No assets found for this address');
      }

      const tokenAmounts = new Array(assets.length).fill(tokenAmount);
      
      const result = await backend.convert_tokens_to_usd(address, tokenAmounts);
      return result;
    } catch (e) {
      handleAgentError(e);
      console.error('Error converting tokens to USD:', e);
      throw e;
    }
  };

  const convertUSDToTokens = async (address: string, usdAmount: string) => {
    if (!backend) {
      throw new Error('Backend actor not initialized');
    }

    try {
      const assetsResult = await getAllAssets(address);
      
      // Unwrap the Result type
      if ('Err' in assetsResult) {
        throw new Error(assetsResult.Err);
      }
      
      const assets = assetsResult.Ok;
      if (!assets || assets.length === 0) {
        throw new Error('No assets found for this address');
      }

      // Create array with same USD amount for all assets
      const usdAmounts = new Array(assets.length).fill(usdAmount);
      
      const result = await backend.convert_usd_to_tokens(address, usdAmounts);
      return result;
    } catch (e) {
      handleAgentError(e);
      console.error('Error converting USD to tokens:', e);
      throw e;
    }
  };

  return {
    convertTokensToUSD,
    convertUSDToTokens,
  };
};