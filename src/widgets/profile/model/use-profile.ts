import { useSuiClient } from "@mysten/dapp-kit";
import { SuiClient } from "@mysten/sui/client";
import { useQuery } from "@tanstack/react-query";
import { useWalletAccountStore } from "./use-wallet-accounts";
import { fetchProfileByAddress } from "@/shared/suipi";

export const PROFILE_QUERY_KEY = "profile_query";

export const useProfileQuery = (
  profileSuiAddress: string | undefined = undefined,
) => {
  const suiClient = useSuiClient();
  const { activeAccount } = useWalletAccountStore();

  let address = profileSuiAddress || activeAccount?.publicKey;

  const queryKey = [PROFILE_QUERY_KEY, address || ""];

  const result = useQuery({
    queryKey,
    enabled: !!address,
    queryFn: async () => {
      if (!address) {
        return null;
      }
      return await fetchProfileByAddress(suiClient as unknown as SuiClient, address);
    },
  });

  // After calling useQuery, we can return a modified result if needed
  if (!address) {
    return {
      ...result,
      isError: false,
      isLoading: false,
      isFetching: false,
      data: null,
    };
  }

  return result;
};
