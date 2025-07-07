import React, { useState, useEffect } from 'react';
import { Tag, Clock, ExternalLink, DollarSign } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { cn } from "@/shared/utils";
import { usePinsNftImage, handlePinsImageError } from '../model/use-pins-nft-image';
import { PinsFallbackImage } from './pins-fallback-image';
import { isDevnet, isTestnet } from "@/shared/network-config";
// import { useSetPiNSPrice } from '@/widgets/pins/model/use-pins-price-management';
import { addToast } from '@/widgets/toast/model/use-toast';

interface PinsNftSellProps {
  nft: any;
  onClose?: () => void;
  onSuccess?: () => void;
}

export const PinsNftSell: React.FC<PinsNftSellProps> = ({ 
  nft,
  onSuccess: _onSuccess
}) => {
  const [price, setPrice] = useState("");
  const [sellError, setSellError] = useState("");
  const [sellSuccess, _setSellSuccess] = useState(false);
  
  // Price setting functionality temporarily disabled
  // const setPriceHook = useSetPiNSPrice();
  const isProcessing = false; // setPriceHook.isPending;

  // Extract NFT details
  const nftData = nft.data as any;
  const fields = nftData.content?.fields;
  const objectId = nftData.objectId;
  
  // Extract name from fields or display
  const name = fields && 'name' in fields ? String(fields.name) : '';
  const cleanName = name.replace('.pi', ''); // Remove .pi suffix for the transaction
  const piName = name.endsWith('.pi') ? name : `${name}.pi`;

  // Extract expiration date
  const expirationField = fields && 'expiration_date' in fields ? String(fields.expiration_date) : 'Lifetime';
  const expiration = expirationField === "Lifetime" ? "Never" : expirationField;

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
    "text-[#00ff00] font-mono text-base outline-none",
    "border-b border-[#00ff00]/20",
    "transition-colors focus:border-[#00ff00]",
    "text-base" // Ensure text is reasonably sized for mobile
  );

  // Handle close button click - temporarily disabled  
  // const _handleClose = () => {
  //   console.log("🔵 handleClose called in PinsNftSell");
  //   if (onClose) {
  //     console.log("🔵 Calling onClose from PinsNftSell");
  //     onClose();
  //   }
  // };

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
      
      // Price setting functionality temporarily disabled
      setSellError("Price setting functionality is temporarily disabled");
      addToast.error("Price setting functionality is temporarily disabled");
      // await setPriceHook.mutateAsync({ ... });
    } catch (error: any) {
      console.error("🔵 Failed to set price:", error);
      setSellError(error.message || "Failed to set price");
    }
  };

  return (
    <div className="flex flex-col w-full space-y-6 p-4">
      {/* NFT Display - Updated to match PinsNftItem height and layout */}
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
            
            {/* Expiration date with SuiVision link */}
            <div className="font-mono text-sm text-primary/70 truncate flex items-center gap-2 mt-1">
              {/* Expires with consistent gap */}
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-primary/50 flex-shrink-0" />
                <span>Expires: {expiration}</span>
              </div>
              
              {/* SuiVision Link - Inline with Expires */}
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
          
          {/* Empty space for layout consistency */}
          <div></div>
        </div>
      </div>

      <div className="h-20"></div>

      {/* Price Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-0 pl-3 flex items-center pointer-events-none">
            <DollarSign size={16} className="text-[#00ff00]/50" />
          </div>
          <input
            type="text"
            placeholder="Price in SUI"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              // Clear error when user starts typing again
              if (sellError) setSellError("");
            }}
            className={cn(
              inputClassName,
              "pl-10", // Add padding for the dollar sign
              sellError && "border-[#ff4d4d]" // Add red border if there's an error
            )}
            style={{ fontSize: '16px' }} // Prevent iOS zoom
          />
        </div>
        {sellError && (
          <p className="text-[#ff4d4d] text-sm mt-2 font-mono">{sellError}</p>
        )}
      </div>

      <div className="h-20"></div>

      {/* Set Price Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSetPrice}
          disabled={isProcessing}
          style={{
            backgroundColor: "rgba(0, 255, 0, 0.1)",
            color: isProcessing ? "rgba(255, 255, 255, 0.5)" : "#00ff00",
            border: "1px solid rgba(0, 255, 0, 0.5)",
            padding: "12px 24px",
            borderRadius: "8px",
            cursor: isProcessing ? "not-allowed" : "pointer",
            fontFamily: "monospace",
            fontSize: "16px",
            transition: "all 0.2s ease",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            opacity: isProcessing ? 0.6 : 1,
            width: "100%",
            height: "48px",
            boxShadow: "0 0 10px rgba(0, 255, 0, 0.2)"
          }}
          onMouseEnter={(e) => {
            if (!isProcessing) {
              e.currentTarget.style.backgroundColor = "rgba(0, 255, 0, 0.2)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0, 255, 0, 0.1)";
          }}
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner />
              <span className="text-[#00ff00]">Processing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Tag size={16} />
              <span>Set Price</span>
            </div>
          )}
        </button>
      </div>

      {/* Success message */}
      {sellSuccess && (
        <div className="mt-4 p-4 bg-[#00ff00]/10 border border-[#00ff00]/30 rounded-lg">
          <p className="text-[#00ff00] text-center font-mono">
            Price set successfully! Your NFT is now listed for sale.
          </p>
        </div>
      )}
    </div>
  );
}; 