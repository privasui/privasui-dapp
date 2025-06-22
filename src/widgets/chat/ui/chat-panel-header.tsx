import { useProfilesStore } from "@/widgets/profile/model/use-profile-store";
import { useWalletAccountStore } from "@/widgets/profile/model/use-wallet-accounts";
import { useSuiClient } from "@mysten/dapp-kit";
import { Box, Flex, Text } from "@radix-ui/themes";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { AccountButton } from "@/widgets/account/ui/account-button";
import { fetchUserProfileInfo, ProfileInfo } from "@/shared/suipi";

interface ChatPanelHeaderProps {
  recipientAddress: string;
  onBackClick: () => void;
}
export const ChatPanelHeader = ({
  recipientAddress,
  onBackClick,
}: ChatPanelHeaderProps) => {
  const [_balance, setBalance] = useState(0);
  const { activeAccount } = useWalletAccountStore();
  const suiClient = useSuiClient();
  const recipientProfile = useProfilesStore((state) =>
    state.getProfile(recipientAddress),
  );
  const { addProfile } = useProfilesStore();
  const [isLoadingProfile, setIsLoadingProfile] = useState(!recipientProfile);
  const [copied, setCopied] = useState(false);

  const handleBackClick = () => {
    onBackClick && onBackClick();
  };

  const handleCopyAddress = async () => {
    let copySuccessful = false;

    // First try the Clipboard API (modern browsers)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(recipientAddress);
        copySuccessful = true;
      } catch (err) {
        console.error("Clipboard API failed:", err);
        // Continue to fallback if this fails
      }
    }

    // If Clipboard API failed, try iOS / Safari specific approach
    if (!copySuccessful) {
      try {
        const el = document.createElement("div");
        el.contentEditable = "true";
        el.style.position = "absolute";
        el.style.left = "-9999px";
        // Need to add to the DOM for iOS
        document.body.appendChild(el);

        // Set content and select
        el.innerHTML = recipientAddress;
        const range = document.createRange();
        range.selectNodeContents(el);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);

        // Set as non-editable to avoid keyboard
        el.contentEditable = "false";

        // Copy
        copySuccessful = document.execCommand("copy");

        // Clean up
        document.body.removeChild(el);
      } catch (err) {
        console.error("iOS-specific approach failed:", err);
        // Continue to next fallback
      }
    }

    // If still not successful, try standard fallback
    if (!copySuccessful) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = recipientAddress;

        // Make it minimally intrusive
        textarea.style.cssText = "position:fixed;top:0;left:0;opacity:0;";
        textarea.setAttribute("readonly", ""); // Prevents keyboard on some devices

        document.body.appendChild(textarea);

        // Handle iOS devices specifically
        if (navigator.userAgent.match(/ipad|iphone/i)) {
          textarea.style.fontSize = "16px"; // Prevents zoom on iOS
          textarea.style.backgroundColor = "transparent";

          // iOS requires a more specific selection approach
          const range = document.createRange();
          range.selectNodeContents(textarea);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
          textarea.setSelectionRange(0, recipientAddress.length); // For iOS
        } else {
          // For most other devices
          textarea.select();
        }

        copySuccessful = document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch (err) {
        console.error("Standard fallback failed:", err);
      }
    }

    // Show copied state
    setCopied(copySuccessful);

    // Reset after 3 seconds
    setTimeout(() => {
      setCopied(false);
    }, 5000);
  };

  // Check if user has an account
  useEffect(() => {
    if (!activeAccount || !activeAccount.publicKey) {
      return;
    }

    const checkAccountBalance = async () => {
      if (activeAccount?.publicKey) {
        const balance = await suiClient.getBalance({
          owner: activeAccount?.publicKey,
          coinType: "0x2::sui::SUI",
        });

        setBalance(parseInt(balance.totalBalance));
      }
    };

    checkAccountBalance();
  }, [activeAccount]);

  // Fetch recipient profile if not in store
  useEffect(() => {
    if (recipientProfile) {
      return; // Already have profile data
    }

    const fetchRecipientProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const profile: ProfileInfo | null = await fetchUserProfileInfo(
          suiClient as any,
          recipientAddress,
        );

        if (!profile) {
          setIsLoadingProfile(false);
          return;
        }

        const avatarData = profile.avatar?.image;

        // TODO::AVAR: what if avatar is not found

        // Cache the profile data in the store
        addProfile(recipientAddress, {
          name: profile.name,
          avatarSvgUrl: avatarData
            ? `data:image/svg+xml;base64,${avatarData}`
            : undefined,
        });

      } catch (error) {
        console.error("Error fetching recipient profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchRecipientProfile();
  }, [recipientAddress, recipientProfile]);

  const truncatedAddress = `${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`;

  return (
    <Box
      style={{
        width: "100%",
        top: 0,
      }}
    >
      <Flex
        px="3"
        py="2"
        justify="between"
        align="center"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
        }}
      >
        <Box
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <ArrowLeft
            size={16}
            onClick={handleBackClick}
            style={{
              color: "#00ff00",
              cursor: "pointer",
            }}
          />

          {/* Profile Avatar - Smaller size */}
          {isLoadingProfile ? (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                backgroundColor: "rgba(0, 255, 0, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                className="animate-spin"
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  borderTop: "2px solid #00ff00",
                  borderRight: "2px solid transparent",
                }}
              />
            </div>
          ) : recipientProfile?.avatarSvgUrl ? (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                overflow: "hidden",
                backgroundColor: "rgba(0, 255, 0, 0.1)",
              }}
            >
              <img
                src={recipientProfile.avatarSvgUrl}
                alt={`${recipientProfile.name || recipientAddress}'s avatar`}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
          ) : (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                backgroundColor: "rgba(0, 255, 0, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#00ff00",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              {recipientAddress.charAt(0).toUpperCase()}
            </div>
          )}

          <Box
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: "calc(100% - 80px)", // Ensure text doesn't overflow
              overflow: "hidden",
              cursor: "pointer",
            }}
            onClick={handleCopyAddress}
          >
            <Text
              style={{
                color: "#00ff00",
                fontWeight: "bold",
                fontSize: "14px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {recipientProfile?.name || truncatedAddress}
            </Text>
            <Flex align="center" gap="1" style={{ cursor: "pointer" }}>
              {copied ? (
                <Check size={12} color="#00ff00" />
              ) : (
                <Copy size={12} color="#00ff00" />
              )}
              <Text
                style={{
                  color: "#00ff00",
                  fontSize: "0.7rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {copied ? "Address Copied" : truncatedAddress}
              </Text>
            </Flex>
          </Box>
        </Box>
        <Box
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <AccountButton />
        </Box>
      </Flex>
    </Box>
  );
};
