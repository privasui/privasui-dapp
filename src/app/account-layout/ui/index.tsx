import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";

import { SuiClient } from "@mysten/sui/client";
import { useSuiClient } from "@mysten/dapp-kit";

import { RouteNames } from "@/routes";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useWalletAccountStore } from "@/widgets/profile/model/use-wallet-accounts";
import { PROFILE_QUERY_KEY } from "@/widgets/profile/model/use-profile";
import { fetchProfileByAddress } from "@/shared/suipi";


export const AccountLayout = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { activeAccount, getActiveAccount, initializeFromStorage } =
    useWalletAccountStore();

  const client = useQueryClient();
  const suiClient = useSuiClient();

  const loadAccounts = async () => {
    try {
      const start = Date.now();

      console.log("start important", start);

      setLoading(true);

      await initializeFromStorage();

      const active = await getActiveAccount();

      if (!active || !active.publicKey) {
        setLoading(false);
        navigate(`/${RouteNames.Accounts}`, { replace: true });
        return;
      }

      const profile = await client.fetchQuery({
        queryKey: [PROFILE_QUERY_KEY, active?.publicKey || ""],
        queryFn: async () => {
          if (!active?.publicKey) {
            return null;
          }

          let profile = await fetchProfileByAddress(
            suiClient as unknown as SuiClient,
            active?.publicKey,
          );

          return profile;
        },
      });

      console.log("end important", Date.now() - start);

      setLoading(false);

      if (!profile) {
        navigate(`/${RouteNames.CreateProfile}`, { replace: true });
      }
    } catch (error) {
      console.error("Failed to load accounts:", error);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [activeAccount?.uid]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center w-full">
        <LoadingSpinner />
      </div>
    );
  }

  return <Outlet />;
};
