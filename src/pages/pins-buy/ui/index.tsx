import { PageContainer } from "@/components/page-container";
import { PrivasuiHeader } from "@/components/header";
import { AccountButton } from "@/widgets/account/ui/account-button";
import { TypeInput } from "@/components/type-input";
import { useNavigate, useLocation } from "react-router";
import { RouteNames } from "@/routes";
import { useState, useEffect, useRef } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { getNameAddress, fetchPriceConfig, getNameExpiration, calculateNamePrice, getPiNSNameValidationError } from "@/shared/suipi";

// Import widget components
import { PinsAvailable } from "@/widgets/pins/ui/pins-available";
import { PinsNotAvailable } from "@/widgets/pins/ui/pins-not-available";
import { PinsMyNfts } from "@/widgets/pins/ui/pins-my-nfts";

export const PiNSBuyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const suiClient = useSuiClient();
  const [searchName, setSearchName] = useState("");
  const [isCheckingPiNS, setIsCheckingPiNS] = useState(false);
  const [piNSError, setPiNSError] = useState<string | null>(null);
  const [piNSAddress, setPiNSAddress] = useState<string | null>(null);
  const [showBuyButton, setShowBuyButton] = useState(false);
  const [isEmptyInput, setIsEmptyInput] = useState(true);
  const [lifetime, setLifetime] = useState(false); // false = Yearly, true = Lifetime
  const [priceConfig, setPriceConfig] = useState<any>(null);
  const [profilePrice, setProfilePrice] = useState<number>(0);
  const [expirationDate, setExpirationDate] = useState<string | null>(null);
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);
  const [lastMessage, setLastMessage] = useState<string>("");
  const refreshNftsRef = useRef<(() => void) | null>(null);

  // Extract name from URL query params
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const nameParam = queryParams.get("name");
    if (nameParam) {
      setSearchName(nameParam);
    }
  }, [location.search]);

  // Track if input is empty
  useEffect(() => {
    setIsEmptyInput(!searchName || searchName.trim() === "");
  }, [searchName]);

  // Immediately clear results when input changes to prevent showing stale data
  useEffect(() => {
    if (searchName && searchName.trim() !== "") {
      // Clear previous results immediately to avoid showing mismatched data
      setPiNSAddress(null);
      setShowBuyButton(false);
      setExpirationDate(null);
      // Don't clear piNSError here as validation errors should show immediately
    }
  }, [searchName]);



  // Load priceConfig on mount
  useEffect(() => {
    async function loadPriceConfig() {
      if (!suiClient) return;
      try {
        const config = await fetchPriceConfig(suiClient as any);
        setPriceConfig(config);
      } catch (err) {
        console.error('Failed to load price config:', err);
        setPriceConfig(null);
      }
    }
    loadPriceConfig();
  }, [suiClient]);

  // Check piNS name availability when search name changes
  useEffect(() => {
    let isValidationCancelled = false;
    
    const checkPiNSName = async () => {
      // Capture the current search name at the start of validation
      const currentSearchName = searchName;
      
      // Skip empty input
      if (!currentSearchName || currentSearchName.trim() === "") {
        setPiNSError(null);
        setPiNSAddress(null);
        setShowBuyButton(false);
        setExpirationDate(null);
        return;
      }

      // Validate the raw input first (before cleaning)
      const validationError = getPiNSNameValidationError(currentSearchName.trim());
      if (validationError) {
        // Check if validation was cancelled
        if (isValidationCancelled) return;
        
        setPiNSError(validationError);
        setLastMessage(validationError);
        setLastMessageTime(Date.now());
        setPiNSAddress(null);
        setShowBuyButton(false);
        setExpirationDate(null);
        return;
      }
      
      // Use the clean name directly (no extraction needed since we only accept pure names)
      const cleanName = currentSearchName.trim();
      
      // Check if the minimum display time has passed for the previous message
      const currentTime = Date.now();
      const timeSinceLastMessage = currentTime - lastMessageTime;
      const minDisplayTime = 2000; // 2 seconds minimum display time
      
      if (timeSinceLastMessage < minDisplayTime && lastMessage !== "") {
        // Wait until the minimum display time has passed
        const timeToWait = minDisplayTime - timeSinceLastMessage;
        await new Promise(resolve => setTimeout(resolve, timeToWait));
        
        // Check if validation was cancelled during delay
        if (isValidationCancelled) return;
        
        // Re-validate after delay in case user typed more characters
        const currentValidationError = getPiNSNameValidationError(searchName.trim());
        if (currentValidationError) {
          setPiNSError(currentValidationError);
          setLastMessage(currentValidationError);
          setLastMessageTime(Date.now());
          setPiNSAddress(null);
          setShowBuyButton(false);
          setExpirationDate(null);
          return;
        }
      }
      
      setIsCheckingPiNS(true);
      setPiNSError(null);
      setLastMessage("");
      
      try {
        // Check if name exists
        const address = await getNameAddress(suiClient as any, cleanName);
        
        // Check if validation was cancelled
        if (isValidationCancelled) return;
        
        if (address) {
          // Name exists, set the address
          setPiNSAddress(address);
          // Don't show error message as we'll show a panel instead
          setPiNSError("");
          setShowBuyButton(false);
          
          // Get expiration date if available
          try {
            const expiration = await getNameExpiration(suiClient as any, cleanName);
            
            // Check if validation was cancelled during expiration fetch
            if (isValidationCancelled) return;
            
            if (expiration) {
              // Format the date - timestamp is already in milliseconds
              const expirationDate = new Date(Number(expiration));
              const formattedDate = expirationDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
              setExpirationDate(formattedDate);
            } else {
              // If no expiration (lifetime registration)
              setExpirationDate("Lifetime registration");
            }
          } catch (error) {
            console.error("Error fetching expiration:", error);
            // Check if validation was cancelled during expiration error
            if (isValidationCancelled) return;
            setExpirationDate(null);
          }
        } else {
          // Name doesn't exist, show buy option
          setPiNSAddress(null);
          // Don't show error message as we'll show a panel instead
          setPiNSError("");
          setShowBuyButton(true);
          setExpirationDate(null);
        }
      } catch (error) {
        console.error("Error checking piNS name:", error);
        // Check if validation was cancelled
        if (isValidationCancelled) return;
        setPiNSError("Error checking availability");
        setShowBuyButton(false);
      } finally {
        setIsCheckingPiNS(false);
      }
    };

    // Use debounce to avoid too many requests
    const timeoutId = setTimeout(() => {
      checkPiNSName();
    }, 400);

    return () => {
      clearTimeout(timeoutId);
      isValidationCancelled = true; // Cancel any ongoing validation
    };
  }, [searchName, suiClient]);

  // Calculate price using shared utility
  useEffect(() => {
    if (!priceConfig || !searchName) return;
    
    // Use name directly and calculate price (no extraction needed)
    const cleanName = searchName.trim();
    const price = calculateNamePrice(priceConfig, cleanName, lifetime);
    
    setProfilePrice(price);
  }, [searchName, lifetime, priceConfig]);

// Removed handleBuyName since PinsAvailable now handles registration internally

  const handleChatWithOwner = () => {
    if (piNSAddress) {
      navigate(`/pim/${piNSAddress}`);
    }
  };

  const handleRegistrationSuccess = async () => {
    console.log("🎉 [Registration] Success handler called");
    
    // Clear the search input after successful registration
    setSearchName("");
    
    // Add a longer delay to ensure:
    // 1. Transaction is fully confirmed on blockchain
    // 2. Cache invalidation has taken effect  
    // 3. Blockchain state has propagated to all nodes
    console.log("⏳ [Registration] Waiting for blockchain state to propagate...");
    await new Promise(resolve => setTimeout(resolve, 2000)); // Increased to 2 seconds
    
    // Refresh the NFT list after successful registration
    if (refreshNftsRef.current) {
      try {
        console.log("🔄 [Registration] Refreshing MyPins list...");
        await refreshNftsRef.current();
        console.log("✅ [Registration] MyPins list refreshed successfully");
      } catch (error) {
        console.error('❌ [Registration] Error calling refreshNfts:', error);
        // Add a toast to inform user of the issue
        // addToast.error("Failed to refresh list. Please refresh the page.");
      }
    } else {
      console.warn('⚠️ [Registration] refreshNfts function not available yet, trying again in 1000ms');
      // Retry after a longer delay to allow the component to initialize
      setTimeout(async () => {
        if (refreshNftsRef.current) {
          try {
            console.log("🔄 [Registration] Refreshing MyPins list (delayed)...");
            await refreshNftsRef.current();
            console.log("✅ [Registration] MyPins list refreshed successfully (delayed)");
          } catch (error) {
            console.error('❌ [Registration] Error calling refreshNfts (delayed):', error);
            // Add a toast to inform user of the issue
            // addToast.error("Failed to refresh list. Please refresh the page.");
          }
        } else {
          console.error('❌ [Registration] refreshNfts function still not available after retry');
        }
      }, 1000); // Increased retry delay
    }
  };

  return (
    <PageContainer
      header={
        <PrivasuiHeader 
          onClick={() => navigate(`/${RouteNames.Home}`)} 
          title="Privasui / piNS"
        >
          <AccountButton />
        </PrivasuiHeader>
      }
    >
      <div className="flex flex-col w-full h-[1000px] flex-1 my-0 mx-auto overflow-hidden gap-5">
        {/* Search bar */}
        <div className="w-full">
          <TypeInput
            inputProps={{
              value: searchName,
              onChange: (e) => setSearchName(e.target.value),
              placeholder: "Enter piNS name (e.g. elon, john-doe, crypto123)",
              autoComplete: "off",
              name: "pins-search-input",
              type: "text",
              className: "text-base sm:text-lg",
            }}
          />
        </div>
        
        {/* Combined status panels and piNS names section */}
        <div className="flex flex-col flex-1">
          {/* Status Cards container with fixed height to prevent layout shifts */}
          <div className="w-full h-[350px] relative">
            <div className={`w-full h-full transition-opacity duration-300 ${isCheckingPiNS ? 'opacity-50' : 'opacity-100'}`}>
              {(!isEmptyInput && !isCheckingPiNS && (showBuyButton || (piNSAddress && piNSAddress !== "suggestion"))) ? (
                <div className="w-full space-y-6 pb-12">
                  {/* Available to Buy Card - Using PinsAvailable widget */}
                  {showBuyButton && (
                    <PinsAvailable 
                      searchName={searchName}
                      lifetime={lifetime}
                      setLifetime={setLifetime}
                      profilePrice={profilePrice}
                      priceConfig={priceConfig}
                      onRegistrationSuccess={handleRegistrationSuccess}
                    />
                  )}
                  
                  {/* Already Registered Card - Using PinsNotAvailable widget */}
                  {piNSAddress && piNSAddress !== "suggestion" && (
                    <PinsNotAvailable 
                      searchName={searchName}
                      piNSAddress={piNSAddress}
                      expirationDate={expirationDate}
                      onChat={handleChatWithOwner}
                    />
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center border border-dashed border-[#00ff00]/30 rounded-xl">
                  <div className="text-center font-mono max-w-md px-6">
                    {isCheckingPiNS ? (
                      // Empty placeholder during checking - spinner will be shown as overlay
                      <div className="opacity-0">
                        <div className="text-4xl pb-8">⏳</div>
                        <p className="text-lg">Checking piNS availability ...</p>
                        <p className="text-sm pt-4">This might take a moment</p>
                      </div>
                    ) : piNSError ? (
                      <div className="text-center w-full max-w-2xl mx-auto">
                        <div className="text-5xl pb-6 text-red-400">
                          {piNSError.includes('@') ? '@' : 
                           piNSError.includes('Invalid character|') ? 
                           piNSError.split('|')[1] || '?' : '-'}
                        </div>
                        <p className="text-red-400 text-xl font-medium mb-6 pb-4">
                          {piNSError.includes('Invalid character|') ? 'Invalid character' : piNSError}
                        </p>
                        <p className="text-[#00ff00]/80 text-base font-mono mb-4 pb-2 pt-2">
                          💡 Use letters, numbers, and hyphens only
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center pt-2">
                          <span className="px-3 py-2 bg-[#00ff00]/10 text-[#00ff00]/70 rounded-lg text-sm font-mono border border-[#00ff00]/20">alice</span>
                          <span className="px-3 py-2 bg-[#00ff00]/10 text-[#00ff00]/70 rounded-lg text-sm font-mono border border-[#00ff00]/20">bob-x</span>
                          <span className="px-3 py-2 bg-[#00ff00]/10 text-[#00ff00]/70 rounded-lg text-sm font-mono border border-[#00ff00]/20">web3</span>
                        </div>
                      </div>
                    ) : searchName && searchName.length > 0 ? (
                      <>
                        <div className="text-4xl pb-8 text-yellow-400">✏️</div>
                        <p className="text-yellow-400 text-lg mb-4 pb-2">Keep typing your piNS name</p>
                        <div className="flex flex-wrap gap-3 justify-center pt-2">
                          <span className="px-3 py-2 bg-[#00ff00]/10 text-[#00ff00]/70 rounded-lg text-sm font-mono border border-[#00ff00]/20">alice</span>
                          <span className="px-3 py-2 bg-[#00ff00]/10 text-[#00ff00]/70 rounded-lg text-sm font-mono border border-[#00ff00]/20">bob-x</span>
                          <span className="px-3 py-2 bg-[#00ff00]/10 text-[#00ff00]/70 rounded-lg text-sm font-mono border border-[#00ff00]/20">web3</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-5xl pb-8 text-[#00ff00]/60">💎</div>
                        <p className="text-[#00ff00]/60 text-2xl font-medium mb-2">Search for a piNS name</p>
                        <p className="text-[#00ff00]/80 text-base font-mono mb-4 pb-2 pt-4">
                          💡 Use letters, numbers, and hyphens only
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center pt-2">
                          <span className="px-3 py-2 bg-[#00ff00]/10 text-[#00ff00]/70 rounded-lg text-sm font-mono border border-[#00ff00]/20">alice</span>
                          <span className="px-3 py-2 bg-[#00ff00]/10 text-[#00ff00]/70 rounded-lg text-sm font-mono border border-[#00ff00]/20">bob-x</span>
                          <span className="px-3 py-2 bg-[#00ff00]/10 text-[#00ff00]/70 rounded-lg text-sm font-mono border border-[#00ff00]/20">web3</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Absolute positioned loading overlay */}
            {isCheckingPiNS && (
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none -translate-y-8">
                <div className="flex flex-col items-center">
                  <p className="text-[#00ff00] font-mono text-xl font-bold tracking-wider uppercase text-shadow-glow mb-6 pb-4">
                    Checking piNS availability
                  </p>
                  <div className="flex gap-2">
                    <div className="w-4 h-4 bg-[#00ff00] animate-pulse" style={{animationDelay: '0ms'}}></div>
                    <div className="w-4 h-4 bg-[#00ff00] animate-pulse" style={{animationDelay: '200ms'}}></div>
                    <div className="w-4 h-4 bg-[#00ff00] animate-pulse" style={{animationDelay: '400ms'}}></div>
                    <div className="w-4 h-4 bg-[#00ff00] animate-pulse" style={{animationDelay: '600ms'}}></div>
                    <div className="w-4 h-4 bg-[#00ff00] animate-pulse" style={{animationDelay: '800ms'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Your piNS Names section - Using PinsMyNfts widget */}
          <PinsMyNfts 
            showSendButton={true}
            showSuiVision={true}
            title="My piNS"
            onRefresh={(fn) => { refreshNftsRef.current = fn; }}
          />
        </div>
      </div>
    </PageContainer>
  );
};