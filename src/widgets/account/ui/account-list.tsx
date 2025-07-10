import { LoadingSpinner } from "@/components/loading-spinner";
import { RouteNames } from "@/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { useWalletAccountStore } from "@/widgets/profile/model/use-wallet-accounts";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { AccountListRow } from "./account-list-row";

// Storage key for the route to return to after account switch
const RETURN_ROUTE_KEY = "privasui_return_route";

export const AccountList = () => {
  const navigate = useNavigate();
  const {
    activeAccount,
    accounts,
    isInitializing,
    setActiveAccountByUid,
    initializeFromStorage,
    resetActiveAccountSelection,
  } = useWalletAccountStore();

  // Load accounts on component mount
  useEffect(() => {
    (async () => {
      await initializeFromStorage();
      await resetActiveAccountSelection();
    })();
  }, []);

  // Handle account selection
  const handleSelectAccount = async (uid: string) => {
    await setActiveAccountByUid(uid);

    // Get the stored return route or default to /pim
    const returnRoute = localStorage.getItem(RETURN_ROUTE_KEY) || `/${RouteNames.Pim}`;
    // Clear the stored route after using it
    localStorage.removeItem(RETURN_ROUTE_KEY);

    if (uid === activeAccount?.uid) {
      navigate(returnRoute);
      return;
    }

    navigate(returnRoute);
  };

  if (isInitializing) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="h-full pb-0">
        <CardHeader>
          <CardTitle>All Accounts ({accounts.length})</CardTitle>
        </CardHeader>
        <CardContent className="px-4 overflow-auto gap-4 flex flex-col pb-4">
          {accounts.map((account) => (
            <AccountListRow
              account={account}
              key={account.uid}
              onSelect={handleSelectAccount}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
