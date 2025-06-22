import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { useWalletAccountStore } from "../model/use-wallet-accounts";
import { useProfileQuery } from "../model/use-profile";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Box } from "@radix-ui/themes";
import { Button } from "@radix-ui/themes";
import { useSuiClient } from "@mysten/dapp-kit";
import { fetchAddressBalance } from "@/shared/suipi";
import { SuiClient } from "@mysten/sui/client";
import { RouteNames } from "@/routes";
import { useNavigate } from "react-router";

interface ProfileButtonProps {
  customStyle?: React.CSSProperties;
}

export const ProfileButton: React.FC<ProfileButtonProps> = ({ customStyle }) => {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAccountView, setShowAccountView] = useState(false);
  const { activeAccount } = useWalletAccountStore();
  const suiClient = useSuiClient();
  const navigate = useNavigate();

  const { data: profile, isLoading, isFetching } = useProfileQuery(activeAccount?.publicKey);

  // Fetch balance when component mounts or active account changes
  useEffect(() => {
    if (!activeAccount || !activeAccount.publicKey) return;

    const queryAccountAndProfile = async () => {
      try {
        setLoading(true);
        const mySuiBalance = await fetchAddressBalance(suiClient as unknown as SuiClient, activeAccount.publicKey);
        console.log("🔍 [ProfileButton] My SUI balance:", mySuiBalance);
        setBalance(mySuiBalance);

        if(!profile){
          setLoading(false);
          navigate(`/${RouteNames.CreateProfile}`, { replace: true });
          return;
        }
      } catch (error) {
        console.error("[ProfileButton] Failed to fetch balance:", error);
      } finally {
        setLoading(false);
      }
    };

    queryAccountAndProfile();
  }, [activeAccount, profile, isLoading, isFetching]);
  
  // Format address for display
  const truncatedAddress = activeAccount?.publicKey 
    ? `${activeAccount.publicKey.slice(0, 6)}...${activeAccount.publicKey.slice(-4)}`
    : '';

  const handleButtonClick = () => {
    console.log("Account button clicked, opening account view");
    setShowAccountView(true);
  };

  // const handleCloseAccountView = () => {
  //   setShowAccountView(false);
  // };

  if (loading || isLoading || isFetching || !activeAccount || !activeAccount.publicKey) {
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
          backgroundColor: balance > 0 ? "rgba(0, 255, 0, 0.1)" : "rgba(255, 165, 0, 0.1)",
          color: balance > 0 ? "#00ff00" : "#ffa500",
          border: balance > 0 ? "1px solid rgba(0, 255, 0, 0.3)" : "1px solid rgba(255, 165, 0, 0.3)",
          borderRadius: "8px",
          padding: "6px 12px",
          cursor: "pointer",
          fontFamily: "monospace",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          ...customStyle
        }}
        onClick={handleButtonClick}
      >
        <Wallet 
          size={14}
          color={balance > 0 ? "#00ff00" : "#ffa500"} 
        />
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}>
          <span style={{ 
            fontSize: "12px", 
            opacity: 0.8,
            lineHeight: "1"
          }}>
            {truncatedAddress}
          </span>
        </div>
      </Button>
      
      {showAccountView && (
        // <AccountView onClose={handleCloseAccountView} />
        <div>Profile Button</div>
      )}
    </>
  );
};
