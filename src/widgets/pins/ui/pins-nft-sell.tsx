import React, { useState, useEffect } from 'react';
import { Tag, Clock, ExternalLink, DollarSign, ShoppingCart, Ban, Trash2, Check } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { cn } from "@/shared/utils";
import { usePinsNftImage, handlePinsImageError } from '../model/use-pins-nft-image';
import { PinsFallbackImage } from './pins-fallback-image';
import { isDevnet, isTestnet } from "@/shared/network-config";
import { getPiNamePrice, getNameExpiration } from '@/shared/suipi';
import type { SuiClient } from "@mysten/sui/client";
import { useSuiClient } from "@mysten/dapp-kit";
import { addToast } from '@/widgets/toast/model/use-toast';
import { usePiNamePriceManagement } from '../model/use-pins-price-management';

// Helper function to format expiration date
const formatExpirationDate = (expirationMs: string | null): string => {
  if (!expirationMs) return "Unknown";
  if (expirationMs === "0") return "Never";
  
  const expDate = new Date(parseInt(expirationMs));
  return expDate.toLocaleDateString();
};

interface PinsNftSellProps {
  nft: any;
  onClose?: () => void;
  onSuccess?: () => void;
}

export const PinsNftSell: React.FC<PinsNftSellProps> = ({ 
  nft,
  onClose,
  onSuccess
}) => {
  const suiClient = useSuiClient();
  const [price, setPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sellError, setSellError] = useState("");
  const [sellSuccess, setSellSuccess] = useState(false);
  const [expiration, setExpiration] = useState<string>("Loading...");
  const { setPrice: setPriceHook, unsetPrice } = usePiNamePriceManagement();
  
  // Extract NFT details
  const nftData = nft.data as any;
  const fields = nftData.content?.fields;
  const objectId = nftData.objectId;
  
  // Extract name from fields or display
  const name = fields && 'name' in fields ? String(fields.name) : '';
  const cleanName = name.replace('.pi', ''); // Remove .pi suffix for the transaction
  const piName = name.endsWith('.pi') ? name : `${name}.pi`;

  // Fetch current price and expiration on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch price
        const price = await getPiNamePrice(suiClient, cleanName);
        console.log(`💰 [PiNS] Current price for ${cleanName}:`, price);
        setCurrentPrice(price);
        if (price) {
          setPrice(price); // Pre-fill the input with current price
        }

        // Fetch expiration
        const expirationMs = await getNameExpiration(suiClient as unknown as SuiClient, cleanName);
        const formattedExpiration = formatExpirationDate(expirationMs);
        setExpiration(formattedExpiration);
        
      } catch (error) {
        console.error(`❌ [PiNS] Error fetching data for ${cleanName}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    if (cleanName) {
      fetchData();
    }
  }, [cleanName, suiClient]);

  // Use the image utility to get consistent image handling
  const { finalImageUrl, hasImage } = usePinsNftImage(nft);

  // Add effect to prevent zoom on mobile
  useEffect(() => {
    // Add meta viewport tag to prevent zooming
    const originalViewport = document.querySelector('meta[name="viewport"]')?.getAttribute('content');
    
    // Set viewport to prevent zooming
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1');
    }
    
    // Restore original meta viewport on cleanup
    return () => {
      if (originalViewport && metaViewport) {
        metaViewport.setAttribute('content', originalViewport);
      }
    };
  }, []);

  const inputClassName = cn(
    "w-full px-3 py-2 bg-transparent",
    "text-[#00ff00] font-mono text-lg outline-none",
    "border-b border-[#00ff00]/20",
    "transition-colors focus:border-[#00ff00]",
    sellError && "border-[#ff4d4d]"
  );

  // Validate price format (positive number with up to 9 decimal places)
  const isValidPrice = (price: string): boolean => {
    const priceRegex = /^(?!0\d)\d*(\.\d{1,9})?$/;
    return priceRegex.test(price) && parseFloat(price) > 0;
  };

  const handleSetPrice = async () => {
    // Enhanced validation for price
    if (!price.trim()) {
      setSellError("Please enter a price");
      return;
    }

    // Check if price is valid
    if (!isValidPrice(price)) {
      setSellError("Invalid price format");
      return;
    }

    try {
      console.log(`🔄 Setting price for ${cleanName}: ${price} SUI`);
      
      await setPriceHook.mutateAsync({
        name: cleanName,
        price: parseFloat(price),
        onComplete: async () => {
          setSellSuccess(true);
          addToast.success(`Successfully set price for ${piName}`);
          
          // Wait for refresh to complete before closing
          if (onSuccess) {
            try {
              await onSuccess();
              // Only close after refresh is complete
              if (onClose) {
                onClose();
              }
            } catch (error) {
              console.error("Failed to refresh after setting price:", error);
              // Still close the dialog even if refresh fails
              if (onClose) {
                onClose();
              }
            }
          } else if (onClose) {
            onClose();
          }
        },
        onError: (error: Error) => {
          setSellError(error.message);
          addToast.error(`Failed to set price: ${error.message}`);
        }
      });
    } catch (error: any) {
      console.error("🔵 Failed to set price:", error);
      setSellError(error.message || "Failed to set price");
    }
  };

  const handleUnsetPrice = async () => {
    try {
      console.log(`🔄 Removing price for ${cleanName}`);
      
      await unsetPrice.mutateAsync({
        name: cleanName,
        onComplete: async () => {
          setSellSuccess(true);
          addToast.success(`Successfully removed price for ${piName}`);
          
          // Wait for refresh to complete before closing
          if (onSuccess) {
            try {
              await onSuccess();
              // Only close after refresh is complete
              if (onClose) {
                onClose();
              }
            } catch (error) {
              console.error("Failed to refresh after removing price:", error);
              // Still close the dialog even if refresh fails
              if (onClose) {
                onClose();
              }
            }
          } else if (onClose) {
            onClose();
          }
        },
        onError: (error: Error) => {
          setSellError(error.message);
          addToast.error(`Failed to remove price: ${error.message}`);
        }
      });
    } catch (error: any) {
      console.error("🔵 Failed to remove price:", error);
      setSellError(error.message || "Failed to remove price");
    }
  };

  // Separate loading states
  const isSettingPrice = setPriceHook.isPending;
  const isRemovingPrice = unsetPrice.isPending;
  const isProcessing = isSettingPrice || isRemovingPrice;

  // Function to render price status with appropriate icon
  const renderPriceStatus = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <LoadingSpinner />
          <span>Loading price...</span>
        </div>
      );
    }

    if (currentPrice) {
      return (
        <div className="flex items-center gap-2 text-[#00ff00]">
          <ShoppingCart size={12} className="text-[#00ff00]" />
          <span>{currentPrice} SUI</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-primary/50">
        <Ban size={12} />
        <span>Not listed for sale</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full space-y-6 p-4">
      {/* NFT Display */}
      <div className="w-full rounded-2xl overflow-hidden border border-primary/15 p-0 bg-black/50">
        <div className="grid grid-cols-[48px_1fr_auto] gap-4 items-center h-20 w-full px-4">
          {/* NFT Image */}
          <div className="flex-shrink-0 w-12 h-12 bg-[#222] overflow-hidden flex items-center justify-center">
            {hasImage ? (
              <img 
                src={finalImageUrl} 
                alt={piName}
                className="w-full h-full object-contain"
                onError={handlePinsImageError}
              />
            ) : (
              <PinsFallbackImage />
            )}
          </div>
          
          {/* NFT Info */}
          <div className="flex flex-col justify-center min-w-0">
            <div className="font-mono text-lg font-bold text-primary truncate">
              {piName}
            </div>
            
            {/* Price Status with SuiVision link */}
            <div className="font-mono text-sm text-primary/70 truncate flex items-center gap-2 mt-1">
              {/* Price Status */}
              <div className="flex items-center gap-2">
                {renderPriceStatus()}
              </div>
              
              {/* SuiVision Link - Inline with Status */}
              <a
                href={`https://${isDevnet() ? 'devnet.' : isTestnet() ? 'testnet.' : ''}suivision.xyz/object/${objectId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-[#00ff00]/70 hover:text-[#00ff00] flex items-center gap-2 ml-2 transition-colors"
                title={objectId}
              >
                <ExternalLink size={12} className="text-primary/50 flex-shrink-0" />
                <span>SuiVision</span>
              </a>
            </div>
          </div>
          
          {/* Empty space for consistency */}
          <div></div>
        </div>
      </div>

      <div className="h-20"></div>

      {/* Price Input and Buttons */}
      <div className="space-y-4">
        {/* Price Input */}
        <div className="relative">
          <input
            type="text"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              setSellError("");
            }}
            placeholder="Enter price in SUI"
            className={inputClassName}
            disabled={isProcessing}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00ff00]/50 font-mono">
            SUI
          </div>
        </div>

        <div className="h-20"></div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-6">
          {/* Set Price Button */}
          <button
            onClick={handleSetPrice}
            disabled={isSettingPrice}
            style={{
              backgroundColor: "rgba(0, 255, 0, 0.1)",
              color: "#00ff00",
              border: "1px solid rgba(0, 255, 0, 0.5)",
              padding: "12px 24px",
              borderRadius: "8px",
              cursor: isSettingPrice ? "not-allowed" : "pointer",
              fontFamily: "monospace",
              fontSize: "16px",
              transition: "all 0.2s ease",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              opacity: isSettingPrice ? 0.7 : 1,
              width: "100%"
            }}
          >
            {isSettingPrice ? (
              <>
                <LoadingSpinner className="text-[#00ff00]" />
                <span style={{ marginLeft: "8px" }}>Setting Price...</span>
              </>
            ) : (
              <span className="text-[#00ff00]">Set New Price</span>
            )}
          </button>

          {/* Remove Price Link */}
          {currentPrice && (
            <button
              onClick={handleUnsetPrice}
              disabled={isRemovingPrice}
              className="flex items-center justify-center gap-2 text-[#ff4d4d] hover:text-[#ff6b6b] font-mono transition-colors hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRemovingPrice ? (
                <>
                  <LoadingSpinner className="text-red-500" />
                  <span>Removing Price...</span>
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  <span>Remove Price</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Error Messages */}
        {sellError && (
          <div className="text-[#ff4d4d] text-sm text-center mt-4">
            {sellError}
          </div>
        )}
      </div>

      <div className="h-4"></div>

      {/* Success Messages */}
      {sellSuccess && (
        <div className="text-[#00ff00] text-sm text-center mt-4">
          Transaction successful!
        </div>
      )}
    </div>
  );
}; 