import React, { useState, useEffect } from 'react';
import { Send, Clock, ExternalLink } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { cn } from "@/shared/utils";
import { useNftTransfer } from '../model/use-nft-transfer';
import { usePinsNftImage, handlePinsImageError } from '../model/use-pins-nft-image';
import { PinsFallbackImage } from './pins-fallback-image';
import { isDevnet, isTestnet } from "@/shared/network-config";
import { getNameExpiration } from "@/shared/suipi";
import { useSuiClient } from "@mysten/dapp-kit";
import type { SuiClient } from "@mysten/sui/client";
// import { PiNSNftData } from '../model/use-pins-batch-data';

const formatExpirationDate = (timestamp: string | null): string => {
  if (!timestamp) return "Never";
  
  try {
    // Convert to number and handle as milliseconds
    const expMs = Number(timestamp);
    if (isNaN(expMs)) {
      console.warn("[PiNS] Invalid timestamp:", timestamp);
      return "Invalid Date";
    }

    console.log(`[PiNS Debug] Formatting expiration:`, {
      raw_timestamp: timestamp,
      parsed_ms: expMs,
      as_date: new Date(expMs).toISOString()
    });
    
    const date = new Date(expMs); // Use milliseconds directly
    if (isNaN(date.getTime())) return "Invalid Date";
    
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days <= 0) return "Expired";
    if (days === 1) return "Tomorrow";
    if (days < 30) return `in ${days} days`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('[PiNS] Error formatting expiration date:', error);
    return "Unknown";
  }
};

interface PinsNftSendProps {
  nft: any; // Handle both PiNSNftData and raw nft data
  onClose?: () => void;
  onSuccess?: () => void;
}

export const PinsNftSend: React.FC<PinsNftSendProps> = ({ 
  nft, 
  onClose,
  onSuccess
}) => {
  const { mutateAsync: sendNft } = useNftTransfer();
  const suiClient = useSuiClient();
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState(false);
  const [expiration, setExpiration] = useState<string>("Loading...");

  // Handle both PiNSNftData structure and raw nft data structure
  let nftData: any;
  let fields: any;
  let objectId: string;
  let extractedName: string;
  
  console.log("🔍 [NFT Transfer] Received nft data:", nft);
  
  if (nft.nftData) {
    // Coming from PiNSNftData structure (modal system)
    nftData = nft.nftData.data;
    fields = nftData.content?.fields;
    objectId = nft.objectId;
    extractedName = nft.name || '';
    console.log("🔍 [NFT Transfer] Using PiNSNftData structure");
  } else if (nft.data) {
    // Coming from raw nft data (direct drawer)
    nftData = nft.data;
    fields = nftData.content?.fields;
    objectId = nftData.objectId;
    extractedName = fields?.name || '';
    console.log("🔍 [NFT Transfer] Using raw nft data structure");
  } else {
    console.error("❌ [NFT Transfer] Unknown data structure:", nft);
    // Fallback
    nftData = {};
    fields = {};
    objectId = '';
    extractedName = '';
  }
  
  console.log("🔍 [NFT Transfer] Extracted objectId:", objectId);
  console.log("🔍 [NFT Transfer] Extracted name:", extractedName);
  console.log("🔍 [NFT Transfer] NFT type:", nftData?.type);
  
  // Extract name from fields or display (use extractedName as fallback)
  const name = extractedName || (fields && 'name' in fields ? String(fields.name) : '');
  const piName = name.endsWith('.pi') ? name : `${name}.pi`;

  // Fetch and format expiration date
  useEffect(() => {
    const fetchExpiration = async () => {
      try {
        const cleanName = name.replace('.pi', '');
        const expirationMs = await getNameExpiration(suiClient as unknown as SuiClient, cleanName);
        const formattedExpiration = formatExpirationDate(expirationMs);
        setExpiration(formattedExpiration);
      } catch (error) {
        console.error('[PiNS] Error fetching expiration:', error);
        setExpiration('Unknown');
      }
    };

    if (name) {
      fetchExpiration();
    }
  }, [name, suiClient]);

  // Use the image utility to get consistent image handling
  const imageData = nft.nftData ? nft.nftData : nft;
  const { finalImageUrl, hasImage } = usePinsNftImage(imageData);

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

  // Handle close button click
  const handleClose = () => {
    console.log("🔵 handleClose called in PinsNftSend");
    if (onClose) {
      console.log("🔵 Calling onClose from PinsNftSend");
      onClose();
    }
  };

  // Validate Sui address format (0x followed by 64 hex chars)
  const isValidSuiAddress = (address: string): boolean => {
    const suiAddressRegex = /^0x[a-fA-F0-9]{64}$/;
    return suiAddressRegex.test(address);
  };

  const handleSendNft = async () => {
    // Enhanced validation for recipient address
    if (!recipientAddress.trim()) {
      setSendError("Please enter a recipient address");
      return;
    }

    // Check if address has valid Sui format
    if (!isValidSuiAddress(recipientAddress)) {
      setSendError("Invalid Sui address format");
      return;
    }

    setIsSending(true);
    setSendError("");

    // Debug logging
    console.log("🔍 [NFT Transfer Debug] NFT Data:", {
      objectId: objectId,
      nftType: nftData?.type,
      nftFields: fields,
      fullNftData: nft
    });

    // Additional debugging to understand object structure
    console.log("🔍 [NFT Transfer Debug] Object Analysis:");
    console.log("- Object ID being transferred:", objectId);
    console.log("- Object type:", nftData?.type);
    console.log("- Content fields:", JSON.stringify(fields, null, 2));
    console.log("- Display data:", JSON.stringify(nftData?.display, null, 2));
    console.log("- Full nft structure:", JSON.stringify(nft, null, 2));

    // The objectId from usePinsBatchData is already the correct PiNameOwnership objectId!
    // This is because usePinsBatchData filters by type: `${PINS_PACKAGE_ID}::name::PiNameOwnership`
    let transferObjectId = objectId;
    
    // Enhanced validation for PiNameOwnership type
    const isPiNameOwnership = nftData?.type?.includes('::name::PiNameOwnership') || 
                             nftData?.type?.includes('PiNameOwnership');
    
    if (isPiNameOwnership) {
      console.log("✅ [NFT Transfer] Confirmed PiNameOwnership object:", transferObjectId);
      console.log("✅ [NFT Transfer] Object type:", nftData.type);
    } else {
      console.log("⚠️ [NFT Transfer] Warning: Object type doesn't match PiNameOwnership");
      console.log("⚠️ [NFT Transfer] Object type:", nftData?.type);
      console.log("⚠️ [NFT Transfer] Expected type pattern: '::name::PiNameOwnership'");
      
      // If it's not a PiNameOwnership, we should not use the custom transfer
      // Instead, use standard NFT transfer
      setSendError("This object is not a valid PiNameOwnership NFT");
      setIsSending(false);
      return;
    }

    // Validate object ID format
    if (!transferObjectId || !transferObjectId.startsWith('0x')) {
      console.error("❌ [NFT Transfer] Invalid object ID:", transferObjectId);
      setSendError("Invalid object ID format");
      setIsSending(false);
      return;
    }

    try {
      // 🚨 DETAILED LOGGING BEFORE TRANSACTION
      console.log("🚀 [NFT Transfer] ABOUT TO SEND TRANSACTION:");
      console.log("🚀 [NFT Transfer] Name being transferred:", extractedName);
      console.log("🚀 [NFT Transfer] From (current owner):", "will be determined by wallet");
      console.log("🚀 [NFT Transfer] To (recipient):", recipientAddress);
      console.log("🚀 [NFT Transfer] Object ID to Transfer:", transferObjectId);
      console.log("🚀 [NFT Transfer] Object Type:", nftData?.type);
      console.log("🚀 [NFT Transfer] Has Public Transfer:", nftData?.hasPublicTransfer);
      console.log("🚀 [NFT Transfer] isPiNS flag:", true);
      console.log("🚀 [NFT Transfer] What will happen:");
      console.log("  1. Update PiName owner field to recipient");
      console.log("  2. Update PiName address field to recipient");  
      console.log("  3. Remove old owner from reverse address lookup");
      console.log("  4. Add new owner to reverse address lookup (if they don't have a name)");
      console.log("  5. Transfer PiNameOwnership object to recipient");
      
      // Call the NFT transfer function using PiNS-specific transfer
      await sendNft({
        recipient: recipientAddress,
        objectId: transferObjectId,
        isPiNS: true, // Use PiNS-specific transfer function
        onComplete: async () => {
          console.log("🔵 NFT sent successfully");
          setSendSuccess(true);
          setRecipientAddress("");
          
          setTimeout(() => {
            console.log("🔵 Success timeout completed, closing drawer");
            setSendSuccess(false);
            if (onSuccess) {
              console.log("🔵 Calling onSuccess");
              onSuccess();
            }
            handleClose(); // Use the handleClose function
          }, 3000);
        },
        onError: async (error) => {
          console.error("🔵 Error sending NFT:", error);
          setSendError(error.message);
        }
      });
    } catch (error: any) {
      console.error("🔵 Failed to send NFT:", error);
      setSendError(error.message || "Failed to send NFT");
    } finally {
      setIsSending(false);
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
          
          {/* Send button space (empty in this view) */}
          <div></div>
        </div>
      </div>

      <div className="h-20"></div>

      {/* Recipient Input - Matching AccountSend styling */}
      <div className="relative">
        <input
          type="text"
          placeholder="Recipient Address"
          value={recipientAddress}
          onChange={(e) => {
            setRecipientAddress(e.target.value);
            // Clear error when user starts typing again
            if (sendError) setSendError("");
          }}
          className={cn(
            inputClassName,
            sendError && "border-[#ff4d4d]" // Add red border if there's an error
          )}
          style={{ fontSize: '16px' }} // Prevent iOS zoom
        />
      </div>

      <div className="h-20"></div>

      {/* Send Button - Restored with text */}
      <div className="flex justify-center">
        <button
          onClick={handleSendNft}
          disabled={isSending}
          style={{
            backgroundColor: "rgba(0, 255, 0, 0.1)",
            color: isSending ? "rgba(255, 255, 255, 0.5)" : "#00ff00",
            border: "1px solid rgba(0, 255, 0, 0.5)",
            padding: "12px 24px",
            borderRadius: "8px",
            cursor: isSending ? "not-allowed" : "pointer",
            fontFamily: "monospace",
            fontSize: "16px",
            transition: "all 0.2s ease",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            opacity: isSending ? 0.6 : 1,
            width: "100%",
            height: "48px",
            boxShadow: "0 0 10px rgba(0, 255, 0, 0.2)"
          }}
          onMouseEnter={(e) => {
            if (!isSending) {
              e.currentTarget.style.backgroundColor = "rgba(0, 255, 0, 0.2)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0, 255, 0, 0.1)";
          }}
        >
          {isSending ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner />
              <span className="text-[#00ff00]">Sending...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Send size={16} />
              <span>Send NFT</span>
            </div>
          )}
        </button>
      </div>

      <div className="h-4"></div>

      {/* Error/Success Messages - Matching AccountSend styling */}
      {sendError && (
        <div className="text-[#ff4d4d] text-sm text-center mt-4">
          {sendError}
        </div>
      )}
      {sendSuccess && (
        <div className="text-[#00ff00] text-sm text-center mt-4">
          Transaction successful!
        </div>
      )}
    </div>
  );
}; 