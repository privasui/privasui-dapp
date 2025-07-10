// Reviewed
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Text, Heading, Flex } from "@radix-ui/themes";
import { Loader2, ArrowLeft } from "lucide-react";
import { useSuiClient } from "@mysten/dapp-kit";
import { RouteNames } from "@/routes";
import { TypeInput } from "@/components/type-input";
import { PrivasuiHeader } from "@/components/header";
import { LoadingSpinner } from "@/components/loading-spinner";
import { generateRandomUsername } from "@/shared/cryptography";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";
import { generateAvatar } from "@/shared/avatar";

import { useProfileQuery } from "@/widgets/profile/model/use-profile";
import { useCreateProfile } from "@/widgets/profile/model/use-create-profile";
import { useWalletAccountStore } from "@/widgets/profile/model/use-wallet-accounts";
import { addToast } from "@/widgets/toast/model/use-toast";
import { AccountHeader } from "@/widgets/header/ui/account-header";
import { fetchPriceConfig, isNameAvailable } from '@/shared/suipi';

export function CreateProfile() {
  console.log("🔍 [CreateProfile page] render");
  const suiClient = useSuiClient();
  const { activeAccount, isInitializing: isActiveAccountInitializing } = useWalletAccountStore();


  const {
    isLoading: isProfileLoading,
    isFetching: isProfileFetching,
    data: profile,
  } = useProfileQuery(activeAccount?.publicKey);

  const navigate = useNavigate();

  const {
    mutate: createProfile,
    isPending: isCreating,
    error: _profileError,
  } = useCreateProfile();

  const [generatedAvatar, setGeneratedAvatar] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [usernameError, setUsernameError] = useState<string>("");
  const [profilePrice, setProfilePrice] = useState<number>(0);
  const [lifetime, setLifetime] = useState(false); // false = Yearly, true = Lifetime
  const [priceConfig, setPriceConfig] = useState<any>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);

  console.log(
    "🔍 [CreateProfile page]  isProfileLoading, isProfileFetching, profile",
    isProfileLoading,
    isProfileFetching,
    profile,
  );

  // Set initial random username
  useEffect(() => {
    setUsername(generateRandomUsername());
    setGeneratedAvatar(generateAvatar());
  }, []);

  // Validation function
  const validateUsername = (name: string) => {
    if (name.length === 0) return "Username is required.";
    if (name.length > 64) return "Username must be at most 64 characters.";
    if (!/^[a-zA-Z0-9-]+$/.test(name)) return "Only a-z, A-Z, 0-9, and hyphens are allowed.";
    if (name.startsWith('-') || name.endsWith('-')) return "Hyphen cannot be at the start or end.";
    return "";
  };

  // Handle input change
  const handleUsernameChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = e.target.value;
    setUsername(value);
    setUsernameError(validateUsername(value));
  };

  // Handle profile creation
  const handleCreateProfile = () => {
    // Clear any previous errors
    addToast.dismissAll();

    const error = validateUsername(username);
    if (error) {
      setUsernameError(error);
      return;
    }

    if (!activeAccount || !activeAccount.privateKey) {
      addToast.error("No active account found");
      return;
    }

    try {
      // Base64 encode the SVG with proper handling of Unicode characters
      const base64Avatar = window.btoa(
        unescape(encodeURIComponent(generatedAvatar)),
      );

      createProfile({
        avatarSvg: base64Avatar,
        name: username.toLowerCase(), // Always send lowercase to backend
        lifetime,
        price: profilePrice,
        onComplete: () => {
          addToast.success("Profile created successfully!");
          navigate(`/${RouteNames.Accounts}`);
        },
        onError: (error) => {
          // Use the formatter to translate errors
          addToast.error(addToast.formatError(error));
        },
      });
    } catch (err) {
      console.error("Error in profile creation:", err);
      addToast.error("An error occurred while creating your profile");
    }
  };

  useEffect(() => {
    if (!activeAccount || !activeAccount.publicKey) return;
    if (!isProfileFetching && !isProfileLoading && profile) {
              navigate(`/${RouteNames.Pim}`);
      return;
    }
  }, [profile, activeAccount, isProfileLoading, isProfileFetching]);

  // Calculate price keys and prices
  const nameLen = username.length;
  let yearlyKey = "";
  let lifetimeKey = "";

  if (nameLen === 1) {
    yearlyKey = "p1_yearly";
    lifetimeKey = "p1_lifetime";
  } else if (nameLen === 2) {
    yearlyKey = "p2_yearly";
    lifetimeKey = "p2_lifetime";
  } else if (nameLen === 3) {
    yearlyKey = "p3_yearly";
    lifetimeKey = "p3_lifetime";
  } else if (nameLen === 4) {
    yearlyKey = "p4_yearly";
    lifetimeKey = "p4_lifetime";
  } else {
    yearlyKey = "p5_yearly";
    lifetimeKey = "p5_lifetime";
  }

  const yearlyPrice = priceConfig ? Number(priceConfig[yearlyKey] || 0) : 0;
  const lifetimePrice = priceConfig ? Number(priceConfig[lifetimeKey] || 0) : 0;

  // Update profilePrice when name, lifetime, or priceConfig changes
  useEffect(() => {
    setProfilePrice(lifetime ? lifetimePrice : yearlyPrice);
  }, [username, lifetime, priceConfig]);

  // Load priceConfig on mount
  useEffect(() => {
    async function fetchConfig() {
      if (!suiClient) return;
      try {
        const config = await fetchPriceConfig(suiClient as any);
        setPriceConfig(config);
      } catch (err) {
        console.error('Failed to load price config:', err);
        setPriceConfig(null);
      }
    }
    fetchConfig();
  }, [suiClient]);

  useEffect(() => {
    if (!username || usernameError) {
      setNameAvailable(null);
      return;
    }

    let cancelled = false;
    setIsCheckingName(true);

    const timeout = setTimeout(async () => {
      try {
        const result = await isNameAvailable(suiClient as any, username);
        if (!cancelled) {
          setNameAvailable(result);
        }
      } catch (err) {
        if (!cancelled) setNameAvailable(false);
      } finally {
        if (!cancelled) setIsCheckingName(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [username, usernameError, suiClient]);

  // Loading state
  if (isProfileLoading || isProfileFetching || isActiveAccountInitializing) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          width: "100%",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <PrivasuiHeader onClick={() => navigate(`/${RouteNames.Home}`)} />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
          }}
        >
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        maxWidth: "800px",
        margin: "0 auto",
        overflow: "hidden",
      }}
    >
      <AccountHeader />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "16px",
          overflow: "auto",
        }}
      >
        <Heading
          size="6"
          style={{
            color: "#00ff00",
            marginBottom: "24px",
            marginTop: "24px",
            textAlign: "center",
            fontFamily: "monospace",
          }}
        >
          Create profile
        </Heading>

        {/* Container for Yearly/Lifetime tags with fixed height to prevent layout shifts */}
        <div className="h-16 flex items-center justify-center">
          {!usernameError ? (
            <div className="flex bg-black border border-[#00ff00] rounded-full overflow-hidden">
              <ToggleGroup 
                type="single" 
                value={lifetime ? "lifetime" : "yearly"} 
                onValueChange={(value: string) => setLifetime(value === "lifetime")} 
                className="flex"
              >
                <ToggleGroupItem 
                  value="yearly" 
                  className="h-10 px-8 py-1 font-mono text-sm rounded-l-full rounded-r-none bg-black text-gray-500 hover:bg-black hover:text-white hover:cursor-pointer border-none data-[state=on]:bg-[#00ff0033] data-[state=on]:text-[#00ff00] data-[state=on]:font-bold data-[state=on]:text-base transition-all duration-200"
                >
                  Yearly
                </ToggleGroupItem>
                <div className="w-px bg-[#00ff00]"></div>
                <ToggleGroupItem 
                  value="lifetime" 
                  className="h-10 px-8 py-1 font-mono text-sm rounded-r-full rounded-l-none bg-black text-gray-500 hover:bg-black hover:text-white hover:cursor-pointer border-none data-[state=on]:bg-[#00ff0033] data-[state=on]:text-[#00ff00] data-[state=on]:font-bold data-[state=on]:text-base transition-all duration-200"
                >
                  Lifetime
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          ) : (
            <div className="h-10 w-[276px]"></div>
          )}
        </div>

        {/* Spacer */}
        <div className="h-8" />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            marginBottom: "24px",
          }}
        >
          {/* Avatar Display */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              border: "1px dashed #00ff00",
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <div
              style={{
                width: "96px",
                height: "96px",
                backgroundColor: "rgba(0, 255, 0, 0.1)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                margin: "16px auto 0",
                cursor: "pointer",
                userSelect: "none",
                WebkitUserSelect: "none",
                MozUserSelect: "none",
              }}
              className="md:w-[128px] md:h-[128px] md:mt-6"
              onClick={() => setGeneratedAvatar(generateAvatar())}
            >
              {generatedAvatar && (
                <div
                  dangerouslySetInnerHTML={{ __html: generatedAvatar }}
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>
            <Text
              size="1"
              style={{
                color: "#00ff00",
                fontFamily: "monospace",
                opacity: 0.8,
                marginTop: "4px",
                fontSize: "12px",
              }}
              className="md:text-sm"
            >
              Click to generate your avatar NFT
            </Text>
          </div>

          <div>
            <Text
              size="2"
              weight="medium"
              style={{
                color: "#00ff00",
                marginBottom: "8px",
                fontFamily: "monospace",
                fontSize: "16px",
              }}
            >
              Name (piNS  NFT)
            </Text>
            <div
              style={{
                marginTop: "8px",
              }}
            >
              <TypeInput
                inputProps={{
                  value: username,
                  onChange: handleUsernameChange,
                  placeholder: "Enter your name",
                }}
              />
              <div className="h-2" />
              <div className="mt-4 flex justify-between items-center">
                {/* Left side - Error/Checking messages */}
                <div className="font-mono text-sm" style={{ 
                  color: usernameError ? "red" : isCheckingName ? "#00ff00" : nameAvailable === false ? "red" : undefined 
                }}>
                  {usernameError
                    ? usernameError
                    : isCheckingName
                      ? "Checking ..."
                      : nameAvailable === false
                        ? "Name is not available"
                        : ""}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons with fixed position at bottom */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: "24px",
          }}
        >
          <Flex direction="column" gap="3">
            <button
              onClick={handleCreateProfile}
              disabled={isCreating || !priceConfig || !!usernameError || isCheckingName || nameAvailable === false}
              style={{
                backgroundColor: "black",
                color: "#00ff00",
                border: "1px solid #00ff00",
                padding: "12px 24px",
                borderRadius: "8px",
                width: "100%",
                cursor: !isCreating && priceConfig && !usernameError && nameAvailable !== false ? "pointer" : "not-allowed",
                fontFamily: "monospace",
                fontSize: "16px",
                transition: "all 0.2s ease",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                opacity: !!usernameError || nameAvailable === false ? 0.2 : 1,
                boxShadow: "0 0 10px rgba(0, 255, 0, 0.2)",
                height: "48px",
              }}
              onMouseEnter={(e) => {
                if (!isCreating && priceConfig && !usernameError) {
                  e.currentTarget.style.backgroundColor =
                    "rgba(0, 255, 0, 0.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isCreating && priceConfig && !usernameError) {
                  e.currentTarget.style.backgroundColor = "black";
                }
              }}
            >
              {isCreating ? (
                <Flex align="center" gap="2" justify="center">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Creating...</span>
                </Flex>
              ) : (
                usernameError || nameAvailable === false ? "Create profile" : `Create profile - ${(profilePrice / 1_000_000_000).toFixed(2)} SUI`
              )}
            </button>

            {/* Back button */}
            <button
              onClick={() => navigate(`/${RouteNames.Accounts}`)}
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.2)",
                color: "rgba(255, 255, 255, 0.9)",
                border: "1px solid rgba(0, 255, 0, 0.2)",
                borderRadius: "8px",
                padding: "12px 24px",
                cursor: "pointer",
                fontFamily: "monospace",
                fontSize: "16px",
                transition: "all 0.2s ease",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                height: "48px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 255, 0, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
              }}
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </Flex>
        </div>
      </div>
    </div>
  );
}
