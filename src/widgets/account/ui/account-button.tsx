import { useEffect, useState, useRef, createContext } from "react";
import { Wallet, Repeat } from "lucide-react";
import { useWalletAccountStore } from "../../profile/model/use-wallet-accounts";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Box } from "@radix-ui/themes";
import { Button } from "@radix-ui/themes";
import { useSuiClient } from "@mysten/dapp-kit";
import { AccountView } from "./account-view";
import { AccountDrawer, DrawerManagerRef } from "./account-drawer";
import { fetchAddressBalance } from "@/shared/suipi";
import { SuiClient } from "@mysten/sui/client";
import { Drawer } from "@/components/drawer";
import { RouteNames } from "@/routes";
import { useNavigate } from "react-router";

// Create a context to pass drawer navigation functions to children
export const DrawerContext = createContext<{
  navigateTo: (view: string) => void;
}>({
  navigateTo: () => {},
});

interface AccountButtonProps {
  customStyle?: React.CSSProperties;
}

export const AccountButton: React.FC<AccountButtonProps> = ({
  customStyle,
}) => {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAccountView, setShowAccountView] = useState(false);
  const drawerManagerRef = useRef<DrawerManagerRef>(null);
  const { activeAccount, isInitializing: isActiveAccountInitializing } =
    useWalletAccountStore();
  const suiClient = useSuiClient();
  const navigate = useNavigate();

  // Fetch balance when component mounts or active account changes
  useEffect(() => {
    if (!activeAccount || !activeAccount.publicKey) return;

    const queryBalance = async () => {
      try {
        setLoading(true);

        const mySuiBalance = await fetchAddressBalance(
          suiClient as unknown as SuiClient,
          activeAccount.publicKey,
        );
        console.log("🔍 [AccountButton] My SUI balance:", mySuiBalance);
        setBalance(mySuiBalance);
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      } finally {
        setLoading(false);
      }
    };

    queryBalance();
  }, [activeAccount, isActiveAccountInitializing]);

  // Format address for display
  const truncatedAddress = activeAccount?.publicKey
    ? `${activeAccount.publicKey.slice(0, 6)}...${activeAccount.publicKey.slice(-4)}`
    : "";

  const handleButtonClick = () => {
    console.log("Account button clicked, opening account view");
    setShowAccountView(true);
  };

  // Handle mock send functionality
  // const handleSend = async (recipient: string, mistAmount: bigint) => {
  //   try {
  //     console.log(`Sending ${mistAmount} to ${recipient}`);
      
  //     // Mock implementation - replace with actual Sui transaction
  //     return new Promise<void>((resolve) => {
  //       setTimeout(() => {
  //         console.log("Transaction completed!");
  //         resolve();
  //       }, 1000);
  //     });
  //   } catch (error) {
  //     console.error("Transaction failed:", error);
  //     throw error;
  //   }
  // };

  // Function to navigate between drawer views
  const navigateToView = (view: string) => {
    if (drawerManagerRef.current) {
      drawerManagerRef.current.navigateTo(view as any);
    }
  };

  // Switch Account button that will be passed to the Drawer
  const switchAccountButton = (
    <button
      onClick={() => navigate(`/${RouteNames.Accounts}`)}
      className="flex items-center gap-2 text-white underline font-mono text-base hover:text-primary transition-colors focus:outline-none bg-transparent border-none p-0"
      style={{ boxShadow: "none" }}
    >
      <Repeat size={20} className="text-white" />
      <span>Switch Account</span>
    </button>
  );

  if (
    loading ||
    !activeAccount ||
    !activeAccount.publicKey ||
    isActiveAccountInitializing
  ) {
    return (
      <Box style={{ marginRight: "4px" }}>
        <LoadingSpinner />
      </Box>
    );
  }

  return (
    <>
      <Button
        style={{
          backgroundColor:
            balance > 0 ? "rgba(0, 255, 0, 0.1)" : "rgba(255, 165, 0, 0.1)",
          color: balance > 0 ? "#00ff00" : "#ffa500",
          border:
            balance > 0
              ? "1px solid rgba(0, 255, 0, 0.3)"
              : "1px solid rgba(255, 165, 0, 0.3)",
          borderRadius: "8px",
          padding: "6px 12px",
          cursor: "pointer",
          fontFamily: "monospace",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          ...customStyle,
        }}
        onClick={handleButtonClick}
      >
        <Wallet size={14} color={balance > 0 ? "#00ff00" : "#ffa500"} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              opacity: 0.8,
              lineHeight: "1",
            }}
          >
            {truncatedAddress}
          </span>
        </div>
      </Button>

      {/* Account Drawer */}
      <Drawer
        open={showAccountView}
        onOpenChange={setShowAccountView}
        maxWidth="max-w-[800px]"
        footerContent={switchAccountButton}
      >
        <DrawerContext.Provider value={{ navigateTo: navigateToView }}>
          <AccountDrawer
            ref={drawerManagerRef}
            address={activeAccount?.publicKey || ""}
            balance={balance}
            onClose={() => setShowAccountView(false)}
          >
            <AccountView onOpenChange={setShowAccountView} />
          </AccountDrawer>
        </DrawerContext.Provider>
      </Drawer>
    </>
  );
};

