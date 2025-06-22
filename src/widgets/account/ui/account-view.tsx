
import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router";
import { Check, Copy, Send, ArrowDown, Clock, Grid } from "lucide-react";
import { useSuiClient } from "@mysten/dapp-kit";
import { SuiClient } from "@mysten/sui/client";
import { RouteNames } from "@/routes";
import { Button } from "@/shared/ui/button";
import { fetchAddressBalance, ProfileInfo } from "@/shared/suipi";
import { Card, CardContent } from "@/shared/ui/card";
import { LoadingSpinner } from "@/components/loading-spinner";
import { AccountBalance } from "@/widgets/account/ui/account-balance";
import { AccountNFT } from "@/widgets/account/ui/account-nft";
import { AccountFeed } from "@/widgets/account/ui/account-feed";
import { useWalletAccountStore } from "@/widgets/profile/model/use-wallet-accounts";
import { DrawerContext } from "./account-button";

import { fetchUserProfileInfo } from "@/shared/suipi";

export const AccountView: React.FC<{ onOpenChange?: (open: boolean) => void }> = ({ onOpenChange }) => {
  const [_balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userProfileInfo, setUserProfileInfo] = useState<ProfileInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'crypto' | 'nft'>('crypto');
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const navigate = useNavigate();
  const { navigateTo } = useContext(DrawerContext);

  const { activeAccount, removeAccountByUid } = useWalletAccountStore();
  const suiClient = useSuiClient();

  useEffect(() => {
    if (!activeAccount?.publicKey) return;
    setIsLoading(true);
    setIsProfileLoading(true);

    fetchAddressBalance(suiClient as unknown as SuiClient, activeAccount.publicKey)
      .then(setBalance)
      .catch(() => setBalance(0))
      .finally(() => setIsLoading(false));

    fetchUserProfileInfo(suiClient as unknown as SuiClient, activeAccount.publicKey)
      .then(setUserProfileInfo)
      .catch(() => setUserProfileInfo(null))
      .finally(() => setIsProfileLoading(false));

  }, [activeAccount, suiClient]);

  const handleCopy = async () => {
    if (!activeAccount?.publicKey) return;
    let copySuccessful = false;
    const address = activeAccount.publicKey;

    // Clipboard API (modern browsers)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(address);
        copySuccessful = true;
      } catch (err) {
        // Continue to fallback if this fails
      }
    }

    // iOS / Safari fallback
    if (!copySuccessful) {
      try {
        const el = document.createElement("div");
        el.contentEditable = "true";
        el.style.position = "absolute";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.innerHTML = address;
        const range = document.createRange();
        range.selectNodeContents(el);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        el.contentEditable = "false";
        copySuccessful = document.execCommand("copy");
        document.body.removeChild(el);
      } catch (err) {
        // Continue to next fallback
      }
    }

    // Standard fallback
    if (!copySuccessful) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = address;
        textarea.style.cssText = "position:fixed;top:0;left:0;opacity:0;";
        textarea.setAttribute("readonly", "");
        document.body.appendChild(textarea);
        if (navigator.userAgent.match(/ipad|iphone/i)) {
          textarea.style.fontSize = "16px";
          textarea.style.backgroundColor = "transparent";
          const range = document.createRange();
          range.selectNodeContents(textarea);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
          textarea.setSelectionRange(0, address.length);
        } else {
          textarea.select();
        }
        copySuccessful = document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch (err) {
        // Fallback failed
      }
    }

    setCopied(copySuccessful);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle action buttons with context
  const handleSendClick = () => {
    console.log("Send button clicked");
    navigateTo('send');
  };

  const handleReceiveClick = () => {
    console.log("Receive button clicked");
    navigateTo('receive');
  };

  const handleHistoryClick = () => {
    console.log("History button clicked");
    navigateTo('history');
  };

  const handleMoreClick = () => {
    console.log("More button clicked");
    navigateTo('more');
  };

  const handleDeleteAccount = async () => {
    if (!activeAccount?.uid) return;
    const success = await removeAccountByUid(activeAccount.uid);
    if (success) navigate(`/${RouteNames.Accounts}`);
  };

  // Add handler for create profile click
  const handleCreateProfileClick = () => {
    // Close the drawer using the onOpenChange prop
    onOpenChange?.(false);
  };

  return (
    <div className="w-full flex flex-col">
      {isLoading ? (
        <div className="flex-1 flex justify-center items-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="flex-1">
            {showDeleteConfirm && (
              <Card className="border-destructive/10 bg-destructive/10">
                <CardContent className="p-4">
                  <p className="text-destructive text-sm text-center">
                    Are you sure you want to delete this account?
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button onClick={() => setShowDeleteConfirm(false)} className="w-1/2" variant="outline">
                      Cancel
                    </Button>
                    <Button onClick={handleDeleteAccount} className="w-1/2" variant="destructive">
                      Confirm Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col items-center gap-2 mb-4">
              {/* Avatar with Loading State */}
              {isProfileLoading ? (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <LoadingSpinner />
                </div>
              ) : userProfileInfo?.avatar?.image ? (
                <div className="w-16 h-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center mb-1">
                  <img
                    src={`data:image/svg+xml;base64,${userProfileInfo.avatar.image}`}
                    alt={userProfileInfo.avatar.name || "Avatar"}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[#00FF00] font-mono">Standart Wallet</span>
                  <div className="h-6 flex items-center justify-center mt-2">
                    {isProfileLoading ? (
                      <div className="w-40 h-4 bg-primary/10 rounded animate-pulse" />
                    ) : (
                      <span className="font-mono text-primary text-lg flex items-center gap-2">
                        {activeAccount?.publicKey
                          ? `${activeAccount.publicKey.slice(0, 12)}...${activeAccount.publicKey.slice(-10)}`
                          : ""}
                        <button
                          type="button"
                          className="cursor-pointer p-0 bg-transparent border-none"
                          title="Copy"
                          onClick={handleCopy}
                        >
                          {copied ? <Check size={18} className="text-primary" /> : <Copy size={18} className="text-primary" />}
                        </button>
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={handleCreateProfileClick}
                    className="text-[#FFA500] font-mono hover:underline cursor-pointer bg-transparent border-0 p-0"
                  >
                    Create profile to get Privasui features.
                  </button>
                </div>
              )}

              {/* Only show name and address if avatar exists */}
              {(isProfileLoading || userProfileInfo?.avatar?.image) && (
                <>
                  {/* Name with Loading State */}
                  <div className="h-6 flex items-center justify-center">
                    {isProfileLoading ? (
                      <div className="w-32 h-4 bg-primary/10 rounded animate-pulse" />
                    ) : (
                      <span className="font-mono text-primary text-lg">
                        {userProfileInfo?.avatar?.name || ""}
                      </span>
                    )}
                  </div>
                  <div className="h-6 flex items-center justify-center mt-2">
                    {isProfileLoading ? (
                      <div className="w-40 h-4 bg-primary/10 rounded animate-pulse" />
                    ) : (
                      <span className="font-mono text-primary text-lg flex items-center gap-2">
                        {activeAccount?.publicKey
                          ? `${activeAccount.publicKey.slice(0, 12)}...${activeAccount.publicKey.slice(-10)}`
                          : ""}
                        <button
                          type="button"
                          className="cursor-pointer p-0 bg-transparent border-none"
                          title="Copy"
                          onClick={handleCopy}
                        >
                          {copied ? <Check size={18} className="text-primary" /> : <Copy size={18} className="text-primary" />}
                        </button>
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons Section with padding */}
            <div className="w-full py-12">
              <div className="flex justify-center gap-8">
                <button 
                  className="flex flex-col items-center focus:outline-none group"
                  onClick={handleSendClick}
                >
                  <span className="bg-primary rounded-full p-3 flex items-center justify-center mb-1">
                    <Send size={28} className="text-black" />
                  </span>
                  <span className="text-primary font-mono text-xs group-hover:underline">Send</span>
                </button>
                <button 
                  className="flex flex-col items-center focus:outline-none group"
                  onClick={handleReceiveClick}
                >
                  <span className="bg-primary rounded-full p-3 flex items-center justify-center mb-1">
                    <ArrowDown size={28} className="text-black" />
                  </span>
                  <span className="text-primary font-mono text-xs group-hover:underline">Receive</span>
                </button>
                <button 
                  className="flex flex-col items-center focus:outline-none group"
                  onClick={handleHistoryClick}
                >
                  <span className="bg-primary rounded-full p-3 flex items-center justify-center mb-1">
                    <Clock size={28} className="text-black" />
                  </span>
                  <span className="text-primary font-mono text-xs group-hover:underline">History</span>
                </button>
                <button 
                  className="flex flex-col items-center focus:outline-none group"
                  onClick={handleMoreClick}
                >
                  <span className="bg-primary rounded-full p-3 flex items-center justify-center mb-1">
                    <Grid size={28} className="text-black" />
                  </span>
                  <span className="text-primary font-mono text-xs group-hover:underline">More</span>
                </button>
              </div>
            </div>

            {/* Tabs Section */}
            <div className="flex justify-start pl-4 gap-4">
              <button
                className={`font-mono text-base font-bold focus:outline-none ${activeTab === 'crypto' ? 'text-primary' : 'text-gray-400'}`}
                onClick={() => setActiveTab('crypto')}
              >
                Crypto
              </button>
              <button
                className={`font-mono text-base font-bold focus:outline-none ${activeTab === 'nft' ? 'text-primary' : 'text-gray-400'}`}
                onClick={() => setActiveTab('nft')}
              >
                NFT
              </button>
            </div>

            {/* Tab Content */}
            <div className="w-full">
              {activeTab === 'feed' ? (
                <AccountFeed address={activeAccount?.publicKey || ""} />
              ) : activeTab === 'crypto' ? (
                <AccountBalance address={activeAccount?.publicKey || ""} />
              ) : (
                <AccountNFT />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};